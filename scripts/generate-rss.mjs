import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(__dirname, "..", "content", "posts");
const PUBLIC_DIR = join(__dirname, "..", "public");

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-domain.com";
const SITE_TITLE = "Ca1_Tang | 技术写作与构建笔记";
const SITE_DESC =
  "聚焦工程实践、内容系统和产品设计的个人技术博客，采用 Next.js SSG 构建。";
const SITE_AUTHOR = "Ca1_Tang";

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(str) {
  return `<![CDATA[${str}]]>`;
}

function safeDate(value) {
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

async function getPosts() {
  const files = await readdir(POSTS_DIR);
  const mdFiles = files.filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));

  const posts = [];
  for (const file of mdFiles) {
    const raw = await readFile(join(POSTS_DIR, file), "utf-8");
    const { data } = matter(raw);
    if (data.draft) continue;
    posts.push({
      slug: file.replace(/\.(md|mdx)$/i, ""),
      title: data.title ?? file.replace(/\.(md|mdx)$/i, ""),
      summary: data.summary ?? "",
      publishedAt: safeDate(data.publishedAt).toISOString(),
      tags: data.tags ?? [],
    });
  }

  posts.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return posts;
}

async function main() {
  const posts = await getPosts();
  const baseUrl = SITE_URL.replace(/\/$/, "");

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${baseUrl}/blog/${post.slug}/</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}/</guid>
      <description>${cdata(post.summary)}</description>
      <author>${escapeXml(SITE_AUTHOR)}</author>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
${post.tags.map((t) => `      <category>${escapeXml(t)}</category>`).join("\n")}
    </item>`
    )
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${baseUrl}/</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Next.js SSG</generator>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <webMaster>${escapeXml(SITE_AUTHOR)}</webMaster>
${items}
  </channel>
</rss>`;

  await writeFile(join(PUBLIC_DIR, "rss.xml"), rss, "utf-8");
  console.log(`[rss] Generated RSS feed with ${posts.length} posts`);
}

main().catch((err) => {
  console.error("[rss] Failed to generate RSS feed:", err);
  process.exit(1);
});
