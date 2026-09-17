/**
 * The single palette every pixel drawing on the site resolves through.
 *
 * Spec §58 requires the whole site to look like one artist drew it. That only
 * holds if there is exactly one place colours are named — so both rendering
 * paths (the `PixelSprite` grid renderer and the hand-written SVG
 * illustrations) import from here, and neither is allowed a literal hex value.
 *
 * Every entry maps to a design token defined in app/globals.css, with two
 * exceptions that exist because SVG needs them: `current` (inherits the text
 * colour, used by UI icons so they follow dark mode automatically) and `none`.
 *
 * Shading is done with opacity over these tones rather than by introducing
 * extra shades — a 12-colour palette that stays disciplined reads as
 * intentional pixel art, while added shades are what make a palette drift.
 */

/** Named colours for hand-written SVG illustrations. */
export const px = {
  /** Outlines and dark masses. Follows the theme. */
  ink: "var(--border)",
  /** Hairline rules, subtle structure. */
  inkSoft: "var(--border-soft)",

  surface: "var(--surface)",
  surfaceSoft: "var(--surface-soft)",
  bg: "var(--bg)",

  text: "var(--text)",
  textSoft: "var(--text-secondary)",

  mint: "var(--mint)",
  mintDark: "var(--mint-dark)",
  sky: "var(--sky)",
  yellow: "var(--yellow)",
  coral: "var(--coral)",

  /**
   * Illustration-only, theme-aware. The scene seen through the window must
   * darken with the theme or the window becomes a glowing rectangle in a dark
   * room; everything else inherits the theme for free.
   */
  windowSky: "var(--px-sky)",
  windowCloud: "var(--px-cloud)",
  windowSun: "var(--px-sun)",

  /** Dark surfaces — used for monitor screens, matching the code block. */
  screen: "var(--code-bg)",
  screenText: "var(--code-text)",

  /**
   * Doraemon portrait — FIXED values, deliberately not theme-aware.
   *
   * A character's own colours do not change with the reader's theme. Mapping him
   * onto the theme-aware `ink`/`surface` tokens would turn his face dark in dark
   * mode and his outline pale, which is not Doraemon any more — it is a
   * different picture.
   *
   * Sampled from the source artwork rather than invented, so the blues and reds
   * are the character's actual colours.
   */
  doraInk: "#12303f",
  doraBlue: "#3aa3e3",
  doraBlueShade: "#1a76b8",
  doraBlueLight: "#8ecbf0",
  doraWhite: "#fcfcfa",
  doraWhiteShade: "#dcdcd2",
  doraRed: "#e0434c",
  doraRedShade: "#a82a33",
  doraYellow: "#f6c945",
  doraYellowShade: "#c09220",
  doraGrey: "#5f6b73",

  /** Inherits the surrounding text colour — UI icons use this. */
  current: "currentColor",
  none: "none",
} as const;

export type PixelColorName = keyof typeof px;

/**
 * Character → colour map for `PixelSprite` grids.
 *
 * Keys are single characters because the sprite data is written as readable
 * ASCII art. `.` and space are both transparent so grids can be padded for
 * alignment without changing what is drawn.
 */
export const pixelChars: Record<string, string> = {
  ".": "none",
  " ": "none",

  // Structure
  k: px.ink,
  K: px.ink,
  g: px.inkSoft,

  // Surfaces
  w: px.surface,
  W: px.surface,
  f: px.surfaceSoft,

  // Accents
  m: px.mint,
  M: px.mintDark,
  s: px.sky,
  y: px.yellow,
  c: px.coral,

  // Screens (dark, mirrors the code block)
  d: px.screen,
  t: px.screenText,

  // Through-the-window scene — theme-aware, unlike the accents above
  S: px.windowSky,
  o: px.windowCloud,
  u: px.windowSun,

  // Doraemon portrait — fixed character colours, never theme-aware.
  // This letter run is kept clear of the theme-aware keys above on purpose;
  // see the note on the dora* entries in `px`.
  A: px.doraInk,
  B: px.doraBlue,
  C: px.doraBlueShade,
  D: px.doraBlueLight,
  E: px.doraWhite,
  F: px.doraWhiteShade,
  G: px.doraRed,
  H: px.doraRedShade,
  I: px.doraYellow,
  J: px.doraYellowShade,
  L: px.doraGrey,

  // Theme-following (UI icons)
  x: px.current,
  X: px.current,
} as const;

/** Resolve one grid character to a CSS colour, or null if transparent. */
export function resolvePixel(char: string): string | null {
  const color = pixelChars[char];
  if (color === undefined || color === "none") return null;
  return color;
}

/**
 * The logical grid every drawing snaps to (spec §8).
 *
 * Sprites are authored at 1 unit per cell and scaled by an integer, so edges
 * always land on whole device pixels and nothing resamples.
 */
export const PIXEL_GRID = 4;

/** Display sizes for the icon set (spec §57). */
export const ICON_SIZES = {
  sm: 16,
  md: 24,
  lg: 32,
} as const;
