import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { categoryByName, type CategoryName } from "../site.config";
import { byDateDesc, slugify, truncate } from "../utils";
import { analyzeMarkdown } from "./parse";
import { readingTime } from "./reading-time";
import type {
  BlogPost,
  ContentItem,
  ContentKind,
  Note,
  Project,
  ProjectLink,
  ProjectStatus,
} from "./types";

/**
 * Filesystem-backed content source.
 *
 * Everything that reads content goes through here. Consumers (pages, RSS,
 * search index, sitemap, tag and category routes) call `lib/content/index.ts`
 * and receive fully normalized items — they never touch `fs` or `gray-matter`
 * themselves.
 *
 * Deliberately framework-free: no `next/*` import anywhere in this file, so
 * the same pipeline can run inside a Route Handler, at build time, or from a
 * plain Node script.
 */

const CONTENT_ROOT = path.join(process.cwd(), "content");

const KIND_DIR: Record<ContentKind, string> = {
  blog: "blog",
  note: "notes",
  project: "projects",
};

const KIND_URL: Record<ContentKind, string> = {
  blog: "/blog",
  note: "/notes",
  project: "/projects",
};

const PROJECT_STATUSES: ProjectStatus[] = ["active", "wip", "paused", "archived"];

/** Spec §51 — drafts are hidden in production, visible in development. */
const HIDE_DRAFTS = process.env.NODE_ENV === "production";

/* -------------------------------------------------------------------------- */
/* Frontmatter coercion                                                       */
/* -------------------------------------------------------------------------- */

function fail(filePath: string, message: string): never {
  const rel = path.relative(process.cwd(), filePath);
  throw new Error(`[content] ${rel}: ${message}`);
}

function reqString(
  data: Record<string, unknown>,
  key: string,
  filePath: string,
): string {
  const value = data[key];
  if (typeof value !== "string" || value.trim() === "") {
    fail(filePath, `frontmatter field "${key}" is required and must be a non-empty string`);
  }
  return value.trim();
}

function optString(
  data: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = data[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Accepts `tags: [a, b]` and `tags: a, b` and `tags: a`. Frontmatter is written
 * by hand, so all three forms show up in practice.
 */
function strArray(data: Record<string, unknown>, key: string): string[] {
  const value = data[key];
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v.trim() : String(v)))
      .filter((v) => v !== "");
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v !== "");
  }
  return [];
}

function optBool(data: Record<string, unknown>, key: string): boolean {
  return data[key] === true || data[key] === "true";
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Normalize a frontmatter date to `YYYY-MM-DD`.
 *
 * `date: "2026-09-16"` (quoted) arrives as a string, but `date: 2026-09-16`
 * (unquoted) is parsed by js-yaml into a `Date` at UTC midnight — so a naive
 * `toISOString().slice(0, 10)` would be right only by luck, and a naive
 * `getDate()` would be off by one for anyone east of UTC. Both forms are
 * accepted and unwrapped in UTC.
 */
function normalizeDate(
  value: unknown,
  filePath: string,
  key: string,
): string | null {
  if (value == null) return null;

  if (value instanceof Date) {
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }

  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
    if (!match) fail(filePath, `frontmatter field "${key}" must look like YYYY-MM-DD, got "${value}"`);
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  fail(filePath, `frontmatter field "${key}" must be a date string`);
}

function parseLinks(value: unknown): ProjectLink[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (entry == null || typeof entry !== "object") return [];
    const { label, href, url } = entry as Record<string, unknown>;
    const resolvedHref = typeof href === "string" ? href : typeof url === "string" ? url : null;
    if (!resolvedHref) return [];
    return [
      {
        label: typeof label === "string" && label.trim() !== "" ? label.trim() : "LINK",
        href: resolvedHref.trim(),
      },
    ];
  });
}

/* -------------------------------------------------------------------------- */
/* Normalization                                                              */
/* -------------------------------------------------------------------------- */

function baseFields(
  kind: ContentKind,
  slug: string,
  data: Record<string, unknown>,
  body: string,
  filePath: string,
) {
  const date = normalizeDate(data.date, filePath, "date");
  if (!date) fail(filePath, 'frontmatter field "date" is required');

  const { toc, plainText, firstParagraph } = analyzeMarkdown(body);

  const description =
    optString(data, "description") ?? truncate(firstParagraph, 120) ?? "";

  const order = Number(data.order);

  return {
    kind,
    slug,
    url: `${KIND_URL[kind]}/${slug}`,
    title: reqString(data, "title", filePath),
    description,
    date,
    updated: normalizeDate(data.updated, filePath, "updated"),
    tags: strArray(data, "tags"),
    draft: optBool(data, "draft"),
    featured: optBool(data, "featured"),
    readingTime: readingTime(plainText),
    excerpt: description,
    toc,
    plainText,
    body,
    filePath,
    series: optString(data, "series") ?? null,
    // Not defaulted to a number: null means "no manual position", which the
    // notes index turns into date ordering. Defaulting to 0 or 99 would silently
    // sort an un-ordered note to the top or bottom of a series.
    order: Number.isFinite(order) ? order : null,
  };
}

