# Ca1_Tang

一个基于 Next.js SSG 的个人博客基础框架，目标是可长期写作、可自动部署、可扩展到 MCP。

## 已实现

- Next.js App Router + 静态导出（`output: "export"`）
- 首页（设计系统 + 动效）
- 博客列表页 / 文章详情页
- `content/posts` Markdown 内容管线
- giscus 评论组件预接入
- Pagefind 搜索挂载位
- GitHub Pages 部署 workflow

## 项目结构

```txt
.
├─ app/
│  ├─ blog/
│  │  ├─ [slug]/page.tsx
│  │  └─ page.tsx
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
├─ content/posts/
├─ docs/plan-package.md
├─ lib/
└─ .github/workflows/deploy-pages.yml
```

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
# 仅静态构建
npm run build

# 构建 + 生成 Pagefind 索引
npm run build:search
```

## giscus 配置

复制 `.env.example` 为 `.env.local` 并填写参数：

```bash
NEXT_PUBLIC_IMAGE_PROVIDER=qiniu # 或 volc
NEXT_PUBLIC_IMAGE_BASE_URL=

NEXT_PUBLIC_GISCUS_REPO=
NEXT_PUBLIC_GISCUS_REPO_ID=
NEXT_PUBLIC_GISCUS_CATEGORY=
NEXT_PUBLIC_GISCUS_CATEGORY_ID=
NEXT_PUBLIC_SITE_URL=
```

对象存储图片写法：Markdown 中可以直接写对象 key。

```md
![封面](blog/2026/hello-cover.jpg)
```

渲染时会自动拼接为 `${NEXT_PUBLIC_IMAGE_BASE_URL}/blog/2026/hello-cover.jpg` 并附加压缩参数。

## 部署到 GitHub Pages

1. 仓库 Settings -> Pages -> Source 选择 `GitHub Actions`。
2. 推送到 `main` 分支后会触发 `.github/workflows/deploy-pages.yml`。
3. 可选：在仓库 Variables 里添加 `PAGES_CUSTOM_DOMAIN=blog.yourdomain.com`，workflow 会自动写入 `CNAME`。
4. 在 Pages 设置中绑定同域名，并在 DNS 配置对应解析。

## 集成清单

- 账号注册和 key 获取清单见 [docs/integration-setup.md](./docs/integration-setup.md)
- 配置完成后执行 `npm run env:check`

## 下一步建议

- 接入对象存储自动上传脚本（可选）
- 在 CI 中补充 RSS、sitemap 生成
- 增加 MCP server 包和发布流水线
