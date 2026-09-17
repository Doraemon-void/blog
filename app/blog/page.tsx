import { BlogFilterBar, type BlogQuery } from "@/components/blog/BlogFilterBar";
import { Pagination } from "@/components/blog/Pagination";
import { PostList } from "@/components/blog/PostList";
import { Container } from "@/components/layout/Container";
import { SectionHeader } from "@/components/pixel/SectionHeader";
import { getAllPosts, getCategoryFilters, toPostSummary } from "@/lib/content";
import { PAGE_TOP } from "@/lib/layout";
import { buildMetadata } from "@/lib/seo";
import { slugify } from "@/lib/utils";

/**
 * Blog index (spec §21–§24).
 *
 * All four controls — search, category filter, tag filter and pagination — are
 * URL-driven and server-rendered. Spec §21 wants them on the page and spec §22
 * wants the filter to be a row of links rather than a dropdown; keeping the
 * state in the query string means every filtered view also gets a real,
 * shareable, crawlable URL. A client-side filter would collapse all of them into
 * one address, which for a blog about being read is the wrong trade.
 *
 * The search matches on `plainText` too, so a post can be found by a phrase in
 * its body rather than only from its title.
 */

const PER_PAGE = 8;

interface BlogPageProps {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    q?: string;
    page?: string;
  }>;
}

export const metadata = buildMetadata({
  title: "随笔",
  description: "零碎的知识、临时记下的想法，以及还没长成笔记的东西。",
  path: "/blog",
});

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;

  const activeCategory = params.category ?? null;
  const activeTag = params.tag ?? null;
  const query = (params.q ?? "").trim();
  const requestedPage = Number.parseInt(params.page ?? "1", 10);

  let posts = getAllPosts();

  if (activeCategory) {
    posts = posts.filter((post) => post.categorySlug === slugify(activeCategory));
  }

  if (activeTag) {
    const wanted = slugify(activeTag);
    posts = posts.filter((post) =>
      post.tags.some((tag) => slugify(tag) === wanted),
    );
  }

  if (query) {
    const needle = query.toLowerCase();
    posts = posts.filter((post) =>
      [post.title, post.description, post.category, ...post.tags, post.plainText]
        .join("\n")
        .toLowerCase()
        .includes(needle),
    );
  }

  const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const currentPage = Math.min(
    Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1),
    totalPages,
  );

  const pageItems = posts
    .slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
    .map(toPostSummary);

  /**
   * `undefined` keeps a parameter, `null` clears it. The distinction is what
   * lets the ALL filter clear the category while the search box preserves it.
   */
  function buildHref(overrides: BlogQuery): string {
    const search = new URLSearchParams();

    const category =
      overrides.category === undefined ? activeCategory : overrides.category;
    const tag = overrides.tag === undefined ? activeTag : overrides.tag;
    const q = overrides.q === undefined ? query : overrides.q;
    const page = overrides.page;

    if (category) search.set("category", category);
    if (tag) search.set("tag", tag);
    if (q) search.set("q", q);
    if (typeof page === "number" && page > 1) search.set("page", String(page));

    const qs = search.toString();
    return qs ? `/blog?${qs}` : "/blog";
  }

  const isFiltered = Boolean(activeCategory || activeTag || query);

  /**
   * Only categories that actually have posts.
   *
   * `getCategoryFilters()` returns the whole fixed taxonomy, which meant the
   * page showed four filter chips leading to empty lists — and with no posts at
   * all, a row of chips above a "0 篇" count, which is what prompted removing it.
   * Filtering by count is the general fix rather than deleting the row: the chips
   * come back on their own as soon as there is something to filter.
   */
  const populatedCategories = getCategoryFilters()
    .filter((category) => category.count > 0)
    .map((category) => ({ slug: category.slug, label: category.label }));

  return (
    <Container className={PAGE_TOP}>
      <SectionHeader
        level="h1"
        size="lg"
        id="blog-heading"
        label="随笔"
        description="零碎的知识、临时记下的想法，以及还没长成笔记的东西。"
      />

      {/* The search field is always shown; the category chips render only when
          there are posts to filter. `BlogFilterBar` decides that from the list
          it is given, so an empty site shows a bare search box rather than a row
          of chips leading nowhere. */}
      <BlogFilterBar
        categories={populatedCategories}
        activeCategory={activeCategory}
        activeTag={activeTag}
        query={query}
        buildHref={buildHref}
      />

      <p className="mb-6 font-pixel text-sm tracking-[0.05em] text-text-secondary">
        {posts.length} 篇
        {isFiltered && " · 已筛选"}
      </p>

      <PostList
        posts={pageItems}
        emptyMessage={
          isFiltered
            ? "没有匹配的文章。试试换个关键词，或清除筛选。"
            : "这里还没有文章。"
        }
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        buildHref={(page) => buildHref({ page })}
      />
    </Container>
  );
}
