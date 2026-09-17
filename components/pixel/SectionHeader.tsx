import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { PixelIcon } from "./PixelIcon";

/**
 * Section and page heading (spec §21, §77, §81–§84).
 *
 * Every heading in the site ends in a trailing `_`, which is the signature of
 * the pixel language. Spec §77 is specific about the cursor: only the logo may
 * blink, and every section title's underscore is static. Blinking three
 * headings on one page reads as a broken page, not a style.
 *
 * `level` maps to a real heading tag rather than a styled div, so the document
 * outline stays meaningful for screen readers (spec §47).
 */

export interface SectionHeaderProps {
  /** Rendered in the pixel face, uppercase by convention. No trailing `_`. */
  label: string;
  /** Optional supporting line, sat under the label. */
  description?: string;
  /** Right-aligned link, e.g. `VIEW ALL →` (spec §17). */
  href?: string;
  linkLabel?: string;
  level?: "h1" | "h2" | "h3";
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Anchors the heading for `aria-labelledby` on the surrounding section. */
  id?: string;
  children?: ReactNode;
}

const SIZES = {
  sm: "text-base",
  md: "text-xl md:text-2xl",
  lg: "text-3xl md:text-4xl",
} as const;

export function SectionHeader({
  label,
  description,
  href,
  linkLabel = "查看全部",
  level = "h2",
  size = "md",
  className,
  id,
  children,
}: SectionHeaderProps) {
  const Tag = level;

  return (
    <div className={cn("mb-8", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <Tag
          id={id}
          className={cn(
            "font-pixel tracking-[0.06em] text-text uppercase",
            SIZES[size],
          )}
        >
          {label}
          <span aria-hidden="true" className="text-accent">
            _
          </span>
        </Tag>

        {href && (
          <Link
            href={href}
            className="group inline-flex items-center gap-1.5 font-pixel text-xs tracking-[0.05em] text-text-secondary transition-colors duration-[var(--dur-fast)] hover:text-accent"
          >
            {linkLabel}
            <PixelIcon
              name="arrowRight"
              size={12}
              className="transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5"
            />
          </Link>
        )}

        {children}
      </div>

      {description && (
        <p className="mt-3 max-w-[52ch] text-text-secondary">{description}</p>
      )}
    </div>
  );
}
