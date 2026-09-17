import { FOOTER_BODY, FOOTER_ARM } from "@/lib/pixel-art/figures";

import { PixelRects } from "../PixelSprite";

/**
 * The tiny character in the footer (spec §39).
 *
 * Spec §39 sets a specific behaviour: the character waves **once**, the first
 * time the reader reaches the bottom, and then never again. That is what makes
 * this the only client component among the illustrations — the wave has to be
 * triggered by scroll position, and it has to be a one-shot rather than a loop.
 *
 * Implementation notes:
 * - `IntersectionObserver` fires and then disconnects, so no listener survives
 *   past the single wave. Spec §56 warns specifically about leaving dozens of
 *   animation listeners running.
 * - `prefers-reduced-motion` is handled globally: the keyframes are disabled in
 *   globals.css, so nothing is needed here.
 * - The arm is a separate sprite from the body. Baked into one grid, the whole
 *   character would have to rotate to wave.
 */

const CANVAS = { width: 16, height: 18 };
const BODY_AT = { x: 2, y: 2 };
/**
 * The arm sits at x=12, not x=13.
 *
 * The body sprite is 12 cells wide but its content does not reach both edges on
 * every row — at the shoulder rows it stops at x=11. Placing the arm one cell
 * further right left a visible gap, so the arm read as a floating rectangle
 * rather than a limb.
 */
const ARM_AT = { x: 12, y: 5 };

export function FooterCharacter({ waved }: { waved: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
      width={CANVAS.width * 4}
      height={CANVAS.height * 4}
      shapeRendering="crispEdges"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className="block"
    >
      {/* The face already carries its own eyes in the sprite data. An earlier
          version overlaid two skin-coloured cells here to blink, copied from the
          hero character — but without the animation class they simply painted
          the eyes out permanently, and the character rendered with a blank face.
          The footer character only needs to wave (spec §39), so there is no
          overlay at all. */}
      <g transform={`translate(${BODY_AT.x} ${BODY_AT.y})`}>
        <PixelRects rows={FOOTER_BODY} />
      </g>

      <g transform={`translate(${ARM_AT.x} ${ARM_AT.y})`}>
        <g className={waved ? "animate-px-wave" : undefined}>
          <PixelRects rows={FOOTER_ARM} />
        </g>
      </g>
    </svg>
  );
}
