/**
 * Shared layout constants.
 *
 * Spec §62 sets section spacing at 80–120px on desktop and 56–80px on mobile.
 * Because sections stack, the visible gap between two of them is twice the
 * vertical padding — so the padding has to be 40–56px, not 80–120px. Getting
 * this wrong in the obvious direction is what makes a page feel padded out, and
 * it is easy to do once per section and never notice.
 *
 * Defined here so the number is chosen once rather than re-guessed in six
 * component files.
 */

/** Vertical padding for a page section. Adjacent sections → 80–112px gap. */
export const SECTION_SPACING = "py-10 md:py-14";

/** Page-level top padding, for routes with a heading but no hero. */
export const PAGE_TOP = "pt-14 md:pt-20";
