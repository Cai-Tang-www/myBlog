"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import styles from "./comments.module.css";

interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
}

function readGiscusConfig(): GiscusConfig | null {
  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

  if (!repo || !repoId || !category || !categoryId) {
    return null;
  }

  return { repo, repoId, category, categoryId };
}

export function Comments() {
  const pathname = usePathname();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const config = useMemo(() => readGiscusConfig(), []);

  useEffect(() => {
    if (!config || !hostRef.current) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", config.repo);
    script.setAttribute("data-repo-id", config.repoId);
    script.setAttribute("data-category", config.category);
    script.setAttribute("data-category-id", config.categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-term", pathname ?? "");
    script.setAttribute("data-strict", "1");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", "preferred_color_scheme");
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-loading", "lazy");

    hostRef.current.innerHTML = "";
    hostRef.current.appendChild(script);
  }, [config, pathname]);

  if (!config) {
    return (
      <section className={styles.fallback}>
        <h2>评论区预留</h2>
        <p>
          当前还未配置 giscus。将 `.env.local` 添加以下变量后，评论会自动生效：
          `NEXT_PUBLIC_GISCUS_REPO`、`NEXT_PUBLIC_GISCUS_REPO_ID`、
          `NEXT_PUBLIC_GISCUS_CATEGORY`、`NEXT_PUBLIC_GISCUS_CATEGORY_ID`。
        </p>
      </section>
    );
  }

  return (
    <section className={styles.wrapper} aria-label="评论区">
      <div ref={hostRef} />
    </section>
  );
}
