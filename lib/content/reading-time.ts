/**
 * Reading time (spec §52).
 *
 * Chinese and English are counted separately and summed, because a single
 * words-per-minute figure is meaningless for CJK: Chinese text has no spaces,
 * so word-splitting reports a 1000-character article as ~1 "word" and a
 * whitespace-token count would under-report reading time by an order of
 * magnitude. CJK glyphs are counted per character; Latin text per word.
 */

/** CJK ideographs, kana and hangul. Ranges cover JP/KR too so the function
 *  stays correct if the content language changes. */
const CJK_PATTERN =
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/g;

/** Anything that looks like a word: at least one Latin letter or digit. */
const LATIN_WORD_PATTERN = /[A-Za-z0-9][A-Za-z0-9'’_-]*/g;

const CJK_CHARS_PER_MINUTE = 400;
const LATIN_WORDS_PER_MINUTE = 220;

export function countCjk(text: string): number {
  return (text.match(CJK_PATTERN) ?? []).length;
}

/**
 * Count Latin words with CJK removed first — otherwise a run like
 * `使用 SIMD 加速` would be counted as one token instead of one word.
 */
export function countLatinWords(text: string): number {
  return (text.replace(CJK_PATTERN, " ").match(LATIN_WORD_PATTERN) ?? []).length;
}

/**
 * Whole minutes, minimum 1 — a stub post should say "1 MIN READ", never
 * "0 MIN READ".
 */
export function readingTime(text: string): number {
  const cjk = countCjk(text);
  const words = countLatinWords(text);
  const minutes =
    cjk / CJK_CHARS_PER_MINUTE + words / LATIN_WORDS_PER_MINUTE;
  return Math.max(1, Math.round(minutes));
}
