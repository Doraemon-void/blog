/**
 * Single source of truth for everything identity-shaped.
 *
 * Renaming the site, changing the handle, adding a nav item or pointing at a
 * different GitHub account should never require touching a component. If a
 * string describes *who this blog belongs to*, it lives here.
 */

/** Canonical origin. Set NEXT_PUBLIC_SITE_URL in the deploy environment. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dora.dev"
).replace(/\/$/, "");

export const site = {
  /** Display name used in body copy. */
  name: "Dora",
  /** Wordmark, rendered in the pixel display face with a blinking cursor. */
  handle: "DORA_",

  /**
   * Latin role line.
   *
   * Used by the OpenGraph image, which is drawn with Satori and has **no CJK
   * glyphs** — Chinese here would render as tofu boxes in every share card. The
   * hero shows `roleZh` instead; the two are kept apart for that reason, not by
   * accident.
   */
  role: "Developer / Computer Science Student",
  /** Hero role line, pixel font, Chinese. */
  roleZh: "开发者 / 计算机科学学习者",

  /** Used in <title> templates, RSS and JSON-LD. */
  title: "Dora",
  tagline: "Learning, building and writing.",
  description:
    "记录编程、计算机系统、AI、图形学，以及我正在学习和思考的东西。",

  url: siteUrl,
  locale: "zh-CN",
  lang: "zh-CN",

  author: {
    name: "Dora",
    email: "hello@dora.dev",
    github: "https://github.com/dora",
  },

  /** Spec §39 / §85 — kept dry on purpose. */
  footerNote: "Built with ♥ and too much coffee.",

  /** RSS needs an explicit language tag per the RSS 2.0 spec. */
  feed: {
    title: "Dora",
    description: "零碎的知识、临时记下的想法，以及还没长成笔记的东西。",
  },
} as const;

/**
 * Header navigation, in order.
 *
 * Labels are Chinese because the site's chrome is Chinese; the handle in the
 * logo stays Latin because it is a wordmark, and brand names are not translated.
 * `match` drives the current-page indicator.
 */
export const navItems = [
  { href: "/", label: "首页", match: (p: string) => p === "/" },
  { href: "/blog", label: "随笔", match: (p: string) => p.startsWith("/blog") },
  {
    href: "/notes",
    label: "笔记",
    match: (p: string) => p.startsWith("/notes"),
  },
  {
    href: "/projects",
    label: "项目",
    match: (p: string) => p.startsWith("/projects"),
  },
  { href: "/about", label: "关于", match: (p: string) => p.startsWith("/about") },
] as const;

export const socialLinks = [
  { href: site.author.github, label: "GITHUB", external: true },
  { href: `mailto:${site.author.email}`, label: "EMAIL", external: false },
  { href: "/feed.xml", label: "RSS", external: false },
] as const;

/**
 * Spec §19 / §54 — the fixed category list.
 *
 * Categories are a closed set: a post's frontmatter must use one of these
 * `name` values, and `lib/content` rejects anything else at build time. Tags
 * are the open-ended axis; categories are the curated one.
 */
export const categories = [
  {
    slug: "programming",
    name: "Programming",
    label: "编程",
    description: "语言、范式、工程实践，以及写代码时踩过的坑。",
  },
  {
    slug: "systems",
    name: "Computer Systems",
    label: "系统",
    description: "从程序执行的角度理解计算机：CPU、内存、操作系统。",
  },
  {
    slug: "ai",
    name: "AI",
    label: "人工智能",
    description: "机器学习、算子、模型，以及它们背后的数学。",
  },
  {
    slug: "graphics",
    name: "Graphics",
    label: "图形学",
    description: "渲染、光栅化、着色器，和把数学变成像素的过程。",
  },
  {
    slug: "life",
    name: "Life",
    label: "生活",
    description: "学习记录、读书、游戏，以及偶尔的胡思乱想。",
  },
] as const;

export type Category = (typeof categories)[number];
export type CategoryName = Category["name"];

export function categoryByName(name: string): Category | undefined {
  return categories.find((c) => c.name === name);
}

export function categoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

/** Spec §16 — the CURRENTLY_ panel. Edit this file to update the homepage. */
export const currently = [
  { label: "LEARNING", value: "Computer Systems" },
  { label: "CODING", value: "C++ / Ascend C" },
  { label: "READING", value: "CSAPP" },
  { label: "PLAYING", value: "Phasmophobia" },
] as const;

/**
 * Spec §37 — tech stack as badges only.
 *
 * Spec §37 rules out skill bars and percentages outright, so this is a plain
 * list with no proficiency attached. The claim a reader can verify is
 * "I use this", which is also the only claim a badge can honestly make.
 */
export const techStack = [
  "C++",
  "Python",
  "TypeScript",
  "Linux",
  "Git",
  "Ascend C",
  "CUDA",
  "Next.js",
  "Tailwind CSS",
  "OpenGL",
] as const;

/**
 * Spec §38 — a compact timeline, newest year first.
 *
 * Spec §38 asks for a simple timeline with pixel dots and explicitly not a
 * resume. Each entry is a sentence, not a role and a date range.
 */
export const timeline = [
  {
    year: "2026",
    items: [
      "开始系统学习 Ascend AI Core 上的算子开发",
      "动手写了一个软件光栅化器，第一次把渲染管线跑通",
      "搭建了这个博客，开始把学过的东西写下来",
    ],
  },
  {
    year: "2025",
    items: [
      "认真读 CSAPP，把计算机系统从头梳理了一遍",
      "开始用 C++ 写一些真正有人用的工具",
      "第一次读开源的图形学代码，意识到自己什么都不懂",
    ],
  },
] as const;

/** Spec §40 — pages included in the ⌘K index, in result-priority order. */
export const searchKinds = ["blog", "note", "project"] as const;
