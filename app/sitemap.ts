import type { MetadataRoute } from "next";

import {
  getAllCategories,
  getAllNotes,
  getAllPosts,
  getAllProjects,
  getAllTags,
} from "@/lib/content";
import { siteUrl } from "@/lib/site.config";

/**
 * sitemap.xml (spec §48).
 *
 * Every public URL is enumerated from the same content pipeline the pages use,
 * so a new post appears here without anyone remembering to add it.
 *
 * `lastModified` uses the post's `updated` date when it has one and its publish
 * date otherwise. That is the honest signal — claiming every page changed at
 * build time is a well-known way to get a sitemap ignored.
 */

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/blog`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/notes`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/projects`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/tags`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${siteUrl}/categories`, changeFrequency: "weekly", priority: 0.4 },
  ];

  const posts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${siteUrl}${post.url}`,
    lastModified: post.updated ?? post.date,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const notes: MetadataRoute.Sitemap = getAllNotes().map((note) => ({
    url: `${siteUrl}${note.url}`,
    lastModified: note.updated ?? note.date,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const projects: MetadataRoute.Sitemap = getAllProjects().map((project) => ({
    url: `${siteUrl}${project.url}`,
    lastModified: project.updated ?? project.date,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Category and tag routes are generated from the same lists the pages build
  // their params from, so the sitemap cannot list a URL that 404s.
  const categories: MetadataRoute.Sitemap = getAllCategories().map((group) => ({
    url: `${siteUrl}/categories/${group.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const tags: MetadataRoute.Sitemap = getAllTags().map((group) => ({
    url: `${siteUrl}/tags/${group.slug}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...posts, ...notes, ...projects, ...categories, ...tags];
}
