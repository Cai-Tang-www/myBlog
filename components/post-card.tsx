import Link from "next/link";
import { formatPublishedAt, type PostSummary } from "@/lib/posts";
import styles from "./post-card.module.css";

interface PostCardProps {
  post: PostSummary;
  index?: number;
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${120 + index * 80}ms` }}
    >
      {post.cover ? (
        <div className={styles.coverWrap}>
          <img
            className={styles.cover}
            src={post.cover}
            alt={post.title}
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}
      <p className={styles.meta}>
        <span>{formatPublishedAt(post.publishedAt)}</span>
        <span>·</span>
        <span>{post.readingMinutes} 分钟阅读</span>
      </p>
      <h3 className={styles.title}>
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h3>
      <p className={styles.summary}>{post.summary}</p>
      <div className={styles.tags}>
        {post.tags.map((tag) => (
          <span key={tag} className="chip">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
