import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import { buildImageUrl } from "@/lib/image";

const POSTS_DIRECTORY = path.join(process.cwd(), "content", "posts");
const WORDS_PER_MINUTE = 240;

interface PostFrontmatter {
  title?: string;
  summary?: string;
  publishedAt?: string;
  tags?: string[];
  cover?: string;
  featured?: boolean;
  draft?: boolean;
}

export interface PostSummary {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  tags: string[];
  cover?: string;
  featured: boolean;
  readingMinutes: number;
}

export interface PostDetail extends PostSummary {
  contentHtml: string;
}

function hydrateMarkdownImages(html: string): string {
  const withSource = html.replace(
    /(<img[^>]*\ssrc=")([^"]+)(")/gi,
    (_match, head: string, src: string, tail: string) => {
      return `${head}${buildImageUrl(src)}${tail}`;
    }
  );

  const withLazy = withSource.replace(
    /<img(?![^>]*\sloading=)([^>]*)>/gi,
    '<img loading="lazy"$1>'
  );

  return withLazy.replace(
    /<img(?![^>]*\sdecoding=)([^>]*)>/gi,
    '<img decoding="async"$1>'
  );
}

function safeDate(value: string | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function stripMarkdown(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/[>#*_~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(content: string): number {
  const normalized = stripMarkdown(content);
  if (!normalized) {
    return 0;
  }
  return normalized.split(" ").length;
}

function toSummary(
  slug: string,
  frontmatter: PostFrontmatter,
  markdown: string
): PostSummary {
  const words = countWords(markdown);
  return {
    slug,
    title: frontmatter.title ?? slug,
    summary: frontmatter.summary ?? "内容摘要待补充。",
    publishedAt: safeDate(frontmatter.publishedAt),
    tags: frontmatter.tags ?? [],
    cover: frontmatter.cover ? buildImageUrl(frontmatter.cover, { width: 960 }) : undefined,
    featured: Boolean(frontmatter.featured),
    readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
  };
}

function sortByPublishedAtDesc(posts: PostSummary[]): PostSummary[] {
  return [...posts].sort((a, b) => {
    return (
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  });
}

async function getPostFileNames(): Promise<string[]> {
  try {
    const files = await fs.readdir(POSTS_DIRECTORY);
    return files.filter((file) => file.endsWith(".md") || file.endsWith(".mdx"));
  } catch {
    return [];
  }
}

async function readPostSource(fileName: string): Promise<{
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
} | null> {
  const filePath = path.join(POSTS_DIRECTORY, fileName);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(raw);
    return {
      slug: fileName.replace(/\.(md|mdx)$/i, ""),
      frontmatter: data as PostFrontmatter,
      content,
    };
  } catch {
    return null;
  }
}

export async function getAllPosts(): Promise<PostSummary[]> {
  const fileNames = await getPostFileNames();
  const sourceList = await Promise.all(fileNames.map((file) => readPostSource(file)));

  const posts = sourceList
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .filter((entry) => !entry.frontmatter.draft)
    .map((entry) => toSummary(entry.slug, entry.frontmatter, entry.content));

  return sortByPublishedAtDesc(posts);
}

export async function getFeaturedPosts(limit = 3): Promise<PostSummary[]> {
  const posts = await getAllPosts();
  const featuredPosts = posts.filter((post) => post.featured);
  if (featuredPosts.length >= limit) {
    return featuredPosts.slice(0, limit);
  }

  return posts.slice(0, limit);
}

export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  const fileNames = await getPostFileNames();
  const target = fileNames.find(
    (fileName) => fileName.replace(/\.(md|mdx)$/i, "") === slug
  );

  if (!target) {
    return null;
  }

  const source = await readPostSource(target);
  if (!source || source.frontmatter.draft) {
    return null;
  }

  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHtml)
    .process(source.content);

  return {
    ...toSummary(source.slug, source.frontmatter, source.content),
    contentHtml: hydrateMarkdownImages(processed.toString()),
  };
}

export async function getRelatedPosts(
  slug: string,
  tags: string[],
  limit = 3
): Promise<PostSummary[]> {
  const posts = await getAllPosts();
  const tagSet = new Set(tags.map((tag) => tag.toLowerCase()));

  return posts
    .filter((post) => post.slug !== slug)
    .map((post) => {
      const overlap = post.tags.filter((tag) =>
        tagSet.has(tag.toLowerCase())
      ).length;
      return { post, overlap };
    })
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map(({ post }) => post);
}

export function formatPublishedAt(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
