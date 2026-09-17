import Link from "next/link";

import { PostMeta } from "@/components/blog/PostMeta";
import { PostTags } from "@/components/blog/PostTags";
import type { PostSummary } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * One post in an editorial list (spec §17).
 *
 * Spec §17 is specific about the interaction: on hover a `>` appears at the
 * left, the title turns mint, and the whole row shifts right 4px. Spec §23 adds
 * that this must not become a big image card — blog listing is text-first.
 *
 * A note on the hover target. The title used to be the only clickable element,
 * which meant the row animated under the cursor while most of it did nothing.
 * The title link now carries a stretched pseudo-element that covers the whole
 * row, so the entire entry is clickable. Tags are lifted above it with
 * `relative z-10` so they remain independently clickable instead of being
 * swallowed by the overlay.
 */

export interface PostListItemProps {
  post: PostSummary;
  className?: string;
}

export function PostListItem({ post, className }: PostListItemProps) {
  return (
    <article className={cn("group relative", className)}>
      {/* Spec §17's hover caret. Decorative, so it is hidden from AT and the
          colour/underline changes carry the state for real. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-5 top-6 hidden font-pixel text-accent opacity-0 transition-opacity duration-[var(--dur-fast)] group-hover:opacity-100 sm:block"
      >
        &gt;
      </span>

      {/* Spec §17: the row shifts right 4px on hover (translate-x-1 = 4px). */}
      <div className="transition-transform duration-[var(--dur-normal)] ease-out group-hover:translate-x-1">
        <PostMeta
          date={post.date}
          // Notes have no category (spec §50), so the row falls back to a kind
          // label instead of rendering an empty slot.
          category={
            post.category && post.categorySlug
              ? {
                  label: post.category.toUpperCase(),
                  href: `/categories/${post.categorySlug}`,
                }
              : undefined
          }
          kind={post.kind === "note" ? "笔记" : null}
          readingTime={post.readingTime}
        />

        <h3 className="mt-3 text-xl font-bold leading-snug tracking-[-0.01em] md:text-2xl">
          <Link
            href={post.url}
            className={cn(
              "text-text no-underline transition-colors duration-[var(--dur-fast)]",
              "group-hover:text-accent",
              // Stretched hit area covering the whole entry.
              "after:absolute after:inset-0 after:content-['']",
            )}
          >
            {post.title}
          </Link>
        </h3>

        {post.description && (
          <p className="mt-2 max-w-[62ch] text-text-secondary">
            {post.description}
          </p>
        )}

        <PostTags tags={post.tags} className="relative z-10 mt-3" />
      </div>
    </article>
  );
}
