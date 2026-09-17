import { cn } from "@/lib/utils";

/**
 * Dashed pixel rule (spec §17, §31).
 *
 * The dash pattern is a repeating gradient rather than a `border-style: dashed`
 * because the browser's dashes are not on a pixel grid — their length and
 * spacing vary with the element width, which breaks the illusion immediately.
 * This one is a fixed 4px-on / 4px-off, aligned to the same 4px grid the rest
 * of the pixel language uses.
 */

export interface PixelDividerProps {
  className?: string;
  /** Adds vertical breathing room. Section spacing is the caller's decision. */
  spaced?: boolean;
}

export function PixelDivider({ className, spaced = false }: PixelDividerProps) {
  return (
    <hr
      className={cn("px-divider border-0", spaced && "my-10", className)}
      aria-hidden="true"
    />
  );
}
