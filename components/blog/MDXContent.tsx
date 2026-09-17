import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";

import { CodeBlock } from "@/components/blog/CodeBlock";
import { mdxOptions } from "@/lib/mdx";

/**
 * Article body renderer.
 *
 * The only place `next-mdx-remote` is invoked. Routing every article, note and
 * project body through this component means the component overrides below are
 * defined once — a stray `<a>` or `<img>` cannot appear in one section with
 * different behaviour than another.
 */

function MdxLink({
  href = "",
  children,
  ...props
}: React.ComponentPropsWithoutRef<"a">) {
  const isExternal = /^https?:\/\//.test(href);

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" {...props}>
        {children}
      </a>
    );
  }

  // Same-site links go through next/link so they stay client-side navigations.
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}

/**
 * Spec §47 requires alt text on every image. Rather than let a missing alt
 * through silently, an empty alt is emitted (which is correct for decoration)
 * but the element still renders so the layout is unaffected.
 *
 * A plain `<img>` rather than `next/image`, deliberately: `next/image` needs
 * intrinsic width and height to reserve space, and MDX-authored images do not
 * declare them. Guessing dimensions for author content would be worse than
 * accepting the lint warning — the reader's layout would jump either way.
 *
 * Note spec §29: photography must NOT get `image-rendering: pixelated`. That is
 * opt-in per image via `className="is-pixel-art"`, never applied globally.
 */
function MdxImage({
  alt = "",
  ...props
}: React.ComponentPropsWithoutRef<"img">) {
  // eslint-disable-next-line @next/next/no-img-element -- see the note above
  return <img alt={alt} loading="lazy" decoding="async" {...props} />;
}

const components = {
  pre: CodeBlock,
  a: MdxLink,
  img: MdxImage,
};

export function MDXContent({ source }: { source: string }) {
  return (
    <div className="prose-pixel">
      <MDXRemote source={source} components={components} options={mdxOptions} />
    </div>
  );
}
