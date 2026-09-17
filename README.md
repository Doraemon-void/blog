# dora.dev

一个清新像素风格的个人博客。Next.js 16 + TypeScript + Tailwind CSS 4 + MDX。

内容优先、设计克制。第一眼是一个干净的个人博客，第二眼才会注意到像素细节。

---

## 快速开始

```bash
npm install
npm run dev          # http://localhost:3000
```

其它命令：

```bash
npm run build            # 生产构建（同时做完整类型检查）
npm run start            # 运行已构建的站点
npm run typecheck        # 只做类型检查
npm run lint             # ESLint
npm run check:content    # 校验内容文件：MDX 语法、Obsidian 残留、图片路径、frontmatter
npm run check:contrast   # 校验配色对比度是否满足 WCAG AA
```

**改完 `content/` 里的东西，先跑 `npm run check:content`。**

`next build` 遇到第一个坏文件就停下，报的还是 MDX 解析器的原话
（``Unexpected character `-` before name``），不告诉你该改成什么。
`check:content` 一次列出所有问题，带文件、行号和修改建议，1~2 秒跑完。

| | `npm run build` | `npm run check:content` |
|---|---|---|
| 报几个错 | 一次一个 | 一次全部 |
| 行号 | 无 | 有 |
| 修改建议 | 无 | 有 |
| Obsidian 残留语法 | 查不出 | 查得出 |
| 图片路径 | 查不出 | 查得出 |

它把每个文件、以及每行可疑代码**真的交给 MDX 编译器**判断，而不是用正则猜 ——
早先手写的正则漏过中文（`<填写内容>`）和减号（`<-`），这正是改用编译器裁决的原因。

> 本项目在本机使用安装在 `D:\ZcodeProgram\InstallForZcode\node` 的 Node v24.21.0。
> 如果终端里 `node` 不可用，见该目录下的 `README.md`。

---

## 写一篇文章

在 `content/blog/` 放一个 `.mdx` 文件，文件名就是 URL：

```yaml
---
title: "理解 Cache 与 Memory"
description: "一句话摘要，会出现在列表和搜索结果里。"
date: "2026-09-16"
updated: "2026-09-16"        # 可选
category: "Computer Systems"  # 必填，且必须是固定分类之一
tags: [CPU, Cache, Memory]
featured: false               # true 会出现在首页 FEATURED_
draft: false                  # 生产构建会隐藏 draft
---
```

**分类是固定的五个**：`Programming` / `Computer Systems` / `AI` / `Graphics` / `Life`。
写错分类会让构建直接失败并指出文件和合法值 —— 这是故意的，避免出现一个没人能访问到的分类页。
需要更细的划分请用 `tags`。

笔记放 `content/notes/`（不需要 `category`；可用 `series` + `order` 编入系列，见下），项目放
`content/projects/`（支持 `status` / `techStack` / `links` / `order`）。

标题请用 Markdown 的 `##`，不要写 `<h2>` HTML —— 目录和锚点依赖 Markdown 解析。

### 笔记编入系列

notes 索引**不按日期分组**，而是按 `series` 分组、按 `order` 排序 —— 一批讲同一主题的笔记
应当聚在一起按阅读顺序排，而不是按写作日期：

```yaml
---
title: "三：System Calls"
series: "Beej's Guide 网络编程"
order: 3
---
```

`order: 0` 可以把目录排在系列最前，即使它是最后写的。不写 `series` 的笔记显示在最后。
日期仍然存在于 frontmatter 里（RSS 和 sitemap 排序要用），只是不再出现在笔记列表上。

### 代码块

````markdown
```cpp title="sum.cpp" showLineNumbers {8-10}
````

- `title` 显示在代码块顶栏；不写则用语言名
- `showLineNumbers` 开启行号（简短片段建议不开，更干净）
- `{8-10}` 高亮指定行
- 顶栏有 COPY 按钮，会把代码按行正确复制

---

## 目录结构

```
app/                     路由（App Router）
  blog/ notes/ projects/ 列表页与 [slug] 详情页
  tags/ categories/      标签与分类
  about/ not-found.tsx
  feed.xml/route.ts      RSS（force-static，构建期生成）
  search-index.json/     搜索索引（force-static，首次打开搜索时才拉取）
  sitemap.ts robots.ts opengraph-image.tsx
