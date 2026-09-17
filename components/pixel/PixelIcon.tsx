import { getIconRows, type PixelIconName } from "@/lib/pixel-art/icons";
import { ICON_SIZES } from "@/lib/pixel-art/palette";
import { cn } from "@/lib/utils";

import { PixelSprite } from "./PixelSprite";

/**
 * The icon set (spec §57).
 *
 * Icons are authored on a 16×16 grid. 16 and 32 render as exact integer
 * multiples so every cell lands on a whole CSS pixel; 24 does not divide
 * evenly, and while `shape-rendering: crispEdges` keeps it hard-edged, the
 * cells alternate between 1px and 2px. Prefer 16 or 32 where it matters.
 */

export type IconSize = keyof typeof ICON_SIZES | number;

export interface PixelIconProps {
  name: PixelIconName;
  size?: IconSize;
  className?: string;
  /** Give a label only when the icon carries meaning no adjacent text conveys. */
  title?: string;
}

const GRID = 16;

export function PixelIcon({
  name,
  size = "sm",
  className,
  title,
}: PixelIconProps) {
  const pixels = typeof size === "number" ? size : ICON_SIZES[size];

  return (
    <PixelSprite
      rows={getIconRows(name)}
      scale={pixels / GRID}
      className={cn("inline-block", className)}
      title={title}
    />
  );
}
