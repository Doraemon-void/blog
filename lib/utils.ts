import { clsx, type ClassValue } from "clsx";

/** Class name joiner. Kept as the single import so class logic stays greppable. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Parse a `YYYY-MM-DD` frontmatter date into its parts.
 *
 * Deliberately avoids `new Date(string)`: that parses as UTC midnight, so
 * `toLocaleDateString` renders the previous day for anyone west of UTC. Dates
 * in frontmatter are calendar dates, not instants, and are treated as such.
 */
function parseDateParts(value: string): {
  year: number;
  month: number;
  day: number;
} | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

/** `2026-09-16` → `2026.09.16` (spec §17, §64). */
export function formatDate(value: string): string {
  const parts = parseDateParts(value);
  if (!parts) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${parts.year}.${pad(parts.month)}.${pad(parts.day)}`;
}

/** Machine-readable date for <time dateTime> and JSON-LD. */
export function toDateTime(value: string): string {
  const parts = parseDateParts(value);
  if (!parts) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/** `2026-09-16` → `SEP 2026`, used by the notes file tree (spec §32). */
export function formatMonthYear(value: string): string {
  const parts = parseDateParts(value);
  if (!parts) return value;
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  return `${months[parts.month - 1]} ${parts.year}`;
}

/** Tailwind-free label helper for the `8 MIN READ` meta line (spec §52). */
export function readingTimeLabel(minutes: number): string {
  return `${minutes} 分钟阅读`;
}

/** Sort helper: newest first, with slug as a stable tiebreaker. */
export function byDateDesc<T extends { date: string; slug: string }>(
  a: T,
  b: T,
): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return a.slug.localeCompare(b.slug);
}

/**
 * URL-safe slug for tag/category routes (spec §53, §54).
 *
 * Tags like `CPU` and `C++` have to survive a round trip through a URL path, so
 * anything outside the allowed set is folded away rather than percent-encoded.
 * `lib/content` indexes both the raw tag and this slug, so lookups work no
 * matter which form appears in frontmatter.
 *
 * **CJK is in the allowed set, and that is load-bearing.** The original rule was
 * `[^a-z0-9]+`, which strips every Han character — so a Chinese tag like
 * `计算机网络` slugged to the *empty string*. The consequences were all silent:
 *   - the tag was dropped from the tag index (empty slugs are skipped),
 *   - every tag link on a note collapsed from `/tags/计算机网络` to `/tags`,
 *   - `/tags/计算机网络` 404'd.
 * Nothing errored; it just quietly did not work. Non-Latin tags are the normal
 * case for this site, so they are preserved and left to the browser to
 * percent-encode in the URL.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\+/g, "-plus")
    .replace(/#/g, "-sharp")
    // Keep ASCII alphanumerics plus the CJK ranges (Han, kana, hangul).
    .replace(
      /[^a-z0-9\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]+/g,
      "-",
    )
    .replace(/^-+|-+$/g, "");
}

/** Clamp a string to a length without cutting mid-word where avoidable. */
export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