components/
  layout/   Header Footer Container MobileNav ThemeToggle NavLinks Logo
  pixel/    PixelSprite / PixelButton / PixelCard / PixelTag / PixelDivider
            PixelWindow / PixelBadge / PixelIcon / SectionHeader
            illustrations/  Hero 场景、头像、404 场景、页脚角色
  blog/     列表、文章头、目录、代码块、翻页、标签、笔记树、项目卡
  home/     Hero Currently LatestPosts FeaturedPost Topics ProjectPreview
  search/   SearchDialog（⌘K）
  seo/      JsonLd
content/    blog/ notes/ projects/  ← 所有文章内容
lib/
  content/  统一内容管线（见下）
  pixel-art/  palette / icons / hero-parts / figures  ← 所有像素画数据
  site.config.ts  ← 站点身份的唯一来源
scripts/check-contrast.mjs
scripts/check-content.mjs
```

---

## 几个关键设计决定

**所有内容走同一条解析管线。** `lib/content` 是唯一读文件、解析 frontmatter 的地方。
博客列表、文章页、笔记、项目、RSS、搜索索引、sitemap、标签页、分类页全部消费
同一份规范化的 `ContentItem`，没有任何一个消费者自己重新解析一遍 —— 所以它们
不可能对"这篇文章写了什么"产生分歧。

这一层**不依赖任何 Next.js API**，只用 `node:fs` + `gray-matter` + `remark`，
以便构建期产物复用。

**MDX 渲染器被隔离。** `next-mdx-remote` 只出现在 `lib/mdx.ts` 和 `MDXContent.tsx`。
目录、阅读时长、搜索文本、摘要全部由 `lib/content/parse.ts` 直接从原始 Markdown
产出，不经过渲染器 —— 换掉 MDX 库不需要重写内容层。

**像素画是代码，不是图片。** 小图标（≤32×32）用 `PixelSprite` 逐格渲染，会合并
同色游程后输出 SVG；Hero 场景、头像、404 场景等较大插画是手写的 inline SVG，
用 `<g>` 分组以便逐部件做动画。两者都只从 `lib/pixel-art/palette.ts` 取色，
所以整个站点的像素画不会跑色。零图片请求，任意分辨率都锐利。

插画里的天空/云/太阳有独立的三色令牌（`--px-sky` 等），它们**会随主题变暗**；
其余颜色继承主题。否则深色模式下窗户会变成一块发光的矩形。

**动画只用 CSS 且极少。** 全部动画只有：logo 光标闪烁（本站唯一闪烁的光标）、
Hero 里显示器光标闪烁 / 角色眨眼 / 云飘动 / 植物摆动、页脚角色第一次滚到底部时
挥手一次、以及页面淡入。`prefers-reduced-motion` 会全局关掉它们。

**搜索是构建期静态索引。** `app/search-index.json` 在构建时生成，按 ⌘K 才去拉取，
Fuse.js 也是那时才动态 import —— 从不搜索的读者不会下载任何相关代码。相比搜索 API
路由，这样做在纯静态部署下也能工作。

**字体全部自托管，没有任何第三方请求。**

| 用途 | 字体 | 体积 |
|---|---|---|
| 中文 + 英文界面标签 | Fusion Pixel（中文像素字体） | 34 KB |
| Logo、hero 标题 | Silkscreen | 8 KB |
| 拉丁正文 | Inter Variable | 47 KB |
| 中文正文 | 系统栈 `PingFang SC / HarmonyOS Sans SC / MiSans / Microsoft YaHei` | 0 |

**中文界面标签用的是真正的像素字体**，不是系统字体假装。Pixelify Sans 和 Silkscreen
都只有拉丁字形 —— 拿它们显示「笔记」会静默回退到系统黑体，像素感全丢，而这恰恰是最
需要像素感的地方。所以换成了 [Fusion Pixel Font](https://github.com/TakWolf/fusion-pixel-font)
（缝合像素字体，OFL-1.1，中日韩全覆盖）。

**它被裁剪过：896 KB → 34 KB。** 完整字体太大，而界面实际只用到 981 个字符
（遍历所有页面和状态收集，排除正文 —— 正文用系统字体，永远不会出现在像素字体里）。
将来新增的标签如果用到子集外的字，会**优雅回退**到系统字体而不是显示豆腐块，
只是那一两个字没有像素风。把新字符并进去重新裁剪：

```bash
pyftsubset fusion-pixel-12px-proportional-zh_hans.ttf.woff2 \
  --text-file=chars.txt --output-file=fusion-pixel-subset.woff2 \
  --flavor=woff2 --layout-features='*' --no-hinting
