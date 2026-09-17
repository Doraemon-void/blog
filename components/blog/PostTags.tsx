import Link from "next/link";

import { PixelTag } from "@/components/pixel/PixelTag";
import { cn, slugify } from "@/lib/utils";

/**
 * Tags on a post row (spec §17).
 *
 * Spec §17 renders these as plain hashes — `#CPU #MEMORY #SYSTEM` — which is
 * deliberately different from the bracketed `[ PROGRAMMING ]` pills used for
 * categories and topics (spec §19). The two axes should not look identical: a
 * reader needs to know at a glance whether a label leads to a curated section or
 * a free-form tag list.
 *
 * Kept as its own component (spec §69) so the `#` styling has one definition.
 */

export interface PostTagsProps {
  tags: string[];
  className?: string;
  /** `pill` switches to the bordered form for use outside a post row. */
  variant?: "hash" | "pill";
}

export function PostTags({
  tags,
  className,
  variant = "hash",
}: PostTagsProps) {
  if (tags.length === 0) return null;

  if (variant === "pill") {
    return (
      <ul className={cn("flex flex-wrap gap-2", className)}>
        {tags.map((tag) => (
          <li key={tag}>
            <PixelTag href={`/tags/${slugify(tag)}`} size="sm">
              {tag}
            </PixelTag>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn("flex flex-wrap gap-x-3 gap-y-1", className)}>
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            href={`/tags/${slugify(tag)}`}
            className="font-pixel text-sm tracking-[0.05em] text-text-secondary transition-colors duration-[var(--dur-fast)] hover:text-accent"
          >
            <span aria-hidden="true" className="text-accent">
              #
            </span>
            {tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}
