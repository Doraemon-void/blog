import { cn } from "@/lib/utils";

/**
 * Dot-grid page texture (spec §63).
 *
 * The spec's own example uses a radial gradient at ~0.05 opacity, and the
 * opacity constraint is the whole point: at 0.05 this reads as paper grain and
 * only becomes visible on a second look, which is exactly the "clean at first
 * glance, pixel details on the second" goal in spec §66. Any higher and it
 * competes with the text.
 *
 * Decorative, so it is `aria-hidden` and `pointer-events-none`.
 */

export interface PixelGridBackdropProps {
  className?: string;
}

export function PixelGridBackdrop({ className }: PixelGridBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "px-backdrop pointer-events-none absolute inset-0 -z-10",
        className,
      )}
    />
  );
}
