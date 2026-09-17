import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { PluggableList } from "unified";

import { doraPixelTheme } from "./shiki-theme";

/**
 * The MDX rendering configuration — deliberately the only file that knows which
 * MDX library is in use.
 *
 * Everything derived *from* an MDX body (table of contents, reading time, plain
 * text for search, excerpts) is produced by `lib/content/parse.ts` from the raw
 * markdown, independently of this renderer. If this library ever has to be
 * swapped — `next-mdx-remote`'s peer range is loose and its compatibility with
 * new React versions is not guaranteed — that is a change to this file and
 * `MDXContent.tsx`, not a rewrite of the content layer.
 */

const prettyCodeOptions: PrettyCodeOptions = {
  theme: doraPixelTheme,
  // The background comes from the `--code-bg` token in globals.css, so the block
  // follows the theme instead of being fixed by the highlighter.
  keepBackground: false,
  // Unknown languages render as plain text rather than throwing during a build.
  defaultLang: { block: "text", inline: "text" },
  // Inline code is styled by CSS; running the highlighter over it adds nothing
  // and costs a grammar lookup per span.
  bypassInlineCode: true,
};

/* -------------------------------------------------------------------------- */
/* Code chrome normalisation                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The minimum hast shape this plugin needs.
 *
 * The tree is walked with plain recursion rather than `unist-util-visit`: the
 * visitor's generics fight `unknown[]` children from the MDX pipeline, and the
 * plugin only needs to find two element types. A recursive walk is shorter and
 * has no typing escape hatches in it.
 */
interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

function isElement(node: HastNode, tagName: string): boolean {
  return node.type === "element" && node.tagName === tagName;
}

function hastText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(hastText).join("");
}

function readProp(
  node: HastNode,
  camel: string,
  hyphenated: string,
): string | undefined {
  // Which of the two forms a property name takes depends on which hast builder
  // produced the tree, so both are checked rather than assumed.
  const value = node.properties?.[camel] ?? node.properties?.[hyphenated];
  return typeof value === "string" && value !== "" ? value : undefined;
}

/**
 * A figure is a code figure when it directly wraps a `<pre>`.
 *
 * Deliberately structural rather than attribute-based. The first version of this
 * tested for a `rehypeprettycode` substring in the figure's property names, which
 * silently failed: the key is `data-rehype-pretty-code-figure` and it keeps its
 * hyphens, so the hyphen-less search never matched, the figure was never
 * unwrapped, and every code block rendered as `CODE` with its filename stranded
 * in a stray `<figcaption>`. Wrapping a `<pre>` is what actually defines the
 * thing, so that is what is tested.
 */
function isCodeFigure(node: HastNode): boolean {
  if (!isElement(node, "figure")) return false;
  return (node.children ?? []).some((child) => isElement(child, "pre"));
}

/**
 * The fence language.
 *
 * rehype-pretty-code 0.14 puts `data-language` on the element; older versions
 * used a `language-xxx` class on the `<code>` child. Both are read, because
 * relying on only the newer one is how the title bar ended up showing `CODE`
 * for every block in the first place.
 */
function readLanguage(node: HastNode): string | undefined {
  const direct = readProp(node, "dataLanguage", "data-language");
  if (direct) return direct;

  for (const child of node.children ?? []) {
    if (!isElement(child, "code")) continue;

    const onCode = readProp(child, "dataLanguage", "data-language");
    if (onCode) return onCode;

    const className = child.properties?.className;
    const classes = Array.isArray(className) ? className.map(String) : [];
    const match = classes.find((name) => name.startsWith("language-"));
    if (match) return match.slice("language-".length);
  }

  return undefined;
}

/**
 * Flattens rehype-pretty-code's output into a plain `<pre data-title="…">`.
 *
 * The highlighter wraps a titled block in `<figure><figcaption>…</figcaption>
 * <pre>…</pre></figure>` but leaves an untitled one as a bare `<pre>`. Two shapes
 * for one concept means every consumer has to handle both.
 *
 * Rather than branch in React, the title is lifted onto the `<pre>` as a
 * `data-title` and the figure is dropped. The result is one shape, one
 * component, and a title bar that exists whether or not the author named the
 * file — which spec §27 asks for, since it wants a filename and COPY on the
 * block regardless.
 */
function rehypeCodeChrome() {
  return (tree: HastNode) => {
    const walk = (node: HastNode) => {
      if (!node.children) return;

      for (let index = 0; index < node.children.length; index += 1) {
        const child = node.children[index];

        if (isCodeFigure(child)) {
          let title: string | undefined;
          let pre: HastNode | undefined;

          for (const grandchild of child.children ?? []) {
            if (isElement(grandchild, "figcaption")) {
              title = hastText(grandchild).trim();
            }
            if (isElement(grandchild, "pre")) pre = grandchild;
          }

          if (pre) {
            pre.properties = { ...(pre.properties ?? {}) };
            if (title) pre.properties.dataTitle = title;
            // Replace the figure with the pre, collapsing two shapes into one.
            node.children[index] = pre;
            continue;
          }
        }

        walk(child);
      }
    };

    walk(tree);

    // Second pass: every `pre` that still has no title gets its language, so a
    // bare block still has something to show in the title bar.
    const titleFromLanguage = (node: HastNode) => {
      if (isElement(node, "pre")) {
        const properties = (node.properties ??= {});
        if (!properties.dataTitle) {
          const language = readLanguage(node);
          properties.dataTitle = language ? language.toUpperCase() : "CODE";
        }
      }
      for (const child of node.children ?? []) titleFromLanguage(child);
    };

    titleFromLanguage(tree);

    // Fail loudly rather than degrade quietly. The first version of this plugin
    // stopped matching after a dependency changed its attribute shape, and the
    // only symptom was every code block on the site quietly showing `CODE`
    // instead of its filename — nothing errored, and it took a screenshot to
    // notice. If a code figure survives the walk, that has happened again.
    const leftovers: string[] = [];
    const collect = (node: HastNode) => {
      if (isCodeFigure(node)) {
        leftovers.push(
          hastText(node).trim().slice(0, 40) || "(untitled code block)",
        );
      }
      for (const child of node.children ?? []) collect(child);
    };
    collect(tree);

    if (leftovers.length > 0) {
      throw new Error(
        `[mdx] ${leftovers.length} code figure(s) were not normalised into a ` +
          `<pre data-title>: ${leftovers.join("; ")}. The rehype code-chrome ` +
          `plugin in lib/mdx.ts no longer matches rehype-pretty-code's output.`,
      );
    }
  };
}

/* -------------------------------------------------------------------------- */

// Annotated as `PluggableList` rather than left to inference: an array mixing
// bare plugins with `[plugin, options]` tuples infers as a union that unified's
// own type does not accept, and the error it produces points at the consumer
// instead of here.
const remarkPlugins: PluggableList = [remarkGfm];

const rehypePlugins: PluggableList = [
  rehypeSlug,
  [
    rehypeAutolinkHeadings,
    {
      behavior: "append",
      properties: {
        className: ["heading-anchor"],
        ariaLabel: "本节链接",
        tabIndex: -1,
      },
      content: { type: "text", value: "#" },
    },
  ],
  [rehypePrettyCode, prettyCodeOptions],
  rehypeCodeChrome,
];

export const mdxOptions = {
  mdxOptions: {
    remarkPlugins,
    rehypePlugins,
  },
};
