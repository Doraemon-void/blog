#!/usr/bin/env node
/**
 * Content check — catches problem content before `next build` does.
 *
 * Run with `npm run check:content`.
 *
 * Why this exists: `next build` stops at the FIRST bad file, and its message for
 * a syntax problem is the MDX parser's own wording — ``Unexpected character `-`
 * before name`` — which does not tell you what to write instead. This reports
 * every problem across every file, with the file, the line, and the fix.
 *
 * Two classes of problem, and the difference matters:
 *
 *   ERROR   The MDX compiler genuinely refuses the file. The build WILL fail.
 *   WARN    It compiles, so the build passes, but the page renders wrong or
 *           breaks at render time. These are the dangerous ones — nothing
 *           tells you they are there.
 *
 * The ERROR class is not detected with hand-written regexes. Two earlier
 * attempts at that were both wrong: `[A-Za-z]` missed CJK (`<填写内容>`) and
 * `-` (`<-`), and a "digits are safe" rule missed `<1>`. Instead each file is
 * handed to the real MDX compiler, so the result is the compiler's own verdict
 * rather than my guess about it.
 *
 * Note on scope: files are compiled without this project's remark/rehype
 * plugins. Every failure seen in practice is a base-syntax failure that happens
 * before plugins run, so this catches the class that matters.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const CONTENT = join(ROOT, "content");
const PUBLIC = join(ROOT, "public");

/** Which frontmatter fields each content kind requires. */
const REQUIRED_FIELDS = {
  blog: ["title", "date", "category"],
  notes: ["title", "date"],
  projects: ["title", "date"],
};

/** Fields each kind must NOT have, to catch copy-paste between folders. */
const FORBIDDEN_FIELDS = {
  blog: [],
  notes: ["category"],
  projects: [],
};

/* -------------------------------------------------------------------------- */

const require = createRequire(join(ROOT, "package.json"));
const { compile } = await import(
  pathToFileURL(require.resolve("@mdx-js/mdx")).href
);
const matter = require("gray-matter");

const errors = [];
const warnings = [];
const checked = [];

/** Walk a content folder for .md / .mdx files. */
function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full);
    return /\.mdx?$/.test(entry.name) && !entry.name.startsWith("_")
      ? [full]
      : [];
  });
}

/**
 * Strip fenced and inline code so the regex checks only look at prose.
 * The compiler check does not need this — MDX handles code correctly itself.
 */
function proseLines(body) {
  const out = [];
  let inFence = false;
  let fenceChar = null;

  body.split(/\r?\n/).forEach((line, index) => {
    const fence = /^\s*(```|~~~)/.exec(line);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceChar = fence[1][0];
      } else if (line.trim().startsWith(fenceChar)) {
        inFence = false;
      }
      return;
    }
    if (inFence) return;
    out.push({ line: index + 1, text: line.replace(/`[^`]*`/g, "") });
  });

  return out;
}

/**
 * Does this single line, compiled on its own, break MDX?
 *
 * This is the trick that makes the tool better than `next build`. The compiler
 * stops at the first error in a file, so a naive whole-file compile reports one
 * problem and you fix it, re-run, and hit the next one — exactly the
 * whack-a-mole the checker is supposed to remove.
 *
 * Compiling candidate lines individually sidesteps that: the first error does
 * not hide the rest, and each verdict comes with the line it belongs to.
 */
async function breaksAlone(line) {
  const trimmed = line.trim();
  if (trimmed === "") return null;
  try {
    await compile(trimmed);
    return null;
  } catch (error) {
    return String(error.message).split("\n")[0];
  }
}

/**
 * Patterns that are worth a second look, independent of whether the file
 * compiles as a whole. Deliberately broad — the per-line compile decides
 * severity, so a false candidate costs nothing.
 */
const SUSPECTS = [
  {
    re: /<(?!\s)/,
    why: "尖括号 `<` 后面紧跟了非空白字符",
  },
  {
    re: /\{[^}\n]+\}/,
    why: "花括号 `{…}` 里有内容",
  },
];

