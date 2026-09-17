import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostList } from "@/components/blog/PostList";
import { Container } from "@/components/layout/Container";
import { SectionHeader } from "@/components/pixel/SectionHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllCategories, getCategoryBySlug, toPostSummary } from "@/lib/content";
import { PAGE_TOP } from "@/lib/layout";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { categories, site } from "@/lib/site.config";

/**
 * Category page (spec §54).
 *
 * Spec §54 fixes the category list at Programming / Computer Systems / AI /
 * Graphics / Life. Unlike tags, categories are a closed set validated in
 * `lib/content/source.ts`, so an unknown slug here is a genuine 404 rather than
 * an empty page.
 *
 * The category's own description is shown, which is the advantage a curated
 * taxonomy has over free-form tags — it can explain what belongs in it.
 */

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const group = getCategoryBySlug(category);

  if (!group) return buildMetadata({ title: "找不到分类", noIndex: true });

  const definition = categories.find((entry) => entry.slug === group.slug);

  return buildMetadata({
    title: group.name,
    description: definition?.description,
    path: `/categories/${group.slug}`,
    tags: [group.name],
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const group = getCategoryBySlug(category);

  if (!group) notFound();

  const definition = categories.find((entry) => entry.slug === group.slug);
  const otherCategories = getAllCategories().filter(
    (entry) => entry.slug !== group.slug && entry.items.length > 0,
  );

  return (
    <Container className={PAGE_TOP}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: site.title, path: "/" },
          { name: "Categories", path: "/categories" },
          { name: group.name, path: `/categories/${group.slug}` },
        ])}
      />

      <SectionHeader
        level="h1"
        size="lg"
        id="category-heading"
        label={group.name.toUpperCase()}
        description={definition?.description}
      />

      <p className="mb-8 font-pixel text-sm tracking-[0.05em] text-text-secondary">
        {group.items.length} 篇
      </p>

      <PostList
        posts={group.items.map(toPostSummary)}
        emptyMessage="这个分类下还没有文章。"
      />

      {otherCategories.length > 0 && (
        <nav
          aria-label="其它分类"
          className="mt-16 border-t-2 border-border-soft pt-8"
        >
          <h2 className="mb-4 font-pixel text-sm tracking-[0.06em] text-text-secondary">
            其它分类
            <span aria-hidden="true" className="text-accent">
              _
            </span>
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {otherCategories.map((entry) => (
              <li key={entry.slug}>
                <a
                  href={`/categories/${entry.slug}`}
                  className="text-text-secondary transition-colors duration-[var(--dur-fast)] hover:text-accent"
                >
                  {entry.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </Container>
  );
}
