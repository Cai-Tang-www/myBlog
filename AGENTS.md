# AGENTS.md — Ca1_Tang / myBlog 项目指引

本仓库是一个个人博客：Next.js App Router + 静态导出（SSG）的前端项目。本文档面向在此仓库中写作、改代码或开 PR 的 AI 代理与协作者。

## 项目是什么

- **形态**：个人博客站点，静态导出后部署到 GitHub Pages（`.github/workflows/deploy-pages.yml`）。
- **内容管线**：`content/posts/*.md`（gray-matter frontmatter）→ remark/rehype 渲染 → 文章 HTML（服务端构建期完成）。
- **附带能力**：Pagefind 全文搜索、giscus 评论（预接入）、RSS / sitemap / robots 生成。

## 常用命令

```bash
npm run dev        # 本地开发
npm run lint       # ESLint（next/core-web-vitals + TS）
npm run build      # generate-rss.mjs + next build + pagefind --site out（完整验证）
npm run env:check  # 校验 .env.local 必需配置项
```

改动渲染管线、新增文章或布局后，务必跑一次 `npm run build` 验证。

> **⚠️ 关于 Next.js 版本**：本仓库使用 **Next 16**，若需编写或修改 Next 专属代码（路由、SSG、导出、metadata 等），先阅读 `node_modules/next/dist/docs/` 中对应的指南再动手，并留意其中的 deprecation 提示——API 可能与训练数据中的旧版本不同。

## 新增 / 编辑博客文章

1. 文件放 `content/posts/<slug>.md`；slug 为英文 kebab-case（文件名即 URL）。
2. YAML frontmatter 字段：
   - `title`（必填）：文章标题，同时用作页面 `<h1>` 与卡片标题。
   - `summary`（建议）：一句话摘要，用于列表卡片、页面头部与 SEO。
   - `publishedAt`（必填，`YYYY-MM-DD`）：列表按此倒序排列。
   - `tags`（数组）：标签 chips + “相关文章”匹配依据；同一系列文章建议共享一个系列 tag。
   - `draft: true`：草稿，构建期排除；`featured` / `featuredOrder`：首页精选（可选）。
   - `cover`（可选）：对象存储 key，例如 `blog/2026/hello-cover.jpg`。
3. 正文不要重复写 `# H1`（页面头部已渲染 frontmatter `title`），直接以 `##` 小节开始；`h1–h3` 会进入右侧阅读进度导航（`extractHeadingSections`）。
4. 图片直接写对象 key：`![封面](blog/2026/hello-cover.jpg)`，渲染时自动拼接 `NEXT_PUBLIC_IMAGE_BASE_URL` 并附加压缩参数（见 `lib/image.ts`）。

### 支持的 GitHub 风格警示块（callout）

正文可直接使用块引用标记语法，渲染为带样式与色条的提示框（引擎已内置，见下方“渲染管线”）：

```md
> [!NOTE]
> 说明类内容……

> [!WARNING]
> 注意 / 警告内容……
```

支持：`NOTE`、`TIP`、`IMPORTANT`、`WARNING`、`CAUTION`（大小写不敏感）。新增类型需同步改两处：`lib/markdown-callout.ts`（标记→类型映射）与 `app/blog/[slug]/post.module.css`（配色样式）。

## Markdown 渲染管线（改动时注意）

- `lib/posts.ts`：唯一入口。gray-matter 解析 → remark（gfm / math / callout 插件）→ rehype（katex / raw / stringify）→ HTML 字符串；另负责摘要、阅读时长、标题锚点注入与图片 URL 水合。
- `lib/markdown-callout.ts`：`> [!XXX]` 块引用 → `<div class="callout callout-xxx">` 的 remark 插件。
- `components/markdown-content.tsx`：客户端注入 HTML 并渲染 Mermaid 代码块。
- `app/blog/[slug]/page.tsx`：文章页；`data-pagefind-*` 属性服务 Pagefind 索引。

## 工程约定

- TypeScript（Next 默认严格）；组件分服务端组件与 `"use client"`（含浏览器副作用/事件时）。
- 样式使用 CSS Modules（`*.module.css`）；全局设计变量在 `app/globals.css`（`--surface-*`、`--text-*`、`--border-*` 等），不要硬编码新的主题色值绕过变量体系。
- 提交信息遵循 conventional commits（`feat` / `fix` / `content` / `style` / `docs` / `chore`…）。
- 分支与 PR：功能走 `feat/<topic>` 分支，经 PR 合入 `main`；不要直接推 `main`。
- 敏感信息：不提交 `.env.local` 或任何密钥；配置项清单见 `.env.example`。
- 修改 `app/sitemap.ts`、`scripts/generate-rss.mjs` 等产出文件时注意保持 URL 规范化（结尾斜杠、无重复斜杠）。

## 目录速览

```txt
app/                 # Next App Router：页面、路由、metadata
components/          # UI 组件（文章卡、头部、MarkdownContent、进度导航…）
content/posts/       # 全部博客 Markdown（写作主要工作区）
lib/                 # 文章读取 / markdown 渲染 / 图片 URL / 站点配置
scripts/             # RSS、环境检查等构建脚本
docs/                # 项目文档
.github/workflows/   # Pages 部署等 CI
```

## 红线

- 全站必须保持**可静态导出**（`output: "export"`，见 `next.config.ts`），不要引入依赖 Node 运行时的能力。
- 任何构建 tip 改动都要回归 `npm run build`（含 RSS + Pagefind 两步）。
