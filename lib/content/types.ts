import type { CategoryName } from "../site.config";

/**
 * Every content-shaped thing on the site is one of these three kinds. Blog
 * posts, notes, projects, the RSS feed, the ⌘K search index, the sitemap, tag
 * pages and category pages all consume the same normalized `ContentItem` — no
 * consumer is allowed to re-read the filesystem or re-parse frontmatter.
 */
export type ContentKind = "blog" | "note" | "project";

/** One heading in a document, used for the right-hand TOC (spec §30). */
export interface TocEntry {
  id: string;
  text: string;
  depth: 2 | 3;
}

interface ContentBase {
  kind: ContentKind;
  /** Filename without extension. Stable — it is the URL. */
  slug: string;
  /** Site-absolute path, e.g. `/blog/cpu-cache`. */
  url: string;
  title: string;
  description: string;
  /** `YYYY-MM-DD`, kept as a string so timezones can never shift it. */
  date: string;
  updated: string | null;
  tags: string[];
  draft: boolean;
  featured: boolean;
  /** Whole minutes, computed once here (spec §52). */
  readingTime: number;
  /** Short plain-text summary for lists and search results. */
  excerpt: string;
  toc: TocEntry[];
  /** Markdown stripped to prose — the search index and excerpt source. */
  plainText: string;
  /** Raw MDX body, with frontmatter removed. */
  body: string;
  /** Repo-relative path, surfaced in build-time validation errors. */
  filePath: string;
  /**
   * Optional series name — groups related notes under one heading on the notes
   * index instead of filing them by date.
   *
   * Date grouping was the wrong shape for this site: notes are a body of
   * material about a subject, and when they were written says nothing about how
   * they relate. `series` lets the author say that directly.
   */
  series: string | null;
  /**
   * Manual position within a series, lowest first. Null means "sort by date".
   *
   * Separate from `date` on purpose — the index entry for a series belongs at
   * the top even though it was written last.
   */
  order: number | null;
}

export interface BlogPost extends ContentBase {
  kind: "blog";
  category: CategoryName;
  categorySlug: string;
}

export interface Note extends ContentBase {
  kind: "note";
}

export type ProjectStatus = "active" | "wip" | "paused" | "archived";

export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project extends ContentBase {
  kind: "project";
  status: ProjectStatus;
  techStack: string[];
  links: ProjectLink[];
}

export type ContentItem = BlogPost | Note | Project;

/** A tag or category together with everything filed under it (spec §53, §54). */
export interface ContentGroup<T extends ContentItem = ContentItem> {
  /** Raw label as written in frontmatter, e.g. `CPU`. */
  name: string;
  /** URL-safe form, e.g. `cpu`. */
  slug: string;
  items: T[];
}

/**
 * A group of notes on the notes index.
 *
 * Replaces the earlier year → month tree (spec §32's "file tree" idea, which
 * assumed a chronological garden). The site's own author was explicit that the
 * date is not the organising principle here — a body of notes about one subject
 * belongs together, in the order the material should be read, not in the order
 * it happened to be written.
 *
 * `series` is null for standalone notes, which render without a heading.
 */
export interface NoteGroup {
  series: string | null;
  notes: Note[];
}

export type { ContentBase };
