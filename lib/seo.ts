import type { Metadata } from "next";

import { site, siteUrl } from "./site.config";
import type { BlogPost, ContentItem, Project } from "./content/types";

/**
 * Metadata and structured data (spec §48).
 *
 * One place builds every page's Metadata so titles, canonicals and social cards
 * cannot drift between routes. Structured data is emitted as JSON-LD, which is
 * what search engines actually consume for article and breadcrumb rich results.
 */

export const DEFAULT_OG_IMAGE = "/opengraph-image";

interface BuildMetadataInput {
  title?: string;
  description?: string;
  /** Site-absolute path, e.g. `/blog/cpu-cache`. Drives the canonical URL. */
  path?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  /** Set on pages that should stay out of the index, e.g. the 404 page. */
  noIndex?: boolean;
}

export function buildMetadata({
  title,
  description = site.description,
  path = "/",
  type = "website",
  publishedTime,
  modifiedTime,
  tags,
  noIndex = false,
}: BuildMetadataInput = {}): Metadata {
  const url = `${siteUrl}${path === "/" ? "" : path}`;
  const ogTitle = title ? `${title} — ${site.title}` : site.title;

  return {
    // Omitted entirely when there is no title, rather than set to `undefined`.
    //
    // This looks like a no-op either way and is not: Next merges page metadata
    // over layout metadata by key, so a page that *declares* `title: undefined`
    // overwrites the layout's `title.default` and the rendered <title> comes out
    // empty. The homepage is the one page that passes no title, so it shipped
    // with no title tag at all — blank browser tab, nothing for a crawler to
    // show as the result heading. Spreading conditionally keeps the key absent
    // so the layout's default and template apply as intended.
    ...(title ? { title } : {}),
    description,
    keywords: tags,
    alternates: {
      canonical: url,
      types: {
        // Spec §55 — RSS discovery for feed readers.
        "application/rss+xml": `${siteUrl}/feed.xml`,
      },
    },
    openGraph: {
      type,
      url,
      title: ogTitle,
      description,
      siteName: site.title,
      locale: site.locale,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: ogTitle }],
      ...(type === "article" && publishedTime
        ? { publishedTime, modifiedTime: modifiedTime ?? publishedTime, tags }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/* -------------------------------------------------------------------------- */
/* JSON-LD                                                                    */
/* -------------------------------------------------------------------------- */

// The `<script>` wrapper that renders these lives in components/seo/JsonLd.tsx,
// so this module stays free of JSX and usable from any server context.

export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.title,
    url: siteUrl,
    description: site.description,
    inLanguage: site.locale,
    author: { "@type": "Person", name: site.author.name },
  };
}

export function personJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.author.name,
    url: siteUrl,
    email: site.author.email,
    sameAs: [site.author.github],
    description: site.description,
    jobTitle: site.role,
  };
}

/**
 * Article structured data for blog posts and notes.
 *
 * `dateModified` falls back to `datePublished` because every post here has a
 * publish date but only some are revised — an absent field is better than a
 * wrong one.
 */
export function articleJsonLd(item: ContentItem): Record<string, unknown> {
  const url = `${siteUrl}${item.url}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: item.title,
    description: item.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: item.date,
    dateModified: item.updated ?? item.date,
    keywords: item.tags.join(", "),
    inLanguage: site.locale,
    author: {
      "@type": "Person",
      name: site.author.name,
      url: siteUrl,
    },
    publisher: { "@type": "Person", name: site.author.name },
    ...(item.kind === "blog" ? { articleSection: (item as BlogPost).category } : {}),
  };
}

export function breadcrumbJsonLd(
  trail: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.path}`,
    })),
  };
}

/** Software source code data for project detail pages (spec §35). */
export function projectJsonLd(project: Project): Record<string, unknown> {
  const url = `${siteUrl}${project.url}`;
  const source = project.links.find((link) => link.label.toUpperCase() === "SOURCE");

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: project.title,
    description: project.description,
    url,
    dateCreated: project.date,
    author: { "@type": "Person", name: site.author.name },
    ...(project.techStack.length > 0
      ? { programmingLanguage: project.techStack.join(", ") }
      : {}),
    ...(source ? { codeRepository: source.href } : {}),
  };
}
