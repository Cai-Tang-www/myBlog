export const siteConfig = {
  name: "Ca1_Tang",
  title: "Ca1_Tang | 技术写作与构建笔记",
  description:
    "聚焦工程实践、内容系统和产品设计的个人技术博客，采用 Next.js SSG 构建。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-domain.com",
  author: "Ca1_Tang",
  links: {
    github: "https://github.com/Cai-Tang-www",
    rss: "/rss.xml",
  },
};

export type SiteConfig = typeof siteConfig;
