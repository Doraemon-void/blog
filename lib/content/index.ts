import { categories } from "../site.config";
import { slugify } from "../utils";
import { compareOrder, loadKind, loadOne } from "./source";
import type {
  BlogPost,
  ContentGroup,
  ContentItem,
  Note,
  NoteGroup,
  Project,
} from "./types";

/**
 * The public content API. Every consumer imports from here.
 *
 * The casts below are safe by construction: `loadKind` keys off the directory
 * it reads, so the "blog" directory can only ever contain BlogPost items. They
 * exist because TypeScript cannot narrow a union through a runtime string.
 */

function posts(): BlogPost[] {
  return loadKind("blog") as BlogPost[];
}

function notes(): Note[] {
  return loadKind("note") as Note[];
}

function projects(): Project[] {
  return loadKind("project") as Project[];
}

/* -------------------------------------------------------------------------- */
/* Blog (spec §51)                                                            */
/* -------------------------------------------------------------------------- */

export function getAllPosts(): BlogPost[] {
  return posts();
}

export function getPostBySlug(slug: string): BlogPost | null {
  const item = loadOne("blog", slug);
  return (item as BlogPost | null) ?? null;
}

export function getPostsByTag(tag: string): BlogPost[] {
  const wanted = slugify(tag);
  return posts().filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tag.toLowerCase() || slugify(t) === wanted),
  );
}

/** Accepts either the display name (`Computer Systems`) or the slug (`systems`). */
export function getPostsByCategory(category: string): BlogPost[] {
  const wanted = slugify(category);
  return posts().filter(
    (post) =>
      post.categorySlug === wanted || slugify(post.category) === wanted,
  );
}

export function getFeaturedPosts(): BlogPost[] {
  return posts().filter((post) => post.featured);
}

export function getRecentPosts(limit = 5): BlogPost[] {
  return posts().slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/* Notes (spec §32)                                                           */
/* -------------------------------------------------------------------------- */

export function getAllNotes(): Note[] {
  return notes();
}

export function getNoteBySlug(slug: string): Note | null {
  const item = loadOne("note", slug);
  return (item as Note | null) ?? null;
}

/**
 * Notes grouped for the index page.
 *
 * Notes carrying a `series` are grouped under it, ordered by `order` and then by
 * date. Standalone notes come last in a single unlabelled group.
 *
 * Series are ordered by the smallest `order` they contain, so a series can be
 * positioned on the page by giving its first note a low number rather than by
 * relying on names.
 */
export function getNoteGroups(): NoteGroup[] {
  const bySeries = new Map<string, Note[]>();

  for (const note of notes()) {
    const key = note.series ?? "";
    if (!bySeries.has(key)) bySeries.set(key, []);
    bySeries.get(key)!.push(note);
  }

  const groups: NoteGroup[] = [...bySeries.entries()].map(
    ([series, list]) => ({
      series: series === "" ? null : series,
      notes: [...list].sort(compareOrder),
    }),
  );

  return groups.sort((a, b) => {
    // Standalone notes always trail the named series.
    if (a.series === null) return b.series === null ? 0 : 1;
    if (b.series === null) return -1;
    return a.series.localeCompare(b.series);
  });
}

/* -------------------------------------------------------------------------- */
/* Projects (spec §34, §35)                                                   */
/* -------------------------------------------------------------------------- */

export function getAllProjects(): Project[] {
  return projects();
}

export function getProjectBySlug(slug: string): Project | null {
  const item = loadOne("project", slug);
  return (item as Project | null) ?? null;
}

/* -------------------------------------------------------------------------- */
/* Taxonomy (spec §19, §53, §54)                                              */
/* -------------------------------------------------------------------------- */

/**
 * Tags span blog posts and notes — both are things you read and search by
 * topic. Projects are excluded: their taxonomy is `techStack`, which renders
 * as badges rather than tag links (spec §37).
 */
export function getAllTags(): ContentGroup<BlogPost | Note>[] {
  const byslug = new Map<string, ContentGroup<BlogPost | Note>>();

  for (const item of [...posts(), ...notes()]) {
    for (const tag of item.tags) {
      const key = slugify(tag);
      if (key === "") continue;
      const existing = byslug.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        byslug.set(key, { name: tag, slug: key, items: [item] });
      }
    }
  }

  return [...byslug.values()].sort(
    (a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name),
  );
}

/**
 * Decode a dynamic route segment that may or may not already be decoded.
 *
 * Next hands dynamic params over percent-encoded for non-ASCII values, so a tag
 * like `计算机网络` arrives as `%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%BD%91%E7%BB%9C`.
 * Feeding that straight into `slugify` strips the `%` signs and produces
 * `e8-ae-a1-...`, which matches nothing and silently 404s every Chinese tag.
 *
 * Decoding is idempotent for already-clean input, and the try/catch covers the
 * case of a genuine `%` in a tag name (e.g. `100%`) that is not valid escape
 * syntax.
 */
