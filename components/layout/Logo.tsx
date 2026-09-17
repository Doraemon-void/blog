import Link from "next/link";

import { PixelIcon } from "@/components/pixel/PixelIcon";
import { site } from "@/lib/site.config";
import { cn } from "@/lib/utils";

/**
 * Wordmark (spec §11).
 *
 * Spec §11 allows `DORA_`, `DORA.DEV_` or `> DORA_`, with a blinking cursor on
 * the underscore and a small pixel computer beside it — and rules out a complex
 * brand animation. This is the site's only blinking element: spec §77 is
 * explicit that section headings keep a static underscore, so the logo blinking
 * reads as a cursor rather than as decoration.
 *
 * The underscore is split off from the handle so only it animates. The handle
 * itself comes from site.config, so renaming the site does not require editing
 * a component.
 */

const MARK = site.handle.replace(/_+$/, "");

export interface LogoProps {
  size?: "sm" | "md";
  className?: string;
  /** Footer renders the wordmark as plain text, not a link. */
  asLink?: boolean;
}

export function Logo({ size = "md", className, asLink = true }: LogoProps) {
  const content = (
    <>
      <PixelIcon
        name="monitor"
        size={size === "sm" ? 14 : 16}
        className="text-accent"
      />
      <span
        className={cn(
          "font-pixel-display tracking-[0.02em] text-text",
          size === "sm" ? "text-base" : "text-lg",
        )}
      >
        {MARK}
        <span aria-hidden="true" className="animate-px-blink text-accent">
          _
        </span>
      </span>
      {/* The blinking cursor is decorative; the accessible name is the mark. */}
      <span className="sr-only">{site.name}</span>
    </>
  );

  if (!asLink) {
    return <span className={cn("inline-flex items-center gap-2", className)}>{content}</span>;
  }

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius-pixel-sm)]",
        className,
      )}
      aria-label={`${site.name} 首页`}
    >
      {content}
    </Link>
  );
}
