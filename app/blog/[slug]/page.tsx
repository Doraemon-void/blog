import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleHeader } from "@/components/blog/ArticleHeader";
import { ArticleNavigation } from "@/components/blog/ArticleNavigation";
import { MDXContent } from "@/components/blog/MDXContent";
import {
  MobileTableOfContents,
  TableOfContents,
} from "@/components/blog/TableOfContents";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getAdjacent,
  getAllPosts,
  getPostBySlug,
} from "@/lib/content";
import { buildMetadata, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { site } from "@/lib/site.config";

/**
 * Blog post (spec §25, §30).
 *
 * Layout follows spec §30: the article is capped at 760px (spec §9) with a
 * ~200px sticky TOC beside it on desktop, and the TOC becomes a collapsible
 * block at the top of the article on mobile.
 *
 * The sticky column is wrapped in its own `sticky` element rather than making
 * the aside sticky, so the offset that clears the 72px header lives in one
 * place — and that same offset is mirrored by `scroll-margin-top` on headings in
 * globals.css, which is what stops an anchor jump from hiding a heading under
 * the header.
 */

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

/** Pre-render every published post at build time. */
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return buildMetadata({ title: "找不到页面", noIndex: true });
  }

  return buildMetadata({
    title: post.title,
    description: post.description,
    path: post.url,
    type: "article",
    publishedTime: post.date,
    modifiedTime: post.updated ?? undefined,
    tags: post.tags,
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  // Spec §51 — drafts are hidden in production. `getAllPosts` already excludes
  // them from listings, but a draft is still directly readable by URL, so the
  // page has to refuse it as well or "hidden" would only mean "unlisted".
  if (post.draft && process.env.NODE_ENV === "production") notFound();

  const { previous, next } = getAdjacent("blog", post.slug);

  return (
    <Container className="pt-12 md:pt-16">
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: site.title, path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: post.url },
        ])}
      />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-16">
        <article className="max-w-[760px]">
          {post.draft && (
            <p className="mb-6 border-2 border-dashed border-coral px-4 py-2 font-pixel text-sm tracking-[0.05em] text-text-secondary">
              DRAFT · 这篇文章还没发布，只在开发环境可见
            </p>
          )}

          <ArticleHeader
            title={post.title}
            description={post.description}
            date={post.date}
            updated={post.updated}
            category={{
              label: post.category.toUpperCase(),
              href: `/categories/${post.categorySlug}`,
            }}
            tags={post.tags}
            readingTime={post.readingTime}
          />

          <MobileTableOfContents entries={post.toc} />

          <MDXContent source={post.body} />

          <ArticleNavigation previous={previous} next={next} />
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <TableOfContents entries={post.toc} />
          </div>
        </aside>
      </div>
    </Container>
  );
}
