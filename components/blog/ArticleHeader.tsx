import Link from "next/link";

import { PostTags } from "@/components/blog/PostTags";
import { cn, formatDate, readingTimeLabel } from "@/lib/utils";

/**
 * Article header (spec §25, §33).
 *
 * Spec §25 wants category, title, date, reading time and tags above the body;
 * spec §33 wants the note version without a hero or cover image. Both share this
 * component and differ only in whether a category is passed, so the two article
 * types stay visually consistent where they should be and distinct only in the
 * way the spec asks for.
 *
 * The title is an `h1`, and the body's headings start at `h2` — the TOC and the
 * document outline both depend on that being true.
 */

export interface ArticleHeaderProps {
  title: string;
  description?: string;
  /**
   * Optional. Notes omit it — the author's position is that when a note was
   * written says nothing useful about it, and the date was making the notes
   * section read like a changelog. Blog posts still pass it.
   */
  date?: string;
  updated?: string | null;
  category?: { label: string; href: string };
  tags: string[];
  readingTime: number;
  className?: string;
}

export function ArticleHeader({
  title,
  description,
  date,
  updated,
  category,
  tags,
  readingTime,
  className,
}: ArticleHeaderProps) {
  const wasRevised =
    date !== undefined &&
    updated !== null &&
    updated !== undefined &&
    updated !== date;

  return (
    <header className={cn("mb-10 border-b-2 border-border-soft pb-8", className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-pixel text-sm tracking-[0.05em] text-text-secondary">
        {category && (
          <>
            <Link
              href={category.href}
              className="text-accent transition-colors duration-[var(--dur-fast)] hover:underline hover:decoration-2 hover:underline-offset-2"
            >
              {category.label}
            </Link>
            <span aria-hidden="true" className="h-3 w-px bg-border-soft" />
          </>
        )}

        {date && (
          <>
            <time dateTime={date}>{formatDate(date)}</time>
            <span aria-hidden="true" className="h-3 w-px bg-border-soft" />
          </>
        )}

        <span>{readingTimeLabel(readingTime)}</span>
      </div>

      <h1 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.02em] md:text-4xl">
        {title}
      </h1>

      {description && (
        <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-text-secondary">
          {description}
        </p>
      )}

      {/* Spec §49 has an `updated` field; surfacing it is the point of having
          one, so a revised post says so next to the original date. */}
      {wasRevised && (
        <p className="mt-3 font-pixel text-xs tracking-[0.05em] text-text-secondary">
          最后更新于 <time dateTime={updated}>{formatDate(updated)}</time>
        </p>
      )}

      <PostTags tags={tags} className="mt-6" />
    </header>
  );
}
