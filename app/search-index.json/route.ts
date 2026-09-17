import { getSearchItems } from "@/lib/content";
import { slugify } from "@/lib/utils";

/**
 * Search index (spec §40).
 *
 * **Static generation strategy.** Same treatment as the RSS feed:
 * `force-static` plus `revalidate = false`, so Next renders this once at build
 * time and serves it as a static file. A Route Handler is not cached by default,
 * and a search index rebuilt per request would re-read every content file on
 * every keystroke-driven fetch.
 *
 * Served as a separate file rather than inlined into the client bundle, so a
 * reader who never opens the ⌘K dialog downloads none of it. The dialog fetches
 * this on first open and caches it with `force-cache`.
 *
 * The documents come straight from `lib/content` — the same normalized items the
 * pages render. Nothing is re-parsed here, which is the point: the search index
 * cannot disagree with the pages about what a post says.
 */

export const dynamic = "force-static";
export const revalidate = false;

/** Per-document text cap. Enough to match a phrase, small enough to stay cheap. */
const MAX_TEXT_LENGTH = 4000;

export function GET() {
  const documents = getSearchItems().map((item) => ({
    kind: item.kind,
    slug: item.slug,
    url: item.url,
    title: item.title,
    description: item.description,
    ...(item.kind === "blog" ? { category: item.category } : {}),
    tags: item.tags.map(slugify),
    date: item.date,
    text: item.plainText.slice(0, MAX_TEXT_LENGTH),
  }));

  return Response.json(
    { generatedAt: new Date().toISOString(), documents },
    {
      headers: {
        // Static output, but a browser should still revalidate it so a redeploy
        // does not leave readers searching yesterday's index.
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    },
  );
}
