import { DORAEMON } from "@/lib/pixel-art/doraemon";

import { PixelRects } from "../PixelSprite";

/**
 * Doraemon hero portrait.
 *
 * Rendered through `PixelRects` rather than a hand-written SVG because the
 * source is a sampled grid: the composition came from pixelating a screenshot of
 * the character, so the data already is the drawing. Hand-authoring it would
 * mean redoing work the sampler already did correctly.
 *
 * The sprite has its own letter run and fixed colours — see the notes in
 * `lib/pixel-art/doraemon.ts` and `palette.ts`. He stays blue in dark mode,
 * which is the point: a character does not change colour with the reader's theme.
 *
 * Purely decorative, so it is hidden from assistive tech: the hero text beside
 * it already carries the meaning.
 */

const WIDTH = DORAEMON[0].length;
const HEIGHT = DORAEMON.length;

export function Doraemon({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      shapeRendering="crispEdges"
      className={className}
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <PixelRects rows={DORAEMON} />
    </svg>
  );
}
