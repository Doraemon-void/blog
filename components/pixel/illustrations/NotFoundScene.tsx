import { px } from "@/lib/pixel-art/palette";

import { PixelRects } from "../PixelSprite";
import { FOOTER_BODY } from "@/lib/pixel-art/figures";

/**
 * 404 artwork (spec §41).
 *
 * Spec §41 describes a character standing at the edge of a broken road, and is
 * explicit that this should not become a large illustration. The whole scene is
 * 48×26 cells, which at 5× is 240×130 — small enough to sit above the copy
 * without pushing it below the fold.
 *
 * The road is drawn in three pieces with a genuine hole between them: the gap
 * is empty cells, not a dark rectangle, so the page background shows through and
 * it reads as "the path stops here" rather than "there is a black box".
 */

const W = 48;
const H = 26;

/** The road is a 3-row slab: top edge, surface, bottom edge. */
const ROAD_TOP = 15;

export interface NotFoundSceneProps {
  className?: string;
}

export function NotFoundScene({ className }: NotFoundSceneProps) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label="一个像素小人站在断掉的路边。"
      focusable="false"
    >
      {/* Ground */}
      <rect x="0" y="18" width={W} height="8" fill={px.inkSoft} />
      <rect x="0" y="18" width={W} height="1" fill={px.ink} />

      {/* Left span of the road, ending at the gap. */}
      <rect x="0" y={ROAD_TOP} width="26" height="1" fill={px.ink} />
      <rect x="0" y={ROAD_TOP + 1} width="26" height="1" fill={px.surface} />
      <rect x="0" y={ROAD_TOP + 2} width="26" height="1" fill={px.ink} />

      {/* Right span, resuming after the gap. */}
      <rect x="36" y={ROAD_TOP} width="12" height="1" fill={px.ink} />
      <rect x="36" y={ROAD_TOP + 1} width="12" height="1" fill={px.surface} />
      <rect x="36" y={ROAD_TOP + 2} width="12" height="1" fill={px.ink} />

      {/* Crumbled edges at both lips of the gap. */}
      <rect x="26" y="16" width="1" height="2" fill={px.ink} />
      <rect x="35" y="16" width="1" height="2" fill={px.ink} />

      {/* The character, standing at the edge and looking across. */}
      <g transform="translate(10 2)">
        <PixelRects rows={FOOTER_BODY} />
      </g>

      {/* Something floating in the gap — a small sparkle, nothing more. */}
      <g fill={px.mint}>
        <rect x="32" y="5" width="1" height="5" />
        <rect x="30" y="7" width="5" height="1" />
      </g>

      {/* Sparse dust motes, to keep the empty area from reading as unfinished. */}
      <rect x="6" y="6" width="1" height="1" fill={px.ink} />
      <rect x="20" y="4" width="1" height="1" fill={px.ink} />
      <rect x="42" y="8" width="1" height="1" fill={px.ink} />
      <rect x="14" y="10" width="1" height="1" fill={px.mintDark} />
      <rect x="39" y="12" width="1" height="1" fill={px.mintDark} />
    </svg>
  );
}