export function decodeRouteParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getTagBySlug(slug: string): ContentGroup<BlogPost | Note> | null {
  const wanted = slugify(decodeRouteParam(slug));
  return getAllTags().find((group) => group.slug === wanted) ?? null;
}

/** The fixed category list from site.config, each with its posts attached. */
export function getAllCategories(): ContentGroup<BlogPost>[] {
  return categories.map((category) => ({
    name: category.name,
    slug: category.slug,
    items: posts().filter((post) => post.categorySlug === category.slug),
  }));
}

/**
 * Category metadata for filter controls.
 *
 * `ContentGroup` carries `name` (`Computer Systems`) but the filter row needs the
 * configured `label` (`SYSTEMS`), which is a presentation choice that belongs in
 * site.config rather than on the group.
 */
export interface CategoryFilter {
  slug: string;
  name: string;
  label: string;
  count: number;
}

export function getCategoryFilters(): CategoryFilter[] {
  const filters: CategoryFilter[] = [];

  for (const group of getAllCategories()) {
    const definition = categories.find((entry) => entry.slug === group.slug);
    if (!definition) continue;
    filters.push({
      slug: group.slug,
      name: group.name,
      label: definition.label,
      count: group.items.length,
    });
  }

  return filters;
}

export function getCategoryBySlug(slug: string): ContentGroup<BlogPost> | null {
  const wanted = slugify(decodeRouteParam(slug));
  return getAllCategories().find((group) => group.slug === wanted) ?? null;
}

/** Topic picker on the homepage — categories that actually have posts. */
export function getActiveCategories(): ContentGroup<BlogPost>[] {
  return getAllCategories().filter((group) => group.items.length > 0);
}

/* -------------------------------------------------------------------------- */
/* Navigation + aggregates                                                    */
/* -------------------------------------------------------------------------- */

export interface AdjacentItems {
  /** Newer item, or null at the newest end. */
  next: ContentItem | null;
  /** Older item, or null at the oldest end. */
  previous: ContentItem | null;
}

/**
 * Prev/next for the article footer (spec §31). The list is date-descending, so
 * "next" walks toward newer items and "previous" toward older — the convention
 * readers expect from a blog.
 */
export function getAdjacent(kind: "blog" | "note", slug: string): AdjacentItems {
  const list: ContentItem[] = kind === "blog" ? posts() : notes();
  const index = list.findIndex((item) => item.slug === slug);
  if (index === -1) return { next: null, previous: null };
  return {
    next: index > 0 ? list[index - 1] : null,
    previous: index < list.length - 1 ? list[index + 1] : null,
  };
}

export interface SiteCounts {
  posts: number;
  notes: number;
  projects: number;
  tags: number;
}

export function getCounts(): SiteCounts {
  return {
    posts: posts().length,
    notes: notes().length,
    projects: projects().length,
    tags: getAllTags().length,
  };
}

/** Newest-updated content across all kinds — the RSS feed. */
export function getAllFeedItems(): ContentItem[] {
  return [...posts(), ...notes(), ...projects()].sort((a, b) =>
    a.date === b.date ? a.slug.localeCompare(b.slug) : a.date < b.date ? 1 : -1,
  );
}

/**
 * Everything the ⌘K index needs (spec §40). Returns already-normalized items
 * so the search route never re-reads or re-parses anything.
 */
export function getSearchItems(): ContentItem[] {
  return [...posts(), ...notes(), ...projects()];
}

/* -------------------------------------------------------------------------- */
/* Client-safe projections                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A post reduced to what a list row needs.
 *
 * The blog index lists posts, and tag pages list posts *and* notes through the
 * same component — notes have no category, so `category` is nullable and `kind`
 * lets the row label which of the two it is.
 *
 * The projection exists because the blog index needs to render lists without
 * shipping article bodies to the browser. Sending full `BlogPost` objects would
 * drag `body`, `plainText` and `toc` along for every post; this is roughly 250
 * bytes per entry instead.
 */
export interface PostSummary {
  kind: "blog" | "note";
  slug: string;
  url: string;
  title: string;
  description: string;
  date: string;
  category: string | null;
  categorySlug: string | null;
  tags: string[];
  readingTime: number;
}

export function toPostSummary(item: BlogPost | Note): PostSummary {
  return {
    kind: item.kind === "note" ? "note" : "blog",
    slug: item.slug,
    url: item.url,
    title: item.title,
    description: item.description,
    date: item.date,
    category: item.kind === "blog" ? item.category : null,
    categorySlug: item.kind === "blog" ? item.categorySlug : null,
    tags: item.tags,
    readingTime: item.readingTime,
  };
}

export function getPostSummaries(): PostSummary[] {
  return posts().map(toPostSummary);
}

export type {
  BlogPost,
  ContentGroup,
  ContentItem,
  Note,
  NoteGroup,
  Project,
  ProjectLink,
  ProjectStatus,
  TocEntry,
} from "./types";