function toBlogPost(
  slug: string,
  data: Record<string, unknown>,
  body: string,
  filePath: string,
): BlogPost {
  const base = baseFields("blog", slug, data, body, filePath);

  // Categories are a closed set (site.config.ts). An unknown value is a typo
  // that would otherwise silently produce a category page nobody can reach,
  // so it stops the build instead.
  const rawCategory = reqString(data, "category", filePath);
  const category = categoryByName(rawCategory);
  if (!category) {
    const valid = ["Programming", "Computer Systems", "AI", "Graphics", "Life"];
    fail(
      filePath,
      `unknown category "${rawCategory}". Use one of: ${valid.join(", ")}. ` +
        `(Categories are curated; use "tags" for free-form labels.)`,
    );
  }

  return {
    ...base,
    kind: "blog",
    category: category.name as CategoryName,
    categorySlug: category.slug,
  };
}

function toNote(
  slug: string,
  data: Record<string, unknown>,
  body: string,
  filePath: string,
): Note {
  // Spec §50 — notes carry no category, and description is optional.
  return { ...baseFields("note", slug, data, body, filePath), kind: "note" };
}

function toProject(
  slug: string,
  data: Record<string, unknown>,
  body: string,
  filePath: string,
): Project {
  const base = baseFields("project", slug, data, body, filePath);

  const rawStatus = optString(data, "status") ?? "active";
  if (!PROJECT_STATUSES.includes(rawStatus as ProjectStatus)) {
    fail(
      filePath,
      `unknown status "${rawStatus}". Use one of: ${PROJECT_STATUSES.join(", ")}`,
    );
  }

  return {
    ...base,
    kind: "project",
    status: rawStatus as ProjectStatus,
    techStack: strArray(data, "techStack"),
    links: parseLinks(data.links),
  };
}

/* -------------------------------------------------------------------------- */
/* Loading + memoization                                                      */
/* -------------------------------------------------------------------------- */

// Module-level memo. The filesystem is read once per kind per process, so a
// page that needs posts three times parses them once. Cleared on HMR by module
// re-evaluation, which is exactly the behaviour you want in dev.
const cache = new Map<ContentKind, ContentItem[]>();

function listSlugs(kind: ContentKind): string[] {
  const dir = path.join(CONTENT_ROOT, KIND_DIR[kind]);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((name) => /\.mdx?$/.test(name) && !name.startsWith("_"))
    .map((name) => name.replace(/\.mdx?$/, ""))
    .sort();
}

function readOne(kind: ContentKind, slug: string): ContentItem {
  const dir = path.join(CONTENT_ROOT, KIND_DIR[kind]);
  const mdxPath = path.join(dir, `${slug}.mdx`);
  const mdPath = path.join(dir, `${slug}.md`);
  const filePath = fs.existsSync(mdxPath) ? mdxPath : mdPath;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = data as Record<string, unknown>;
  const body = content.trim();

  switch (kind) {
    case "blog":
      return toBlogPost(slug, frontmatter, body, filePath);
    case "note":
      return toNote(slug, frontmatter, body, filePath);
    case "project":
      return toProject(slug, frontmatter, body, filePath);
  }
}

/**
 * Sort weight for a manual order: lower first, and anything with no stated
 * position after everything that has one. Used for projects and for notes
 * within a series.
 */
export function compareOrder(
  a: { order: number | null; date: string; slug: string },
  b: { order: number | null; date: string; slug: string },
): number {
  const oa = a.order;
  const ob = b.order;

  if (oa !== null && ob !== null) return oa !== ob ? oa - ob : byDateDesc(a, b);
  if (oa !== null) return -1;
  if (ob !== null) return 1;
  return byDateDesc(a, b);
}

function sortItems(kind: ContentKind, items: ContentItem[]): ContentItem[] {
  if (kind === "project") return [...items].sort(compareOrder);
  return [...items].sort(byDateDesc);
}

/** Every visible item of one kind, newest first (projects: by `order`). */
export function loadKind(kind: ContentKind): ContentItem[] {
  const cached = cache.get(kind);
  if (cached) return cached;

  const items = listSlugs(kind)
    .map((slug) => readOne(kind, slug))
    .filter((item) => (HIDE_DRAFTS ? !item.draft : true));

  const sorted = sortItems(kind, items);
  cache.set(kind, sorted);
  return sorted;
}

/** Load one item even if it is a draft — detail pages must still resolve. */
export function loadOne(kind: ContentKind, slug: string): ContentItem | null {
  const known = loadKind(kind).find((item) => item.slug === slug);
  if (known) return known;

  // Drafts are absent from `loadKind` in production. They are still loadable
  // directly so a preview URL renders; the page decides whether to 404.
  const exists = listSlugs(kind).includes(slug);
  if (!exists) return null;
  return readOne(kind, slug);
}

/** Tag-ish slug used to key tag and category routes. */
export { slugify };
