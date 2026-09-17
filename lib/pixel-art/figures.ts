/**
 * Sprite parts for the standalone figures: the About avatar and the footer
 * character (spec §36, §39).
 *
 * Kept apart from `hero-parts.ts` because these are drawn at a different scale
 * and are not part of any scene composition. Both still resolve their colours
 * through lib/pixel-art/palette.ts, so they read as the same artist's work.
 *
 * Legend: k=ink, y=yellow (skin), c=coral, m=mint, M=mint-dark, .=transparent
 */

/**
 * About-page avatar, 24×24 (spec §36).
 *
 * Drawn larger than the hero character so the face can carry a mouth and
 * separated eyes — at 12px wide the face is three pixels and any expression is
 * lost.
 */
export const AVATAR = [
  "........................",
  "........kkkkkkkk........",
  "......kkkkkkkkkkkk......",
  ".....kkkkkkkkkkkkkk.....",
  ".....kkkkkkkkkkkkkk.....",
  ".....kyyyyyyyyyyyyk.....",
  ".....kyyyyyyyyyyyyk.....",
  ".....kyyyyyyyyyyyyk.....",
  ".....kyyykyyyykyyyk.....",
  ".....kyyyyyyyyyyyyk.....",
  ".....kyyyyyyyyyyyyk.....",
  ".....kyyyyccyyyyyyk.....",
  ".....kyyyyyyyyyyyyk.....",
  ".....kyyyyyyyyyyyyk.....",
  "......kyyyyyyyyyyk......",
  ".........yyyyyy.........",
  "...mmmmmmmmmmmmmmmmmm...",
  "..mmmmmmmmmmmmmmmmmmmm..",
  "..mmmmmmmMMMMMMmmmmmmm..",
  "..mmmmmmmmmmmmmmmmmmmm..",
  "..mmmmmmmmmmmmmmmmmmmm..",
  "..mmmmmmmmmmmmmmmmmmmm..",
  "..mmmmmmmmmmmmmmmmmmmm..",
  "..mmmmmmmmmmmmmmmmmmmm..",
] as const;

/** Footer character body, 12×14 (spec §39). */
export const FOOTER_BODY = [
  "....kkkk....",
  "...kkkkkk...",
  "..kkkkkkkk..",
  "..kyyyyyyk..",
  "..kykyykyk..",
  "..kyyyyyyk..",
  "..kyyccyyk..",
  "..kyyyyyyk..",
  ".mmmmmmmmmm.",
  "mmmmmmmmmmmm",
  ".mmmmmmmmmm.",
  ".mmmmmmmmmm.",
  "..kkkkkkkk..",
  "..kkk..kkk..",
] as const;

/**
 * The waving arm, 3×6, drawn separately so it can rotate on its own.
 *
 * Split out rather than baked into the body because spec §39 wants a single
 * wave: the arm's group gets the animation class, the body does not move.
 * `transform-box: fill-box` plus `transform-origin: bottom left` in the CSS
 * makes it pivot at the shoulder.
 */
export const FOOTER_ARM = [
  "yy.",
  "mm.",
  "mm.",
  ".mm",
  ".mm",
  ".mm",
] as const;

/* -------------------------------------------------------------------------- */

const FIGURES = {
  AVATAR,
  FOOTER_BODY,
  FOOTER_ARM,
} as const;

export type PixelFigureName = keyof typeof FIGURES;

for (const [name, rows] of Object.entries(FIGURES)) {
  const width = rows[0].length;
  rows.forEach((row, index) => {
    if (row.length !== width) {
      throw new Error(
        `[pixel-art/figures] "${name}" row ${index} is ${row.length} cells, ` +
          `expected ${width} (row 0). Pad with spaces.`,
      );
    }
  });
}

export function getFigureRows(name: PixelFigureName): readonly string[] {
  return FIGURES[name];
}

export { FIGURES };
