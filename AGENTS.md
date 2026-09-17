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
- ✅ 已推送到 GitHub —— 但这只意味着**源码在 GitHub 上**，网站并没有"上线"。
  仓库没开 Pages（API `has_pages: false`），也没有任何 CI/部署配置，除了本机
  `localhost:3000` 之外没有任何网址能访问到它
- ✅ 身份修正（页面上看不出来的那部分）：页头 GH 按钮、页脚、JSON-LD 已指向真实
  账号 `Doraemon-void`（原来指向占位的 `github.com/dora`，那是**别人的号**）；
  canonical/sitemap/RSS/OG 不再默认写成 `dora.dev`，改为回退到
  `http://localhost:3000` 并在生产构建时警告
- ⬜ **待办：身份还剩三个值没定** —— 都在 `lib/site.config.ts`：作者邮箱
  （`hello@dora.dev` 是模板占位，`TODO(identity)` 标着）、站名与署名
  （`Dora` / `DORA_`，可能是有意的化名）、真实域名
- ⬜ **进行中：部署到自己的服务器** —— 用户已定路线：**已有服务器（能 SSH 登录）+
  大陆机房 + 域名还没买**。大陆机房意味着域名要解析到 80/443 必须先过 ICP 备案
  （常见 2~3 周），所以部署拆成两个阶段：**阶段一**先用 IP 把站点跑起来（不需要
  域名和备案），**阶段二**备案下来后绑域名 + certbot 上 HTTPS。
  **完整操作手册已经写好：`deploy/README.md`**，systemd unit 和 nginx 配置在
  `deploy/` 下，照抄即可。还缺用户提供：服务器 IP、Ubuntu 版本、登录方式，
  以及阶段一执行的结果
- ⬜ **待办：`content/blog/` 和 `content/projects/` 两个目录还不存在** —— 导航里
  「随笔」「项目」点进去是空页，`/categories` 的五个分类也都还是 0 篇。
  这是"没内容"而不是"坏了"：首页各区块无内容时会自动隐藏

## 目录与关键文件

```
content/blog/      随笔（零碎记录，需要 category，五个固定分类）—— 目录还没建
content/notes/     笔记（系统性内容，用 series + order 编排，不用 category）
content/projects/  项目 —— 目录还没建
lib/content/       唯一的内容管线（读文件、解析 frontmatter、规范化）
lib/site.config.ts 站点身份的唯一来源（站名、导航、分类、社交链接）
lib/pixel-art/     所有像素画数据（palette / icons / doraemon / figures）
app/globals.css    全部设计令牌 + 像素组件类 + 正文排版
scripts/           check-content.mjs、check-contrast.mjs
deploy/            部署到自建服务器的东西：blog.service（systemd）、
                   nginx-blog.conf（反向代理）、README.md（逐步操作手册）
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
7. **空列表保持原样，不要加解释文案** —— 用户看过之后明确表示 `/projects` 的空白
   网格、`/categories` 的五张 0 POSTS 卡片就是他要的效果，加文案的改动已回退。
   （`/blog`、`/tags`、`/notes` 和分类详情页本来就有空状态文案，那是既有的，别删；
   只是不要再往新的空列表上加。）

## 已知坑（都是实际踩过的）

| 坑 | 说明 |
|---|---|
| **构建前必须停服务器** | `npm run build` 会重写 `.next`，正在跑的 `next start` 会被搞崩 |
| **`:3000` 上跑的可能是 `next start`** | 它服务的是构建产物，不是源码 —— 改了代码刷新浏览器也看不到变化。先 `Ctrl+C` 停掉，再 `npm run build && npm run start`。想改一行看一行就用 `npm run dev`（但别和 `next start` 抢同一个端口/产物） |
| **生产构建要设 `NEXT_PUBLIC_SITE_URL`** | 不设的话 canonical / sitemap / RSS / OG 里的地址全写成 `http://localhost:3000`（这是有意的回退值，比像真域名的占位符安全）。`next.config.ts` 会在生产构建时打印警告 |
| **`NEXT_PUBLIC_SITE_URL` 是构建期写死的** | 它在 `next build` 时被内联进产物，**改完必须重新 `npm run build`** —— 只 `systemctl restart` 或者只改 `.env.production` 都不生效。所以换域名 = 改 `.env.production` + 重新构建 |
| **dev 模式不刷新内容列表** | 新增 `.md` 后列表看不到（有内存缓存），重启或直接访问该页 URL |
| **GitHub 只能走 HTTPS** | SSH（22 和 443）被代理拦掉；HTTPS 间歇性掉包，失败就重试 |
| **GitHub 上的仓库别勾 README/.gitignore/license** | 勾了首次 push 会被拒 |
| **搜索索引不能用 `force-cache`** | 会让回访读者一直搜到旧索引（已修，别改回去） |
| **像素字体是子集** | 新标签用了子集外的字会回退到系统字体（不显示豆腐块，但风格不一致） |
| **清华的 `nodejs-release` 镜像 Node 落后一年** | 它上面 v24 只到 24.1.0（而开发机是 24.21.0）。装 Node 用 `https://cdn.npmmirror.com/binaries/node/v<版本>/node-v<版本>-linux-x64.tar.xz`，npmmirror 这个镜像跟得上。注意 `aarch64` 机器要把文件名里的 `linux-x64` 换成 `linux-arm64` |

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
- `deploy/README.md` —— 部署到自建服务器的逐步操作手册（阶段一 IP 访问 →
  阶段二域名 + 备案 + HTTPS，含排错）
- `E:\Obsidian\编程\Blog教程.md` —— 面向用户的完整操作教程（8 章）
- `D:\ZcodeProgram\content-archive\README.md` —— 归档内容及恢复方法
