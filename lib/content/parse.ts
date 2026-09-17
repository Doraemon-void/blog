import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import type { TocEntry } from "./types";

/**
 * Markdown analysis — the single place that turns an MDX body into structured
 * metadata (TOC, plain text, excerpt source).
 *
 * This runs on the *raw markdown*, independently of whatever renders the MDX
 * to React. That separation is deliberate: the TOC, the search index, the
 * reading time and the excerpt all keep working even if the MDX renderer is
 * swapped out, and none of them can drift from each other.
 */

const processor = unified().use(remarkParse).use(remarkGfm);

/**
 * MDX allows ESM at the top of a file. Plain markdown parsing would treat those
 * lines as paragraph text, so they are dropped before analysis. This only
 * affects the analysis copy — the rendered body keeps them.
 */
function stripEsm(body: string): string {
  return body
    .split("\n")
    .filter((line) => !/^\s*(import|export)\s/.test(line))
    .join("\n");
}

export interface MarkdownAnalysis {
  /** h2/h3 headings in document order, ids matching rehype-slug exactly. */
  toc: TocEntry[];
  /** Whole document as flat prose — feeds the search index. */
  plainText: string;
  /** First paragraph only — the excerpt fallback when frontmatter has none. */
  firstParagraph: string;
}

export function analyzeMarkdown(body: string): MarkdownAnalysis {
  const tree = processor.parse(stripEsm(body));

  // One slugger for the whole document, fed every heading depth in order.
  // rehype-slug does exactly this, and it de-duplicates by appending -1, -2 …
  // So h1s must be slugged too even though the TOC never shows them — skipping
  // them would desync the counters and produce mismatched anchor ids.
  const slugger = new GithubSlugger();
  const toc: TocEntry[] = [];

  visit(tree, "heading", (node) => {
    const text = toString(node).trim();
    const id = slugger.slug(text);
    if (node.depth === 2 || node.depth === 3) {
      toc.push({ id, text, depth: node.depth });
    }
  });

  // Only the first paragraph counts for excerpts. Taking the first N
  // characters of the whole document would surface a code block or a heading
  // when a post happens to open with one.
  let firstParagraph = "";
  visit(tree, "paragraph", (node, index, parent) => {
    if (firstParagraph) return;
    // Skip paragraphs nested inside lists/blockquotes so a bullet list at the
    // top of a note doesn't become its summary sentence.
    if (parent && parent.type !== "root") return;
    if (typeof index === "number" && index > 8) return;
    firstParagraph = toString(node).trim();
  });

  const plainText = toString(tree).replace(/\s+/g, " ").trim();

  return { toc, plainText, firstParagraph };
}
