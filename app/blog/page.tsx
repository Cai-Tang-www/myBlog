import type { Metadata } from "next";
import Script from "next/script";
import { PostCard } from "@/components/post-card";
import { getAllPosts } from "@/lib/posts";
import styles from "./blog.module.css";

export const metadata: Metadata = {
  title: "文章归档",
  description: "浏览所有技术文章、构建记录和内容系统实践。",
  alternates: {
    canonical: "/blog",
  },
};

export default async function BlogPage() {
  const posts = await getAllPosts();
  const pagefindRoot = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/pagefind`;

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <p className={styles.kicker}>ARTICLE INDEX</p>
        <h1>文章归档</h1>
        <p>
          支持全文检索和标签筛选。每次构建后会自动更新静态搜索索引。
        </p>
      </header>

      <section className={styles.searchArea} id="phase-plan">
        <div id="search" />
      </section>

      <section className={styles.grid}>
        {posts.map((post, index) => (
          <PostCard key={post.slug} post={post} index={index} />
        ))}
      </section>

      <Script src={`${pagefindRoot}/pagefind-ui.js`} strategy="afterInteractive" />
      <Script id="pagefind-init" strategy="afterInteractive">
        {`
          const ensurePagefindStylesheet = () => {
            const hasStylesheet = document.querySelector("link[data-pagefind-style]");
            if (hasStylesheet) return;
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "${pagefindRoot}/pagefind-ui.css";
            link.setAttribute("data-pagefind-style", "true");
            document.head.appendChild(link);
          };

          const initPagefind = () => {
            ensurePagefindStylesheet();
            if (!window.PagefindUI) {
              setTimeout(initPagefind, 120);
              return;
            }
            new window.PagefindUI({
              element: "#search",
              showSubResults: true,
              highlightParam: "highlight",
              translations: {
                placeholder: "搜索文章标题、标签或正文内容"
              }
            });
          };
          initPagefind();
        `}
      </Script>
    </div>
  );
}
