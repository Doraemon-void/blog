import { PixelIcon } from "@/components/pixel/PixelIcon";
import { PixelGridBackdrop } from "@/components/pixel/PixelGridBackdrop";
import type { PixelIconName } from "@/lib/pixel-art/icons";
import { cn } from "@/lib/utils";

/**
 * Featured post artwork (spec §18).
 *
 * Spec §18 asks the featured illustration not to look like an ordinary blog
 * cover, and offers "Pixel Scene / Icon / Visual" as acceptable — so this is a
 * composed tile rather than a photo: a dot-grid ground, one large pixel glyph,
 * and a few corner marks. All of it is inline SVG, so it costs no image request
 * and stays crisp at any density.
 *
 * The glyph is chosen by category, which means the art is meaningful rather than
 * arbitrary: a systems post gets a monitor, a graphics post gets a triangle.
 *
 * Spec §18 also caps featured posts at one or two per homepage.
 */

const ICON_BY_CATEGORY: Record<string, PixelIconName> = {
  programming: "code",
  systems: "monitor",
  ai: "terminal",
  graphics: "triangle",
  life: "coffee",
};

export interface FeaturedArtProps {
  categorySlug: string;
  className?: string;
}

export function FeaturedArt({ categorySlug, className }: FeaturedArtProps) {
  const icon = ICON_BY_CATEGORY[categorySlug] ?? "star";

  return (
    <div
      className={cn(
        "px-card relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-surface-soft",
        className,
      )}
    >
      <PixelGridBackdrop />

      {/* The glyph renders on the same 4px grid the icons are drawn for:
          16 cells × 4px = 64px, so every edge lands on a whole pixel. */}
      <PixelIcon
        name={icon}
        size={64}
        className="relative text-accent"
        // The icon repeats the category already stated in the text beside it.
        title={undefined}
      />

      {/* Corner marks — the smallest amount of framing that still reads as
          deliberate rather than as a missing image. */}
      <span aria-hidden="true" className="absolute left-3 top-3 h-2 w-2 bg-mint" />
      <span aria-hidden="true" className="absolute right-3 top-3 h-2 w-2 bg-mint" />
      <span aria-hidden="true" className="absolute bottom-3 left-3 h-2 w-2 bg-mint" />
      <span aria-hidden="true" className="absolute bottom-3 right-3 h-2 w-2 bg-mint" />
    </div>
  );
}
