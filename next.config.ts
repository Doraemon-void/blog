import type { NextConfig } from "next";

/**
 * Warn when a production build has no `NEXT_PUBLIC_SITE_URL`.
 *
 * Without it every canonical URL, sitemap entry, RSS item and OG tag is written
 * with the fallback origin from `lib/site.config.ts`. That fallback is
 * `http://localhost:3000`, which is safe (obviously wrong rather than plausibly
 * wrong) but still wrong, and the build is the one moment the mistake is cheap
 * to catch. Next sets `NODE_ENV` before it loads this file, so `build` and
 * `start` are the only commands that reach the branch.
 *
 * It prints once per process that loads the config, so a `next build` shows it
 * twice. Two copies of a short warning is the right trade for not missing it.
 */
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SITE_URL) {
  console.warn(
    [
      "",
      "[next.config] NEXT_PUBLIC_SITE_URL 未设置 —— canonical / sitemap / RSS / OG",
      "             里的地址会写成 http://localhost:3000。",
      "             上线前请设置真实域名：NEXT_PUBLIC_SITE_URL=https://your-domain.com npm run build",
      "",
    ].join("\n"),
  );
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
