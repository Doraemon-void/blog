import type { Metadata, Viewport } from "next";

// Self-hosted fonts. Spec §6 wants a pixel face for chrome and a readable
// sans for body copy; spec §56 wants them optimised. These come from npm rather
// than a font CDN so the build has no external dependency and the reader makes
// no third-party request. Pixel faces are latin-only and subset, so the three
// files together are a few KB.
import "@fontsource-variable/inter/wght.css";
import "@fontsource/pixelify-sans/latin-400.css";
import "@fontsource/pixelify-sans/latin-700.css";
import "@fontsource/silkscreen/latin-400.css";

import "./globals.css";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, personJsonLd, websiteJsonLd } from "@/lib/seo";
import { site, siteUrl } from "@/lib/site.config";

/**
 * Root layout.
 *
 * `ThemeScript` runs before paint to apply the saved theme — see the comment in
 * that file for why this cannot be a React effect. `suppressHydrationWarning` on
 * `<html>` is required because that script mutates the class list before React
 * hydrates, which React would otherwise flag as a mismatch.
 */

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  ...buildMetadata(),
  title: {
    default: `${site.title} — ${site.role}`,
    // Spec §48: per-page titles, with the site name appended once.
    template: `%s — ${site.title}`,
  },
  authors: [{ name: site.author.name, url: siteUrl }],
  creator: site.author.name,
  applicationName: site.title,
  formatDetection: { email: false, address: false, telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Matches --bg in each theme, so mobile browser chrome blends with the page.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9f2" },
    { media: "(prefers-color-scheme: dark)", color: "#182022" },
  ],
};

const SKIP_LINK =
  "absolute left-4 top-4 z-50 -translate-y-20 rounded-[var(--radius-pixel-sm)] border-2 border-border bg-surface px-3 py-2 font-pixel text-xs focus:translate-y-0";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={site.lang} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-dvh flex-col">
        {/* Spec §47 — keyboard users can jump past the navigation. */}
        <a href="#main" className={SKIP_LINK}>
          跳到正文
        </a>

        <Header />

        <main id="main" className="flex-1">
          {children}
        </main>

        <Footer />

        <JsonLd data={websiteJsonLd()} />
        <JsonLd data={personJsonLd()} />
      </body>
    </html>
  );
}
