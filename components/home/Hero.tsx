import { Container } from "@/components/layout/Container";
import { Doraemon } from "@/components/pixel/illustrations/Doraemon";
import { PixelButton } from "@/components/pixel/PixelButton";
import { site } from "@/lib/site.config";

/** Stagger between the three dots, in seconds. */
const DOTS = [0, 0.2, 0.4];

/**
 * Homepage hero (spec §13, §59).
 *
 * Spec §13 rules out the SaaS-landing-page shape entirely: no oversized gradient
 * headline, no "Build the Future", no three competing CTAs, no dashboard
 * screenshot. What is left is a greeting, one line of who this is, one line of
 * what they write about, and exactly two buttons.
 *
 * Spec §59 fixes the visual hierarchy of the first screen: who I am, what I
 * write, then read the blog — the illustration is auxiliary and must not be the
 * first thing that registers. That is why the text column is wider, comes first
 * in source order, and the scene is capped at roughly a third of the width
 * (spec §14 puts the ceiling at 35–40%).
 *
 * Source order also settles the mobile stack: text above, scene below (spec §45).
 *
 * Spacing is deliberately larger than `SECTION_SPACING` — spec §62's 80–120px
 * governs the rhythm between content sections, and a hero that breathes a little
 * more at the top is what gives the page a beginning.
 */

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="border-b-2 border-border-soft py-16 md:py-20"
    >
      {/* The hero carries its own Container so its bottom rule spans the full
          viewport width, the way the spec's layout sketch shows section rules. */}
      <Container>
        <div className="grid items-center gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,0.62fr)] md:gap-16">
          <div>
            <p className="font-pixel text-sm tracking-[0.06em] text-accent">
              你好
              <span aria-hidden="true">_</span>
            </p>

            <h1
              id="hero-heading"
              // The dots are three separate animated spans, so the accessible
              // name is set here rather than left to be assembled from them —
              // otherwise a screen reader reads the heading with no punctuation.
              aria-label="Deep Thinking..."
              // Silkscreen, the display face. Sizes are whole multiples of the
              // 12px it is designed at (36px = 3x), so the pixels stay square
              // instead of resampling.
              className="mt-5 font-pixel-display text-3xl leading-[1.25] text-accent-blue md:text-4xl"
            >
              Deep Thinking
              {DOTS.map((delay, index) => (
                <span
                  key={index}
                  aria-hidden="true"
                  className="animate-px-dot"
                  style={{ animationDelay: `${delay}s` }}
                >
                  .
                </span>
              ))}
            </h1>

            <p className="mt-4 font-pixel text-xs tracking-[0.05em] text-text-secondary">
              {site.roleZh}
            </p>

            <p className="mt-6 max-w-[34ch] text-lg leading-relaxed text-text-secondary">
              记录编程、计算机系统、AI、图形学，以及我正在学习和思考的东西。
            </p>

            <p className="mt-3 text-text-secondary">{site.tagline}</p>

            {/* Spec §13: exactly two buttons. Primary mint, secondary white. */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <PixelButton
                href="/blog"
                variant="primary"
                icon="arrowRight"
                iconPosition="right"
              >
                阅读随笔
              </PixelButton>
              <PixelButton href="/about">关于我</PixelButton>
            </div>
          </div>

          {/* Purely decorative. The text beside it already carries the meaning,
              so describing the artwork would only pad out a screen reader's
              reading of the page (spec §59, §47).
              The 2px frame stops it floating: the portrait's blue reaches its
              own edges, and a bare image against the page background reads as a
              mistake rather than as art. */}
          <div
            aria-hidden="true"
            className="mx-auto w-full max-w-[380px] overflow-hidden rounded-[var(--radius-pixel-sm)] border-2 border-border md:mx-0 md:max-w-none"
          >
            <Doraemon className="h-auto w-full" />
          </div>
        </div>
      </Container>
    </section>
  );
}
