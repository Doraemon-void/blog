/**
 * WCAG contrast audit for the design tokens.
 *
 * Spec §47 says pixel styling must not cost accessibility, and §96 lists
 * readable text as an acceptance criterion. Eye-balling hex pairs does not
 * catch a 4.47:1 near-miss or a token accidentally reused for the wrong role,
 * so this parses the real token values out of app/globals.css and checks every
 * foreground/background combination the site actually renders.
 *
 * Run with `npm run check:contrast`. Exits non-zero on any failure so it can be
 * wired into CI.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSS = readFileSync(join(ROOT, "app", "globals.css"), "utf8");

/**
 * Pull `--name: #hex;` pairs out of a CSS block.
 *
 * The selector is anchored to the start of a line, which is load-bearing: a
 * substring search for `.dark` matches the `@custom-variant dark
 * (&:where(.dark, .dark *))` rule near the top of the file first, and the audit
 * then silently reports the light theme's values as the dark theme's.
 */
function readTokens(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escaped}\\s*\\{([\\s\\S]*?)^\\}`, "m");
  const match = pattern.exec(CSS);

  if (!match) {
    throw new Error(
      `Could not find a "${selector} { ... }" block in app/globals.css`,
    );
  }

  const tokens = {};
  for (const token of match[1].matchAll(
    /--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g,
  )) {
    tokens[token[1]] = token[2];
  }
  return tokens;
}

function toRgb(hex) {
  let value = hex.replace("#", "");
  if (value.length === 3) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function luminance(hex) {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Every pair the site actually renders.
 *
 * `AA`   = 4.5:1, WCAG 1.4.3 for body text.
 * `UI`   = 3:1, WCAG 1.4.11 for the boundaries and indicators that identify a
 *          control or are needed to understand content.
 * `FAINT` = 1.2:1, a visibility floor only.
 *
 * `--border-soft` is checked at FAINT rather than UI on purpose, and it is not
 * a carve-out for a failure. It is only ever a hairline between blocks whose
 * separation is already carried by spacing, and it is never the sole means of
 * identifying an interactive element — everything clickable uses `--border`
 * (8.75:1) or a mint fill. Holding a deliberately-quiet hairline to 3:1 would
 * require a mid-grey and turn the layout into the every-section-has-a-border
 * look spec §61 rules out. The FAINT floor still catches the token being set to
 * something invisible, which is the failure that actually matters.
 */
const CHECKS = {
  light: [
    ["text on bg", "text", "bg", "AA"],
    ["text on surface", "text", "surface", "AA"],
    ["text on surface-soft", "text", "surface-soft", "AA"],
    ["text-secondary on bg", "text-secondary", "bg", "AA"],
    ["text-secondary on surface", "text-secondary", "surface", "AA"],
    ["text-secondary on surface-soft", "text-secondary", "surface-soft", "AA"],
    ["accent on bg (links in prose)", "accent", "bg", "AA"],
    ["accent on surface", "accent", "surface", "AA"],
    ["accent on surface-soft", "accent", "surface-soft", "AA"],
    ["hero heading blue on bg", "accent-blue", "bg", "AA"],
    ["hero heading blue on surface", "accent-blue", "surface", "AA"],
    ["label on mint (fixed pair)", "on-mint", "mint", "AA"],
    ["code text on code bg", "code-text", "code-bg", "AA"],
    ["border on bg (all controls)", "border", "bg", "UI"],
    ["border on surface", "border", "surface", "UI"],
    ["accent on bg (active rule)", "accent", "bg", "UI"],
    ["border-soft on bg (hairline)", "border-soft", "bg", "FAINT"],
    ["border-soft on surface", "border-soft", "surface", "FAINT"],
  ],
  dark: [
    ["text on bg", "text", "bg", "AA"],
    ["text on surface", "text", "surface", "AA"],
    ["text on surface-soft", "text", "surface-soft", "AA"],
    ["text-secondary on bg", "text-secondary", "bg", "AA"],
    ["text-secondary on surface", "text-secondary", "surface", "AA"],
    ["text-secondary on surface-soft", "text-secondary", "surface-soft", "AA"],
    ["accent on bg (links in prose)", "accent", "bg", "AA"],
    ["accent on surface", "accent", "surface", "AA"],
    ["accent on surface-soft", "accent", "surface-soft", "AA"],
    ["hero heading blue on bg", "accent-blue", "bg", "AA"],
    ["hero heading blue on surface", "accent-blue", "surface", "AA"],
    ["label on mint (fixed pair)", "on-mint", "mint", "AA"],
    ["code text on code bg", "code-text", "code-bg", "AA"],
    ["border on bg (all controls)", "border", "bg", "UI"],
    ["border on surface", "border", "surface", "UI"],
    ["accent on bg (active rule)", "accent", "bg", "UI"],
    ["border-soft on bg (hairline)", "border-soft", "bg", "FAINT"],
    ["border-soft on surface", "border-soft", "surface", "FAINT"],
  ],
};

const THRESHOLDS = { AA: 4.5, UI: 3, FAINT: 1.2 };

const themes = {
  light: readTokens(":root"),
  dark: { ...readTokens(":root"), ...readTokens(".dark") },
};

let failures = 0;

for (const [themeName, checks] of Object.entries(CHECKS)) {
  console.log(`\n=== ${themeName} ===`);
  const tokens = themes[themeName];

  for (const [label, fgKey, bgKey, level] of checks) {
    const fg = tokens[fgKey];
    const bg = tokens[bgKey];

    if (!fg || !bg) {
      console.log(`  MISSING  ${label}  (--${fgKey} or --${bgKey} not found)`);
      failures += 1;
      continue;
    }

    const ratio = contrast(fg, bg);
    const required = THRESHOLDS[level];
    const pass = ratio >= required;

    if (!pass) failures += 1;

    console.log(
      `  ${pass ? "PASS" : "FAIL"}  ${ratio.toFixed(2).padStart(5)}:1  ` +
        `(need ${required} ${level})  ${label}  [${fg} on ${bg}]`,
    );
  }
}

console.log(
  failures === 0
    ? "\nAll contrast checks passed.\n"
    : `\n${failures} contrast check(s) FAILED.\n`,
);

process.exit(failures === 0 ? 0 : 1);
