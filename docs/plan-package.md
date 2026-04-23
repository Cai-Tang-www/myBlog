# 个人博客计划套餐（High Standard）

## 阶段目标

### Phase 1（已落地基础版）
- 目标：建立可写作、可浏览、可扩展的博客基础框架。
- 交付：
  - Next.js SSG（`output: export`）与 GitHub Pages 兼容配置
  - 首页（高识别度视觉 + 动效）
  - 博客列表页与文章详情页
  - Markdown 内容目录与 frontmatter 管线
  - giscus 组件占位（环境变量驱动）
  - Pagefind 前端挂载位（部署构建时生成索引）
- DoD：
  - `npm run lint` 通过
  - `npm run build` 通过
  - 新增 markdown 文件后，文章可被自动收录

### Phase 2（发布与服务）
- 目标：完成对外可访问、可持续部署的生产链路。
- 交付：
  - GitHub Actions 自动部署到 GitHub Pages
  - 自定义域名绑定（`blog.yourdomain.com`）
  - 图片对象存储域名（`img.yourdomain.com`）与 Next Loader
  - Pagefind 索引纳入 CI 构建
  - giscus Discussions 与分类治理
- DoD：
  - 合并到主分支自动部署成功
  - 搜索可命中新增文章
  - 评论可正确按路径归档

### Phase 3（MCP 与内容生产力）
- 目标：把博客升级为 Agent 可调用知识源。
- 交付：
  - 构建期文章索引 JSON（标题、摘要、标签、时间、slug）
  - 独立 npm 包发布的 MCP server（list/read/search）
  - 站点提供 MCP 接入文档与复制配置按钮
  - 写作 SOP（Vibe coding 模板）
- DoD：
  - `npx @scope/blog-mcp` 可用
  - Agent 可检索并引用你博客内容
  - 每周可稳定发布新文章

## 推荐目录

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
├─ lib/
├─ docs/
└─ .github/workflows/
```
