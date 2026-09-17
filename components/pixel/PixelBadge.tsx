import { cn } from "@/lib/utils";

/**
 * Tech-stack badge (spec §37).
 *
 * Spec §37 rules out skill bars and percentages outright — `C++ ████████ 90%`
 * is exactly the thing to avoid. A badge states membership, not proficiency,
 * which is both more honest and the only claim a reader can verify.
 */

export interface PixelBadgeProps {
  children: string;
  /** `solid` for the hero emphasis, `outline` for long lists. */
  tone?: "outline" | "mint";
  className?: string;
}

export function PixelBadge({
  children,
  tone = "outline",
  className,
}: PixelBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-pixel-sm)] border-2 border-border",
        "px-2 py-1 font-pixel text-sm leading-none tracking-[0.05em]",
        tone === "mint"
          ? "bg-mint text-on-mint"
          : "bg-surface text-text-secondary",
        className,
      )}
    >
      <span aria-hidden="true" className="opacity-45">
        [
      </span>
      {children}
      <span aria-hidden="true" className="opacity-45">
        ]
      </span>
    </span>
  );
}
