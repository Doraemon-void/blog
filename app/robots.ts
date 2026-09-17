import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site.config";

/**
 * robots.txt (spec §48).
 *
 * A metadata route, so Next emits it as a static file at build time — no runtime
 * cost and no caching question to answer.
 *
 * There is nothing to disallow: every page here is meant to be indexed. The
 * `host` directive is included for Yandex, which is the one crawler that
 * consumes it.
 */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The search index is a build artifact, not a page. Crawling it wastes
        // budget on ~40KB of JSON and can surface raw content text as a result.
        disallow: ["/search-index.json"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
