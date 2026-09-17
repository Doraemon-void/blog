import { getAllFeedItems } from "@/lib/content";
import { site, siteUrl } from "@/lib/site.config";

/**
 * RSS feed (spec §48, §55).
 *
 * **Static generation strategy.** `dynamic = "force-static"` with
 * `revalidate = false` makes Next run this handler once at build time and serve
 * the result as a static file. That is the right answer here for a specific
 * reason: a Next Route Handler is *not* cached by default (the default changed
 * in Next 15 — handlers used to be cached, and are not now), so without these
 * exports this would re-read and re-render the entire content tree on every
 * request, forever.
 *
 * `revalidate = false` rather than a timeout because there is nothing to
 * revalidate against. All content is local files; when they change the site is
 * rebuilt. A time-based revalidate would only produce a feed that silently
 * disagrees with the pages it links to.
 *
 * The XML is built by hand rather than pulled from a feed library — RSS 2.0 for
 * a handful of items is a page of string building, and it keeps the escaping
 * below explicit, which is the part libraries get wrong quietly.
 */

export const dynamic = "force-static";
export const revalidate = false;

/** Escapes text and attribute content. `&` must go first or it double-escapes. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RSS 2.0 requires RFC 822 dates, not ISO 8601. */
function toRfc822(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? new Date(0).toUTCString()
    : parsed.toUTCString();
}

export function GET() {
  const items = getAllFeedItems().slice(0, 30);
  const lastBuild = items[0]?.date
    ? toRfc822(items[0].date)
    : new Date(0).toUTCString();

  const entries = items
    .map((item) => {
      const url = `${siteUrl}${item.url}`;
      const category =
        item.kind === "blog"
          ? `<category>${escapeXml(item.category)}</category>`
          : "";

      return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${toRfc822(item.date)}</pubDate>
      <description>${escapeXml(item.description)}</description>
${category}
${item.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join("\n")}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.feed.title)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(site.feed.description)}</description>
    <language>${escapeXml(site.locale)}</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <generator>Next.js</generator>
    <atom:link href="${escapeXml(`${siteUrl}/feed.xml`)}" rel="self" type="application/rss+xml" />
${entries}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
