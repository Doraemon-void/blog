import Link from "next/link";

import { PixelIcon } from "@/components/pixel/PixelIcon";
import { cn } from "@/lib/utils";

/**
 * Pagination (spec §24).
 *
 * Spec §24's layout is `← NEWER / 1 2 3 4 / OLDER →`. In a date-descending list
 * "newer" means the previous page and "older" the next one — the opposite of how
 * previous/next usually read, which is why the labels are spelled out rather
 * than shown as bare arrows.
 *
 * These are real `<a>` elements produced by `next/link`. That matters for more
 * than navigation: with client-side pagination the pages beyond the first would
 * have no crawlable link, so a search engine would only ever see the newest
 * posts.
 *
 * A disabled end renders as text rather than a dead link, so the control never
 * promises a destination it cannot reach.
 */

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Builds the href for a page, preserving the other query parameters. */
  buildHref: (page: number) => string;
  className?: string;
}

/** Windowed page numbers: never more than 7, centred on the current page. */
function pageWindow(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const start = Math.min(Math.max(current - 3, 1), total - 6);
  return Array.from({ length: 7 }, (_, i) => start + i);
}

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasNewer = currentPage > 1;
  const hasOlder = currentPage < totalPages;
  const pages = pageWindow(currentPage, totalPages);

  const arrowClass =
    "inline-flex items-center gap-2 font-pixel text-sm tracking-[0.05em] transition-colors duration-[var(--dur-fast)]";

  return (
    <nav
      aria-label="分页导航"
      className={cn(
        "mt-14 flex flex-wrap items-center justify-between gap-4 border-t-2 border-border-soft pt-6",
        className,
      )}
    >
      {hasNewer ? (
        <Link
          href={buildHref(currentPage - 1)}
          className={cn(arrowClass, "text-text-secondary hover:text-accent")}
          rel="prev"
        >
          <PixelIcon name="arrowLeft" size={12} />更新
        </Link>
      ) : (
        <span className={cn(arrowClass, "text-text-secondary/40")}>
          <PixelIcon name="arrowLeft" size={12} />更新
        </span>
      )}

      <ul className="flex items-center gap-2">
        {pages.map((page) => {
          const isCurrent = page === currentPage;
          return (
            <li key={page}>
              <Link
                href={buildHref(page)}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`第 ${page} 页`}
                className={cn(
                  "inline-flex h-9 min-w-9 items-center justify-center border-2 px-2",
                  "font-pixel text-sm tracking-[0.05em]",
                  "rounded-[var(--radius-pixel-sm)] transition-colors duration-[var(--dur-fast)]",
                  isCurrent
                    ? "border-border bg-mint text-on-mint"
                    : "border-border text-text-secondary hover:bg-surface-soft hover:text-text",
                )}
              >
                {page}
              </Link>
            </li>
          );
        })}
      </ul>

      {hasOlder ? (
        <Link
          href={buildHref(currentPage + 1)}
          className={cn(arrowClass, "text-text-secondary hover:text-accent")}
          rel="next"
        >
          更早
          <PixelIcon name="arrowRight" size={12} />
        </Link>
      ) : (
        <span className={cn(arrowClass, "text-text-secondary/40")}>
          更早
          <PixelIcon name="arrowRight" size={12} />
        </span>
      )}
    </nav>
  );
}
