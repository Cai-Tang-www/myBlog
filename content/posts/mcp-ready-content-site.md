---
title: 让内容站点具备 MCP 能力：从索引到工具接口
summary: 当站点产出结构化索引后，MCP server 就能把你的文章变成 Agent 可调用的知识面。
publishedAt: 2026-04-18
tags:
  - MCP
  - Agent
  - Search
featured: false
---

如果只看页面，博客只是展示层。  
如果给它加 MCP，它就变成了可查询、可组合的知识 API。

## 推荐拆层

1. 构建阶段产出 `catalog.json` 和文章索引
2. MCP server 读取索引并暴露 `list/read/search`
3. 工具说明文档放在博客内，方便别人直接接入

## 价值

- Agent 能直接复用你的文章知识
- 内容检索不需要再爬页面
- 后续可加“引用来源”与版本信息

这就是为什么内容站值得做成“系统产品”，而不是单纯静态页面。
