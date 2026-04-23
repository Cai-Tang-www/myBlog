export interface PhaseItem {
  phase: string;
  focus: string;
  deliverables: string[];
  duration: string;
}

export const phasePlan: PhaseItem[] = [
  {
    phase: "Phase 1",
    focus: "骨架与视觉基线",
    deliverables: [
      "Next.js SSG 项目结构、设计系统变量、首页与博客列表页",
      "Markdown 内容管线、静态路由与 SEO Metadata 模板",
      "可复用组件层（导航、卡片、页脚、评论挂载位）",
    ],
    duration: "1-2 天",
  },
  {
    phase: "Phase 2",
    focus: "发布链路与外部服务",
    deliverables: [
      "GitHub Actions 自动部署到 GitHub Pages",
      "Pagefind 构建后索引接入",
      "giscus 评论、对象存储图片域名与 Next Image Loader 配置",
    ],
    duration: "1 天",
  },
  {
    phase: "Phase 3",
    focus: "内容效率与 MCP",
    deliverables: [
      "构建期产出标准化文章索引 JSON",
      "可发布 npm 的 blog MCP server（list/read/search）",
      "内容编写与发布 SOP（Vibe coding 工作流）",
    ],
    duration: "1-2 天",
  },
];