```

许可证在 `public/fonts/OFL.txt`，OFL 要求随字体一起分发。

该字体设计尺寸是 12px，**整倍数（12/24/36）渲染才是像素精准的**。界面标签用 12–14px
是在"对齐"和"中文可读性"之间取的折中 —— 11px 的汉字是真的看不清。

---

## 无障碍

- 所有可交互元素的边框用 `--border`（8.75:1 浅色 / 3.99:1 深色）
- 正文与次要文字都满足 WCAG AA（4.5:1）
- `npm run check:contrast` 会解析 `app/globals.css` 里的真实令牌值逐一校验，失败即退出非零
- 语义化标签、跳转到正文的 skip link、`:focus-visible` 全局焦点环
- 语义化 `<details>` 做移动端目录，不写自制的展开控件

`--border-soft` 是唯一的例外：它只用作区块之间的发丝线，分隔本身也由间距承担，
从不作为识别控件的唯一手段，所以按"可见即可"（≥1.2:1）校验而非 3:1。这一点在
`scripts/check-contrast.mjs` 里有说明。

---

## 已知取舍

- **`/blog` 是服务端渲染（ƒ）而不是静态页。** 因为它的搜索、分类筛选和分页都由
  URL 驱动（`?q=` / `?category=` / `?page=`），这样每种筛选结果都有真实可收录的
  URL。代价是该路由按请求渲染；内容读取本身有进程内缓存，开销很小。
  若将来需要纯静态部署，可改成客户端筛选，但会失去可收录的筛选 URL。
- **`sitemap.ts` / `robots.ts` 是 metadata routes**，构建期生成静态文件；
  `feed.xml` 与 `search-index.json` 是 Route Handler，用 `force-static` +
  `revalidate = false` 显式声明为构建期一次性生成（Route Handler 默认不缓存）。
- 只有 Logo 的 `_` 光标闪烁（spec §77）。所有区块标题的下划线是静态的。

---

## 部署

标准 Next.js 构建，Vercel 可直接部署。部署时设置环境变量：

```
NEXT_PUBLIC_SITE_URL=https://你的域名
```

它决定 canonical URL、OG、RSS 和 sitemap 里的绝对地址。

**不设置它，构建出来的站点会把自己的地址写成 `http://localhost:3000`** ——
并且 `next build` / `next start` 会打印一条警告提醒你。回退值故意选成 `localhost`
而不是某个像真域名的占位符：这样万一忘了设置，站点是"明显不对"而不是"看起来像对的"，
不会等到搜索引擎已经收录错域名才发现。

作者本人的邮箱和 GitHub 账号在 `lib/site.config.ts` 的 `author` 里，它们决定页头 GH
按钮、页脚链接和 JSON-LD 里的作者信息。邮箱目前还是模板占位值（见文件里的
`TODO(identity)`），上线前请换掉。

改站点名字、导航、社交链接、Currently 面板、Tech Stack、Timeline —— 全部只改
`lib/site.config.ts`。
