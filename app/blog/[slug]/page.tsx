import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Comments } from "@/components/comments";
import { MarkdownContent } from "@/components/markdown-content";
import { PostCard } from "@/components/post-card";
import {
  formatPublishedAt,
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/posts";
import styles from "./post.module.css";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

function splitTitleForDisplay(title: string): string[] {
  const normalized = title.trim();
  if (!normalized) {
    return [title];
  }

  const preferredSeparators = ["：", ":"];
  for (const separator of preferredSeparators) {
    const index = normalized.indexOf(separator);
    if (index > 0 && index < normalized.length - 1) {
      const head = normalized.slice(0, index + 1).trim();
      const tail = normalized.slice(index + 1).trim();
      if (head && tail) {
        return [head, tail];
      }
    }
  }

  return [normalized];
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "文章不存在",
    };
  }

  return {
    title: post.title,
    description: post.summary,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.publishedAt,
      tags: post.tags,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post.slug, post.tags, 3);
  const titleLines = splitTitleForDisplay(post.title);

  return (
    <div className={`container ${styles.page}`}>
      <article className={styles.article} data-pagefind-body>
        <header className={styles.header}>
          <p className={styles.meta}>
            <span>{formatPublishedAt(post.publishedAt)}</span>
            <span>·</span>
            <span>{post.readingMinutes} 分钟阅读</span>
          </p>
          <h1 data-pagefind-meta="title">
            {titleLines.map((line, index) => (
              <span className={styles.titleLine} key={`${line}-${index}`}>
                {line}
              </span>
            ))}
          </h1>
          <p className={styles.summary}>{post.summary}</p>
          <div className={styles.tags}>
            {post.tags.map((tag) => (
              <span key={tag} className="chip" data-pagefind-filter={`tag:${tag}`}>
                {tag}
              </span>
            ))}
          </div>
          {post.cover ? (
            <img
              className={styles.heroImage}
              src={post.cover}
              alt={post.title}
              loading="eager"
              decoding="async"
            />
          ) : null}
        </header>

        <MarkdownContent className={styles.content} html={post.contentHtml} />

        <div className={styles.backArea}>
          <Link href="/blog" className="button-secondary">
            返回文章列表
          </Link>
        </div>

        <Comments />
      </article>

      {relatedPosts.length > 0 ? (
        <aside className={styles.related}>
          <h2>相关文章</h2>
          <div className={styles.relatedGrid}>
            {relatedPosts.map((relatedPost, index) => (
              <PostCard key={relatedPost.slug} post={relatedPost} index={index} />
            ))}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
