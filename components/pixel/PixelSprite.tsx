import type { CSSProperties } from "react";

import { resolvePixel } from "@/lib/pixel-art/palette";
import { cn } from "@/lib/utils";

/**
 * Renders a pixel grid as crisp SVG.
 *
 * Used for the icon set and the small parts of the larger illustrations
 * (spec §57: 16/24/32px icons on a consistent grid).
 *
 * Two things matter here:
 *
 * 1. **Runs are merged.** A 24×24 icon drawn naively is ~570 <rect> nodes.
 *    Merging horizontally adjacent same-colour cells and grouping by colour
 *    typically cuts that by 5–10×, which keeps the HTML small on a page that
 *    renders twenty icons.
 *
 * 2. **Vector, not raster.** Each cell is 1 unit in the viewBox, so the sprite
 *    is resolution-independent and needs no `image-rendering: pixelated` and
 *    no @2x/@3x assets — it is equally sharp on any display.
 */

export interface PixelSpriteProps {
  /** One string per row. Accepts a readonly tuple so sprite data can be `as const`. */
  rows: readonly string[];
  /** Integer CSS pixels per cell. Non-integers would resample and blur edges. */
  scale?: number;
  className?: string;
  style?: CSSProperties;
  /** Accessible name. Omit for decoration — the sprite is then hidden from AT. */
  title?: string;
}

interface Run {
  x: number;
  y: number;
  width: number;
}

function assertRectangular(rows: readonly string[], name: string): number {
  if (rows.length === 0) {
    throw new Error(`[PixelSprite] ${name}: sprite data is empty`);
  }
  const width = rows[0].length;
  rows.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(
        `[PixelSprite] ${name}: row ${y} is ${row.length} cells, expected ${width}. ` +
          `Sprite rows must all be the same length — pad with spaces.`,
      );
    }
  });
  return width;
}

/** Merge horizontal runs of one colour into single rects, grouped by colour. */
function buildRuns(rows: readonly string[]): Map<string, Run[]> {
  const byColor = new Map<string, Run[]>();

  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const color = resolvePixel(row[x]);

      if (color === null) {
        x += 1;
        continue;
      }

      let width = 1;
      while (
        x + width < row.length &&
        resolvePixel(row[x + width]) === color
      ) {
        width += 1;
      }

      const runs = byColor.get(color);
      if (runs) {
        runs.push({ x, y, width });
      } else {
        byColor.set(color, [{ x, y, width }]);
      }

      x += width;
    }
  });

  return byColor;
}

export function PixelSprite({
  rows,
  scale = 1,
  className,
  style,
  title,
}: PixelSpriteProps) {
  const height = rows.length;
  const width = assertRectangular(rows, title ?? "sprite");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width * scale}
      height={height * scale}
      shapeRendering="crispEdges"
      className={cn("block shrink-0", className)}
      style={style}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <PixelRects rows={rows} />
    </svg>
  );
}

/**
 * The same grid as colour-grouped run rects, with no `<svg>` wrapper.
 *
 * The larger illustrations compose several sprites inside one flat `<svg>` so
 * they share a coordinate system, a viewBox and a clip path. Rendering a nested
 * `<svg>` per part would work but makes positioning and clipping awkward.
 *
 * Note for callers: position these with a wrapping
 * `<g transform="translate(x y)">` rather than putting the animation there.
 * The SVG `transform` attribute and the CSS `transform` property are the same
 * property, so an animated class would silently override the positioning —
 * nest an extra `<g>` for the animation instead.
 */
export function PixelRects({ rows }: { rows: readonly string[] }) {
  assertRectangular(rows, "part");
  const runs = buildRuns(rows);

  return (
    <>
      {[...runs.entries()].map(([color, rects]) => (
        <g key={color} fill={color}>
          {rects.map((run) => (
            <rect
              key={`${run.x}-${run.y}`}
              x={run.x}
              y={run.y}
              width={run.width}
              height={1}
            />
          ))}
        </g>
      ))}
    </>
  );
}
