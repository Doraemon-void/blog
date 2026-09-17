import { Container } from "@/components/layout/Container";
import { PixelCard } from "@/components/pixel/PixelCard";
import { PixelBadge } from "@/components/pixel/PixelBadge";
import { Avatar } from "@/components/pixel/illustrations/Avatar";
import { SectionHeader } from "@/components/pixel/SectionHeader";
import { getCounts } from "@/lib/content";
import { PAGE_TOP } from "@/lib/layout";
import { buildMetadata } from "@/lib/seo";
import { site, techStack, timeline } from "@/lib/site.config";

/**
 * About (spec §36–§38).
 *
 * Spec §36 asks for a personal profile: pixel avatar on the left, an intro on
 * the right, then the fuller story. Spec §37 wants tech stack as badges with no
 * skill bars; spec §38 wants a compact timeline with pixel dots, not a resume.
 *
 * The page closes by stating what the blog is for. That is genuinely useful on
 * an About page — it tells a new reader whether subscribing is worth it — and
 * the spec's own §86 frames the whole site around that goal.
 */

export const metadata = buildMetadata({
  title: "关于",
  description: "A little more about the human behind the keyboard.",
  path: "/about",
});

export default function AboutPage() {
  const counts = getCounts();

  return (
    <Container className={PAGE_TOP}>
      <SectionHeader
        level="h1"
        size="lg"
        id="about-heading"
        label="关于"
        description="键盘后面那个人的一些事。"
      />

      {/* Spec §36 — avatar left, intro right. On mobile the avatar comes first
          because a face is the fastest way to make a page feel like a person. */}
      <section className="mb-16 grid items-start gap-10 md:grid-cols-[200px_minmax(0,1fr)] md:gap-14">
        <Avatar className="mx-auto w-fit md:mx-0" />

        <div>
          <h2 className="text-2xl font-bold tracking-[-0.01em] md:text-3xl">
            HI, I&apos;M {site.name.toUpperCase()}
            <span aria-hidden="true" className="text-accent">
              _
            </span>
          </h2>

          <p className="mt-5 text-lg leading-relaxed text-text-secondary">
            I&apos;m a developer and computer science learner.
          </p>

          <p className="mt-3 text-lg leading-relaxed text-text-secondary">
            I enjoy understanding how computers actually work — from software to
            hardware.
          </p>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
            <Stat label="随笔" value={counts.posts} />
            <Stat label="笔记" value={counts.notes} />
            <Stat label="项目" value={counts.projects} />
            <Stat label="标签" value={counts.tags} />
          </div>
        </div>
      </section>

      {/* Spec §36 — the longer introduction. */}
      <section className="mb-16 max-w-[68ch]" aria-labelledby="story-heading">
        <h2
          id="story-heading"
          className="mb-6 font-pixel text-xs tracking-[0.06em] text-text-secondary"
        >
          关于我
          <span aria-hidden="true" className="text-accent">
            _
          </span>
        </h2>

        <div className="flex flex-col gap-5 text-text-secondary">
          <p>
            我是一名计算机相关专业的学生，主要的方向是计算机系统和 AI
            基础设施。比起把某个框架用熟，我更好奇的是它底下发生了什么——一个循环为什么快了几十倍，一次内存访问为什么要绕这么多层，一段并发代码在什么情况下会彻底失去意义。
          </p>
          <p>
            平时写得最多的是 C++，最近在学 Ascend C，在 AI Core
            上写向量算子。也在补图形学，自己写过一个小型的软件光栅化器，在这之前我以为自己懂渲染管线。
          </p>
          <p>
            除此之外我喜欢玩游戏，喜欢开源，也喜欢把学到的东西整理成能给别人看的形状。这三件事其实是一件事——都是在理解一个系统，然后试着让它变得更好一点。
          </p>
        </div>
      </section>

      {/* Spec §37 — badges, no skill bars, no scores. */}
      <section className="mb-16" aria-labelledby="stack-heading">
        <h2
          id="stack-heading"
          className="mb-6 font-pixel text-xs tracking-[0.06em] text-text-secondary"
        >
          TECH STACK
          <span aria-hidden="true" className="text-accent">
            _
          </span>
        </h2>

        <ul className="flex flex-wrap gap-2">
          {techStack.map((tech) => (
            <li key={tech}>
              <PixelBadge>{tech}</PixelBadge>
            </li>
          ))}
        </ul>
      </section>

      {/* Spec §38 — pixel dots, no resume. */}
      <section className="mb-16" aria-labelledby="timeline-heading">
        <h2
          id="timeline-heading"
          className="mb-6 font-pixel text-xs tracking-[0.06em] text-text-secondary"
        >
          TIMELINE
          <span aria-hidden="true" className="text-accent">
            _
          </span>
        </h2>

        <ol className="flex flex-col gap-8 border-l-2 border-border-soft pl-6">
          {timeline.map((entry) => (
            <li key={entry.year} className="relative">
              {/* The pixel dot sits on the rule. A square, not a circle —
                  a round marker would be the one non-pixel shape on the page. */}
              <span
                aria-hidden="true"
                className="absolute -left-[31px] top-2 h-2.5 w-2.5 bg-accent"
              />
              <p className="font-pixel text-sm tracking-[0.05em] text-text">
                {entry.year}
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-text-secondary">
                {entry.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {/* Why the blog exists. Spec §86 frames the whole site around this. */}
      <section className="mb-8" aria-labelledby="blog-purpose-heading">
        <PixelCard className="p-6 md:p-8">
          <h2
            id="blog-purpose-heading"
            className="font-pixel text-xs tracking-[0.06em] text-text-secondary"
          >
            这个博客是做什么的
            <span aria-hidden="true" className="text-accent">
              _
            </span>
          </h2>

          <div className="mt-5 flex max-w-[64ch] flex-col gap-4 text-text-secondary">
            <p>
              把学过的东西写下来，逼自己确认是不是真的懂了。如果一篇文章里有一句话我写不清楚，那通常说明那个地方我没搞明白。
            </p>
            <p>
              所以这里的文章都有一个共同点：它们都从一个具体的困惑开始，而不是从
              &ldquo;某某技术概述&rdquo; 开始。
            </p>
          </div>
        </PixelCard>
      </section>
    </Container>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-pixel text-xs tracking-[0.06em] text-accent">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums text-text">{value}</p>
    </div>
  );
}
