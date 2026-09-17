import Link from "next/link";

import { PixelIcon } from "@/components/pixel/PixelIcon";
import type { ContentItem } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Previous / next navigation at the foot of an article (spec §31).
 *
 * Spec §31 shows `← 上一篇` on the left and `下一篇 →` on the right, separated
 * by a pixel divider. "Previous" means the older article and "next" the newer
 * one — the convention readers expect, and the reason `getAdjacent` walks a
 * date-descending list the way it does.
 *
 * When an article is at either end of the list the slot still renders, holding
 * its place with a muted label. Removing it would make the two-column layout
 * jump around between articles, which reads as a rendering bug.
 */

export interface ArticleNavigationProps {
  previous: ContentItem | null;
  next: ContentItem | null;
  className?: string;
}

export function ArticleNavigation({
  previous,
  next,
  className,
}: ArticleNavigationProps) {
  return (
    <nav
      aria-label="文章导航"
      className={cn(
        "mt-16 grid gap-6 border-t-2 border-border-soft pt-8 sm:grid-cols-2",
        className,
      )}
    >
      <div>
        {previous ? (
          <Link href={previous.url} className="group block">
            <span className="flex items-center gap-2 font-pixel text-sm tracking-[0.05em] text-text-secondary">
              <PixelIcon
                name="arrowLeft"
                size={12}
                className="transition-transform duration-[var(--dur-fast)] group-hover:-translate-x-0.5"
              />
              上一篇
            </span>
            <span className="mt-2 block font-medium leading-snug text-text transition-colors duration-[var(--dur-fast)] group-hover:text-accent">
              {previous.title}
            </span>
          </Link>
        ) : (
          <span className="block font-pixel text-sm tracking-[0.05em] text-text-secondary/50">
            ← 上一篇
          </span>
        )}
      </div>

      <div className="sm:text-right">
        {next ? (
          <Link href={next.url} className="group block">
            <span className="flex items-center gap-2 font-pixel text-sm tracking-[0.05em] text-text-secondary sm:justify-end">
              下一篇
              <PixelIcon
                name="arrowRight"
                size={12}
                className="transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5"
              />
            </span>
            <span className="mt-2 block font-medium leading-snug text-text transition-colors duration-[var(--dur-fast)] group-hover:text-accent">
              {next.title}
            </span>
          </Link>
        ) : (
          <span className="block font-pixel text-sm tracking-[0.05em] text-text-secondary/50">
            下一篇 →
          </span>
        )}
      </div>
    </nav>
  );
}
