<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# blog 项目：给下个会话的交接

> 这一节由人工维护（不归 `next dev` 管）。改动项目状态时顺手更新它 ——
> 它是跨会话的长期记忆，比翻聊天记录可靠。

## 这是什么

像素风格的个人博客。Next.js 16 + TypeScript + Tailwind 4 + MDX，全部内容自托管、
零第三方请求。设计语言是「70% 现代极简 + 20% 像素 UI + 10% 像素插画」。

仓库：`github.com/Doraemon-void/blog`（public，分支 `main`）

## 现在是哪一步

- ✅ 站点完整可用，本地跑在 `localhost:3000`
- ✅ 内容是 6 篇 **Beej's Guide 网络编程**中文笔记（系列编排）
- ✅ 已推送到 GitHub
- ⬜ **待办：部署到服务器** —— 等用户提供：系统（Ubuntu?）、位置（大陆/香港/国外）、
  是否有域名、怎么连上服务器

## 目录与关键文件

```
content/blog/      随笔（零碎记录，需要 category，五个固定分类）
content/notes/     笔记（系统性内容，用 series + order 编排，不用 category）
content/projects/  项目
lib/content/       唯一的内容管线（读文件、解析 frontmatter、规范化）
lib/site.config.ts 站点身份的唯一来源（站名、导航、分类、社交链接）
lib/pixel-art/     所有像素画数据（palette / icons / doraemon / figures）
app/globals.css    全部设计令牌 + 像素组件类 + 正文排版
scripts/           check-content.mjs、check-contrast.mjs
public/fonts/      Fusion Pixel 子集 + OFL 许可证
```

## 约定（不要违反）

1. **内容只放 `content/`**，且必须走 `lib/content` 管线 —— 不允许任何消费者自己读文件或解析 frontmatter。
2. **所有颜色/间距/圆角/时长走 `app/globals.css` 的 token**，组件不硬编码色值。
3. **`<` 和 `{` 在正文里必须包成行内代码** —— MDX 会当成 JSX 解析并让构建失败。
4. **临时文件写 `D:\ZcodeProgram\Temp`**，不写 C 盘。
5. **中文标签的 slug 必须保留 CJK 字符**（`lib/utils.ts` 的 `slugify`）—— 早先的
   `[^a-z0-9]+` 会把中文剥成空串，静默导致标签页 404。
6. **笔记的日期不出现在任何列表上**（用户明确说日期不重要），它只用于 RSS/sitemap 排序。

## 已知坑（都是实际踩过的）

| 坑 | 说明 |
|---|---|
| **构建前必须停服务器** | `npm run build` 会重写 `.next`，正在跑的 `next start` 会被搞崩 |
| **dev 模式不刷新内容列表** | 新增 `.md` 后列表看不到（有内存缓存），重启或直接访问该页 URL |
| **GitHub 只能走 HTTPS** | SSH（22 和 443）被代理拦掉；HTTPS 间歇性掉包，失败就重试 |
| **GitHub 上的仓库别勾 README/.gitignore/license** | 勾了首次 push 会被拒 |
| **搜索索引不能用 `force-cache`** | 会让回访读者一直搜到旧索引（已修，别改回去） |
| **像素字体是子集** | 新标签用了子集外的字会回退到系统字体（不显示豆腐块，但风格不一致） |

## 常用命令

```bash
npm run dev              # 本地预览
npm run check:content    # ← 改完内容先跑这个（一次报全部问题，带行号）
npm run build            # 构建（同时做完整类型检查）
npm run check:contrast   # 配色对比度是否满足 WCAG AA
git add . && git commit -m "..." && git push
```

## 用户的操作水平

**git 和前端部署是完全新手**。给命令时要说明每一步在做什么、成功长什么样、
失败了怎么办。避免只丢一句命令。

用户是 C++/计算机系统方向的学生，技术概念可以讲深，但 Web 生态要讲清楚。

## 更详细的文档

- `README.md` —— 架构决策、设计取舍、为什么这么做
- `E:\Obsidian\编程\Blog教程.md` —— 面向用户的完整操作教程（8 章）
- `D:\ZcodeProgram\content-archive\README.md` —— 归档内容及恢复方法
