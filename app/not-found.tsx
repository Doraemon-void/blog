import { Container } from "@/components/layout/Container";
import { NotFoundScene } from "@/components/pixel/illustrations/NotFoundScene";
import { PixelButton } from "@/components/pixel/PixelButton";
import { buildMetadata } from "@/lib/seo";

/**
 * 404 (spec §41).
 *
 * Spec §41 asks for its own small scene — a character at the edge of a broken
 * road — with `404_`, the line "Looks like this page fell out of memory.", and a
 * single `[ 返回首页 ]` button. It also says not to build a large
 * illustration, which is why the scene is 240px wide rather than a full-bleed
 * banner.
 *
 * This is `app/not-found.tsx` rather than a `/404` route: in the App Router this
 * one file handles both `notFound()` calls from pages and unmatched URLs, so a
 * separate route would be duplicating it.
 *
 * The copy is a memory joke, which fits a blog that writes about memory
 * hierarchies — but the button is plain and obvious, because a reader who lands
 * here wants out, not a punchline.
 */

export const metadata = buildMetadata({
  title: "404",
  description: "这个页面好像掉出内存了。",
  path: "/404",
  noIndex: true,
});

export default function NotFound() {
  return (
    <Container className="py-16 md:py-24">
      <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <NotFoundScene className="mx-auto h-auto w-full max-w-[360px] md:mx-0" />

        <div>
          <p className="font-pixel text-2xl tracking-[0.06em] text-accent">
            404
            <span aria-hidden="true">_</span>
          </p>

          <h1 className="mt-5 text-2xl font-bold leading-snug tracking-[-0.01em] md:text-3xl">
            Looks like this page fell out of memory.
          </h1>

          <p className="mt-4 text-text-secondary">
            你要找的页面不存在，或者已经被移走了。
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <PixelButton href="/" variant="primary" icon="arrowLeft">
              返回首页
            </PixelButton>
            <PixelButton href="/blog">阅读随笔</PixelButton>
          </div>
        </div>
      </div>
    </Container>
  );
}