for (const kind of Object.keys(REQUIRED_FIELDS)) {
  for (const file of listFiles(join(CONTENT, kind))) {
    const rel = relative(ROOT, file).split("\\").join("/");
    const raw = readFileSync(file, "utf8");
    checked.push(rel);

    /* ---- 1. frontmatter ---- */

    let body = raw;
    let data = {};

    try {
      const parsed = matter(raw);
      body = parsed.content;
      data = parsed.data;
    } catch (error) {
      errors.push({
        file: rel,
        line: 1,
        message: `frontmatter 无法解析：${String(error.message).split("\n")[0]}`,
        fix: "检查开头的 --- 区块，YAML 缩进和引号是否配对",
      });
      continue;
    }

    for (const field of REQUIRED_FIELDS[kind]) {
      const value = data[field];
      if (value === undefined || value === null || value === "") {
        errors.push({
          file: rel,
          line: 1,
          message: `缺少必填字段 "${field}"`,
          fix: `在开头的 --- 区块里补上 ${field}: ...`,
        });
      }
    }

    for (const field of FORBIDDEN_FIELDS[kind]) {
      if (data[field] !== undefined) {
        warnings.push({
          file: rel,
          line: 1,
          message: `多了一个 "${field}" 字段（${kind} 不需要它）`,
          fix: "删掉即可，不影响渲染",
        });
      }
    }

    /* ---- 2. does the file compile at all? ---- */

    let fileBroken = false;
    try {
      await compile(body);
    } catch (error) {
      fileBroken = true;
      errors.push({
        file: rel,
        line: null,
        message: `MDX 无法编译：${String(error.message).split("\n")[0]}`,
        fix: "下面标了 ✗ 的行是最可疑的位置",
      });
    }

    /* ---- 3. line-level suspects, each verified by its own compile ---- */

    const lines = proseLines(body);

    for (const { line, text } of lines) {
      /* ---- 4. image paths ---- */

      for (const match of text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
        const src = match[1].trim();
        if (/^https?:\/\//.test(src)) continue;

        if (!src.startsWith("/")) {
          warnings.push({
            file: rel,
            line,
            message: `图片用了相对路径：${src}`,
            fix: "改成以 / 开头的绝对路径，并把图片放进 public/",
          });
          continue;
        }

        if (!existsSync(join(PUBLIC, src.replace(/^\//, "")))) {
          errors.push({
            file: rel,
            line,
            message: `图片文件不存在：public${src}`,
            fix: "把图片复制到 public/ 对应位置",
          });
        }
      }

      /* ---- 5. Obsidian leftovers ---- */

      const OBSIDIAN = [
        { re: /<span\s+style=/i, what: "Obsidian 彩色标注 <span style=...>", fix: "改成 **加粗** 或行内代码" },
        { re: /!\[\[/, what: "Obsidian 图片嵌入 ![[...]]", fix: "改成 ![说明](/路径/图片.png) 并把图片放进 public/" },
        { re: /\[\[/, what: "Obsidian 双链 [[...]]", fix: "改成 [显示文字](/notes/文件名)" },
        { re: /\$[^$\n]{1,60}\$/, what: "LaTeX 公式 $...$（本站没装数学插件）", fix: "换成 Unicode 符号，如 → ⇔" },
        { re: /[^=]==[^=\n]{1,60}==/, what: "Obsidian 高亮 ==...==", fix: "改成 **加粗**" },
      ];

      for (const { re, what, fix } of OBSIDIAN) {
        if (re.test(text)) {
          warnings.push({ file: rel, line, message: `残留 ${what}`, fix });
        }
      }

      /* ---- 6. angle brackets and braces ---- */

      for (const { re, why } of SUSPECTS) {
        if (!re.test(text)) continue;

        const reason = await breaksAlone(text);
        const excerpt = text.trim().slice(0, 60);

        if (reason) {
          errors.push({
            file: rel,
            line,
            message: `${why} —— 单独编译这行会失败`,
            detail: `${excerpt}\n       ${reason}`,
            fix: hint(reason),
          });
        } else {
          warnings.push({
            file: rel,
            line,
            message: `${why}（这行单独编译能过，但注意渲染结果）`,
            detail: excerpt,
            fix: "包成行内代码最稳妥",
          });
        }
      }
    }

    // A file that fails to compile must have at least one culprit above. If it
    // does not, the checker has a blind spot and should say so rather than let
    // the build fail with a message it never explained.
    if (fileBroken) {
      const hasCulprit = errors.some(
        (item) => item.file === rel && /单独编译这行会失败/.test(item.message),
      );
      if (!hasCulprit) {
        errors.push({
          file: rel,
          line: null,
          message: "文件编译失败，但没有定位到具体行（检查器的盲区）",
          fix: "把这行报错发我，需要补充检测规则",
        });
      }
    }
  }
}

/** Turn a compiler message into actionable advice. */
function hint(message) {
  if (/Unexpected character `[=-]`/.test(message))
    return "改成 → ，或把整个片段包成行内代码（`<-`、`<=`）";
  if (/Unexpected character `\d`/.test(message))
    return "包成行内代码，如 `<1>`";
  if (/Unexpected character `,`/.test(message))
    return "泛型里的逗号，如 Result<T, E>，整体包成行内代码";
  if (/Expected a closing tag/.test(message))
    return "尖括号被当成 HTML 标签了，如 `<填写内容>`、`List<int>`，包成行内代码";
  if (/Unexpected end of file in name/.test(message))
    return "有一个没写完的尖括号，如 `a<b`，包成行内代码";
  if (/parse expression with acorn/.test(message))
    return "花括号里不是合法的 JS 表达式，如 `{:?}`，包成行内代码";
  return "把这一行里的 < > { } 包进反引号，或参照教程第 3.1 节";
}

/* -------------------------------------------------------------------------- */
/* Report                                                                     */
/* -------------------------------------------------------------------------- */

function printGroup(title, list, marker) {
  if (list.length === 0) return;
  console.log(`\n${title}\n`);

  const byFile = new Map();
  for (const item of list) {
    if (!byFile.has(item.file)) byFile.set(item.file, []);
    byFile.get(item.file).push(item);
  }

  for (const [file, items] of byFile) {
    console.log(`  ${file}`);
    for (const item of items) {
      const where = item.line === null ? "" : `第 ${item.line} 行  `;
      console.log(`    ${marker} ${where}${item.message}`);
      if (item.detail) {
        for (const line of item.detail.split("\n")) {
          console.log(`         ${line}`);
        }
      }
      console.log(`         → ${item.fix}`);
    }
    console.log();
  }
}

console.log(`检查了 ${checked.length} 个内容文件`);
printGroup(`会阻断构建的问题（${errors.length}）`, errors, "✗");
printGroup(`不会报错但显示不对（${warnings.length}）`, warnings, "!");

if (errors.length === 0 && warnings.length === 0) {
  console.log("\n全部通过，没有发现问题。\n");
  process.exit(0);
}

if (errors.length === 0) {
  console.log(`只有警告，构建能通过，但建议处理。\n`);
  process.exit(0);
}

console.log(`${errors.length} 个问题会让 \`npm run build\` 失败，请先修掉。\n`);
process.exit(1);
