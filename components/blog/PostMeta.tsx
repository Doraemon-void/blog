import Link from "next/link";

import { cn, formatDate, readingTimeLabel } from "@/lib/utils";

/**
 * The meta line under a post title (spec §17, §23).
 *
 * Spec §17's row shows a date, a category and a reading time; spec §23 adds the
 * same for the blog index. Rendering them through one component keeps the pixel
 * font, the separators and the date format identical everywhere a post is
 * listed — three places would otherwise drift.
 *
 * The separator is a 1px rule rather than a bullet character: a bullet would
 * render in the body font and, at this size, reads as a smudge.
 */

export interface PostMetaProps {
  date: string;
  category?: { label: string; href: string };
  /** Static kind label, used for notes in a mixed list. Not a link. */
  kind?: string | null;
  readingTime?: number;
  /** Notes use the small variant — they carry less metadata. */
  size?: "sm" | "md";
  className?: string;
}

export function PostMeta({
  date,
  category,
  kind,
  readingTime,
  size = "md",
  className,
}: PostMetaProps) {
  const itemClass = cn(
    "font-pixel tracking-[0.05em]",
    size === "sm" ? "text-xs" : "text-sm",
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-text-secondary",
        className,
      )}
    >
      <time dateTime={date} className={itemClass}>
        {formatDate(date)}
      </time>

      {category && (
        <>
          <Separator />
          <Link
            href={category.href}
            className={cn(
              itemClass,
              "relative z-10 transition-colors duration-[var(--dur-fast)] hover:text-accent",
            )}
          >
            {category.label}
          </Link>
        </>
      )}

      {kind && (
        <>
          <Separator />
          <span className={cn(itemClass, "text-accent")}>{kind}</span>
        </>
      )}

      {typeof readingTime === "number" && (
        <>
          <Separator />
          <span className={itemClass}>{readingTimeLabel(readingTime)}</span>
        </>
      )}
    </div>
  );
}

function Separator() {
  return (
    <span aria-hidden="true" className="h-3 w-px shrink-0 bg-border-soft" />
  );
}
