import Link from "next/link";

import { PixelIcon } from "@/components/pixel/PixelIcon";
import { cn } from "@/lib/utils";

/**
 * Blog search + category filter (spec §21, §22).
 *
 * Spec §21 wants a search box and category/tag filters; spec §22 wants the
 * filter row to read `ALL PROGRAMMING SYSTEMS AI …`, mark the active one in
 * mint, scroll horizontally on mobile, and explicitly not become a dropdown.
 *
 * Everything here is server-rendered links and a plain `GET` form, which is a
 * deliberate choice over a client-side filter:
 *
 * - Filtered and paginated views get real URLs, so they are shareable,
 *   bookmarkable and crawlable. A client-only filter produces one URL for every
 *   possible state, which search engines cannot index — a poor trade for a blog
 *   whose whole purpose is being found.
 * - It costs no JavaScript at all, and the controls work before hydration.
 *
 * The one thing it gives up is instant filtering, which the ⌘K dialog already
 * provides for readers who want it (spec §40).
 */

/**
 * A partial query for the blog index.
 *
 * `undefined` means "leave this parameter as it is"; `null` means "remove it".
 * The distinction matters for the ALL filter: choosing ALL has to clear the
 * category, and passing `undefined` there would silently keep the old one.
 */
export interface BlogQuery {
  category?: string | null;
  tag?: string | null;
  q?: string | null;
  page?: number | null;
}

export interface BlogFilterBarProps {
  categories: { slug: string; label: string }[];
  activeCategory: string | null;
  activeTag: string | null;
  query: string;
  buildHref: (query: BlogQuery) => string;
}

export function BlogFilterBar({
  categories,
  activeCategory,
  activeTag,
  query,
  buildHref,
}: BlogFilterBarProps) {
  const filters = [
    { slug: null as string | null, label: "全部" },
    ...categories.map((category) => ({
      slug: category.slug,
      label: category.label,
    })),
  ];

  return (
    <div className="mb-10">
      {/* Search. A GET form to the same route, so the result is a URL. */}
      <form action="/blog" method="get" role="search" className="mb-6">
        {activeCategory && (
          <input type="hidden" name="category" value={activeCategory} />
        )}
        {activeTag && <input type="hidden" name="tag" value={activeTag} />}

        <label
          htmlFor="blog-search"
          className="mb-2 block font-pixel text-sm tracking-[0.06em] text-text-secondary"
        >
          搜索随笔
          <span aria-hidden="true" className="text-accent">
            _
          </span>
        </label>

        <div className="px-card flex items-center gap-2 px-3 py-1.5">
          <span aria-hidden="true" className="font-pixel text-sm text-accent">
            &gt;
          </span>
          <input
            id="blog-search"
            type="search"
            name="q"
            defaultValue={query}
            placeholder=""
            autoComplete="off"
            className="w-full bg-transparent py-2 font-pixel text-sm tracking-[0.02em] text-text outline-none placeholder:text-text-secondary/60"
          />
          <button
            type="submit"
            className="px-btn px-btn--sm shrink-0"
            aria-label="搜索"
          >
            <PixelIcon name="search" size={12} />
            搜索
          </button>
        </div>
      </form>

      {/* Category filter (spec §22). Horizontally scrollable on mobile rather
          than wrapped, so the row keeps its shape at every width.

          Rendered only when there is something to filter. The search field
          above stays either way — it is a separate control, and hiding it with
          the chips was wrong: an empty site still benefits from being
          searchable, and the request was to blank its example text, not to
          remove it. */}
      {filters.length > 1 && (
        <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <ul className="flex w-max items-center gap-2 sm:w-auto sm:flex-wrap">
          {filters.map((filter) => {
            const isActive = filter.slug === activeCategory;
            return (
              <li key={filter.slug ?? "all"}>
                <Link
                  href={buildHref({
                    category: filter.slug,
                    // Changing the category is a new browse, so paging resets.
                    page: null,
                  })}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1 border-2 border-border px-3 py-1.5",
                    "rounded-[var(--radius-pixel-sm)] font-pixel text-sm tracking-[0.05em]",
                    "transition-colors duration-[var(--dur-fast)]",
                    isActive
                      ? "bg-mint text-on-mint"
                      : "bg-surface text-text-secondary hover:bg-surface-soft hover:text-text",
                  )}
                >
                  <span aria-hidden="true" className="opacity-45">
                    [
                  </span>
                  {filter.label}
                  <span aria-hidden="true" className="opacity-45">
                    ]
                  </span>
                </Link>
              </li>
            );
          })}
          </ul>
        </div>
      )}

      {activeTag && (
        <p className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
          正在筛选标签
          <span className="font-pixel text-accent">#{activeTag}</span>
          <Link
            href={buildHref({ tag: null, page: null })}
            className="inline-flex items-center gap-1 font-pixel text-xs tracking-[0.05em] text-text-secondary underline decoration-2 underline-offset-2 hover:text-accent"
          >
            <PixelIcon name="close" size={10} />
            清除
          </Link>
        </p>
      )}
    </div>
  );
}
