import type { ThemeRegistrationRaw } from "shiki";

/**
 * Syntax highlighting theme, derived from the site palette (spec §27, §58).
 *
 * The code block is dark in both light and dark mode — spec §27 fixes its
 * background at `#1F292B` — so this theme is the one place on the site where
 * several hues appear together. They are the site's own four accents and
 * nothing else: coral for keywords, mint for strings, sky for functions, yellow
 * for numbers and constants. No neon, no purple, no cyberpunk pink (spec §4).
 *
 * `keepBackground` is disabled at the plugin level, so the background comes from
 * the `--code-bg` token in globals.css rather than being baked in here. That is
 * what lets the block follow the theme without a second theme definition.
 *
 * Typed as `ThemeRegistrationRaw` because that is the shape rehype-pretty-code
 * accepts — a TextMate theme object, not a bundled theme name.
 */

const INK = "#1f292b";
const TEXT = "#c8d3ce";
const COMMENT = "#6b7f7a";
const MUTED = "#9baba6";

const CORAL = "#f3aaa6";
const MINT = "#a8d8c5";
const SKY = "#a8d8ea";
const YELLOW = "#f6e58d";

/**
 * The token rules, in one array.
 *
 * Assigned to both `settings` and `tokenColors` below, and that duplication is
 * load-bearing rather than sloppy:
 *
 * - `ThemeRegistrationRaw` (shiki's type) *requires* `settings`.
 * - rehype-pretty-code decides whether it is looking at a single theme or a map
 *   of themes by testing `Object.hasOwn(value, "tokenColors")`. Without that
 *   key it treats the object as `Record<string, Theme>` and then fails at build
 *   time with "Theme `dora-pixel` is not included in this bundle".
 *
 * Both keys reference this same array, so the two can never disagree.
 */
const tokenRules: ThemeRegistrationRaw["settings"] = [
    {
      scope: ["comment", "punctuation.definition.comment", "string.comment"],
      settings: { foreground: COMMENT, fontStyle: "italic" },
    },
    {
      scope: [
        "keyword",
        "keyword.control",
        "keyword.operator.new",
        "storage",
        "storage.type",
        "storage.modifier",
        "keyword.control.directive",
      ],
      settings: { foreground: CORAL },
    },
    {
      scope: [
        "string",
        "string.quoted",
        "string.template",
        "punctuation.definition.string",
        "constant.other.symbol",
      ],
      settings: { foreground: MINT },
    },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call",
        "variable.function",
      ],
      settings: { foreground: SKY },
    },
    {
      scope: [
        "constant.numeric",
        "constant.language",
        "constant.character",
        "support.constant",
      ],
      settings: { foreground: YELLOW },
    },
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "entity.name.namespace",
        "support.type",
        "support.class",
        "storage.type.primitive",
      ],
      settings: { foreground: SKY },
    },
    {
      scope: [
        "variable",
        "variable.other",
        "variable.parameter",
        "meta.definition.variable",
      ],
      settings: { foreground: TEXT },
    },
    {
      scope: [
        "keyword.operator",
        "punctuation",
        "punctuation.separator",
        "punctuation.terminator",
        "meta.brace",
      ],
      settings: { foreground: MUTED },
    },
    {
      scope: [
        "entity.name.tag",
        "meta.tag",
        "punctuation.definition.tag",
        "support.type.property-name",
      ],
      settings: { foreground: CORAL },
    },
    {
      scope: ["entity.other.attribute-name", "variable.other.member"],
      settings: { foreground: YELLOW },
    },
    {
      scope: ["markup.heading", "markup.bold", "entity.name.section"],
      settings: { foreground: TEXT, fontStyle: "bold" },
    },
    {
      scope: ["markup.italic"],
      settings: { fontStyle: "italic" },
    },
    {
      scope: ["invalid", "invalid.illegal"],
      settings: { foreground: CORAL, fontStyle: "underline" },
    },
];

export const doraPixelTheme: ThemeRegistrationRaw = {
  name: "dora-pixel",
  type: "dark",
  colors: {
    "editor.background": INK,
    "editor.foreground": TEXT,
    "terminal.ansiBlack": INK,
    "terminal.ansiWhite": TEXT,
  },
  settings: tokenRules,
  // See the note on `tokenRules` — this key is what makes rehype-pretty-code
  // treat this as one theme rather than as a map of themes.
  tokenColors: tokenRules,
};
