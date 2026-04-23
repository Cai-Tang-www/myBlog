export const siteConfig = {
  name: "Mosaic Log",
  title: "Mosaic Log | 技术写作与构建笔记",
  description:
    "聚焦工程实践、内容系统和产品设计的个人技术博客，采用 Next.js SSG 构建。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-domain.com",
  author: "Yun",
  links: {
    github: "https://github.com/your-account",
    rss: "/rss.xml",
  },
};

export type SiteConfig = typeof siteConfig;
