import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { PixelTag } from "@/components/pixel/PixelTag";
import { SectionHeader } from "@/components/pixel/SectionHeader";
import { getAllCategories } from "@/lib/content";
import { PAGE_TOP } from "@/lib/layout";
import { buildMetadata } from "@/lib/seo";

/**
 * Category index.
 *
 * A small addition beyond the spec's route list, for the same reason as the tag
 * index: spec §19's topics row links into individual categories, and without an
 * index there is no way to see the whole taxonomy at once.
 *
 * Categories with no posts are still listed, greyed by their zero count rather
 * than hidden — the taxonomy is a fixed, curated set, and pretending a section
 * does not exist until it has content would misrepresent it.
 */

export const metadata = buildMetadata({
  title: "分类",
  description: "按主题浏览全部文章。",
  path: "/categories",
});

export default function CategoriesPage() {
  const groups = getAllCategories();

  return (
    <Container className={PAGE_TOP}>
      <SectionHeader
        level="h1"
        size="lg"
        id="categories-heading"
        label="分类"
        description="固定的几个方向，每篇文章都属于其中之一。"
      />

      <ul className="grid gap-6 sm:grid-cols-2">
        {groups.map((group) => (
          <li key={group.slug}>
            <article className="px-card px-card--lift h-full p-6">
              <div className="flex items-center justify-between gap-3">
                <PixelTag href={`/categories/${group.slug}`}>
                  {group.name.toUpperCase()}
                </PixelTag>
                <span className="font-pixel text-xs text-text-secondary">
                  {group.items.length} POSTS
                </span>
              </div>

              {group.items.length > 0 && (
                <ul className="mt-5 flex flex-col gap-2">
                  {group.items.slice(0, 3).map((post) => (
                    <li key={post.slug}>
                      <Link
                        href={post.url}
                        className="text-sm text-text-secondary transition-colors duration-[var(--dur-fast)] hover:text-accent"
                      >
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </li>
        ))}
      </ul>
    </Container>
  );
}
