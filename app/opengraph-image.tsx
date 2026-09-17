import { ImageResponse } from "next/og";

import { site, siteUrl } from "@/lib/site.config";

/**
 * OpenGraph card (spec §48).
 *
 * `lib/seo.ts` points every page's `og:image` and `twitter:image` here, so until
 * this route existed those tags referenced a 404 — every share on social or in a
 * chat client rendered as a bare link.
 *
 * Generated rather than shipped as a PNG so it stays in step with site.config:
 * renaming the site updates the card with no image editing.
 *
 * **Text is Latin-only on purpose.** The card is drawn with the font Satori
 * bundles, which has no CJK coverage — rendering 你好 here would produce tofu
 * boxes. The Chinese description therefore stays in the metadata, where the
 * crawler reads it as text, and the visible card carries the wordmark, the role
 * and the English tagline.
 *
 * Sizes match what social crawlers expect (1.91:1, and above their 600px
 * minimum) and are exported so Next emits the right `og:image:width/height`.
 */

export const alt = `${site.title} — ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** A short row of pixels, echoing the site's decorative squares (spec §63). */
function PixelRow({ tones }: { tones: string[] }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {tones.map((tone, index) => (
        <div
          key={index}
          style={{
            width: 22,
            height: 22,
            backgroundColor: tone,
            border: "3px solid #34495E",
          }}
        />
      ))}
    </div>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#F7F9F2",
          border: "14px solid #34495E",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              fontSize: 84,
              fontWeight: 700,
              color: "#263238",
              letterSpacing: -1,
            }}
          >
            {site.handle.replace(/_+$/, "")}
            <span style={{ color: "#3D7A66" }}>_</span>
          </div>

          <div
            style={{
              marginTop: 20,
              fontSize: 30,
              color: "#5C6B73",
              letterSpacing: 1,
            }}
          >
            {site.role}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <PixelRow
              tones={["#A8D8C5", "#A8D8EA", "#F6E58D", "#F3AAA6", "#76B7A0"]}
            />
            <div style={{ marginTop: 28, fontSize: 34, color: "#263238" }}>
              {site.tagline}
            </div>
            <div style={{ marginTop: 12, fontSize: 24, color: "#5C6B73" }}>
              {siteUrl.replace(/^https?:\/\//, "")}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
