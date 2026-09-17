import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Tag / topic pill (spec §19, §76).
 *
 * Spec §19 is strict about colour here: hover is always mint, and tags never
 * get per-tag colours. That rule is what keeps a page with fifteen tags from
 * turning into confetti, so it is enforced in the `.px-tag` class rather than
 * being left to each call site.
 *
 * Two visual forms exist across the site and they are deliberately different:
 * topic and category pills use brackets (`[ PROGRAMMING ]`, spec §19) while
 * tags on a post row are plain hashes (`#CPU`, spec §17). That distinction is
 * what tells a reader which taxonomy they are looking at.
 */

export interface PixelTagProps {
  children: string;
  href?: string;
  active?: boolean;
  /** Brackets are opt-out so the default matches the spec's `[ LABEL ]` look. */
  brackets?: boolean;
  size?: "sm" | "md";
  className?: string;
  title?: string;
}

export function PixelTag({
  children,
  href,
  active = false,
  brackets = true,
  size = "md",
  className,
  title,
}: PixelTagProps) {
  const classes = cn(
    "px-tag",
    size === "sm" && "text-xs px-1.5 py-0.5",
    className,
  );

  const inner = (
    <>
      {brackets && (
        <span aria-hidden="true" className="opacity-45">
          [
        </span>
      )}
      <span>{children}</span>
      {brackets && (
        <span aria-hidden="true" className="opacity-45">
          ]
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        data-active={active ? "true" : undefined}
        aria-current={active ? "page" : undefined}
        title={title}
      >
        {inner}
      </Link>
    );
  }

  return (
    <span
      className={classes}
      data-active={active ? "true" : undefined}
      title={title}
    >
      {inner}
    </span>
  );
}
