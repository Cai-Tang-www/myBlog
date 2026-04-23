---
title: 从想法到可交付博客：为什么我先做系统再做内容
summary: 我希望博客不是一次性页面，而是长期稳定产出的内容基础设施。所以我先搭建结构，再写文章。
publishedAt: 2026-04-22
tags:
  - Next.js
  - Architecture
  - ContentOps
featured: true
---

多数个人博客失败，不是因为没有灵感，而是因为**发布链路太长**。

我这次选择先搭系统，是为了把每次写作成本降低到最低。

## 设计目标

- 写作只关心 `content/posts/*.md`
- 构建自动生成静态页，不依赖后端
- 搜索、评论、图片托管都是可替换模块

## 实现思路

1. 用 Next.js App Router + `output: 'export'` 做纯静态输出
2. 文章来源使用 frontmatter + markdown
3. Pages + Actions 做自动部署
4. Pagefind 在构建后跑索引，不影响开发体验

## 结论

当你把博客当产品来做，内容才会稳定增长。  
系统不是负担，它是持续写作的杠杆。
