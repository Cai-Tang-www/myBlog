---
title: 用 Vibe Coding 写博客：把 AI 当协作工程师
summary: Vibe coding 不等于随便写，而是把“需求-实现-验证”拆分得足够清楚，让 AI 稳定交付。
publishedAt: 2026-04-20
tags:
  - VibeCoding
  - Workflow
  - AI
featured: true
---

我把写博客拆成三个动作：结构、内容、校验。

## 结构

先让 AI 搭目录和组件，把基础路由、样式、元信息一次性建好。

## 内容

再让 AI 参与起草提纲、整理要点、生成第一版草稿。

## 校验

最后明确验证标准：

- 语义结构是否完整
- 示例是否可执行
- 页面是否移动端可读
- 构建是否通过

```bash
npm run lint
npm run build:search
```

这套流程的本质是：让 AI 做高频重复劳动，人来把控质量和方向。
