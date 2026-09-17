import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Pixel card (spec §75).
 *
 * Spec §61 is the constraint that matters here: not every section gets a card.
 * Latest Posts and the blog index are plain lists — only Featured posts,
 * project tiles and the 404 panel use this. Over-carding is the single fastest
 * way to make a quiet design look generic, so this component deliberately has
 * no "grid" or "list" variant to tempt call sites into using it everywhere.
 */

export interface PixelCardProps {
  children: ReactNode;
  /** Lift on hover. Only for cards that are themselves a link. */
  interactive?: boolean;
  as?: ElementType;
  className?: string;
  /** Passed through when `as` is a semantic element like `article`. */
  ariaLabelledby?: string;
}

export function PixelCard({
  children,
  interactive = false,
  as: Tag = "div",
  className,
  ariaLabelledby,
}: PixelCardProps) {
  return (
    <Tag
      className={cn("px-card", interactive && "px-card--lift", className)}
      aria-labelledby={ariaLabelledby}
    >
      {children}
    </Tag>
  );
}
