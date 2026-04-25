"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [status, setStatus] = useState<"loading" | "ready" | "blocked">(
    "loading"
  );

  useEffect(() => {
    if (!config || !hostRef.current) {
      return;
    }
    setStatus("loading");

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
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", "dark_dimmed");
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-loading", "lazy");
    script.addEventListener("error", () => setStatus("blocked"));

    hostRef.current.innerHTML = "";
    hostRef.current.appendChild(script);

    const timer = window.setTimeout(() => {
      const frame = hostRef.current?.querySelector("iframe.giscus-frame");
      if (!frame) {
        setStatus("blocked");
      }
    }, 3000);

    const observer = new MutationObserver(() => {
      const frame = hostRef.current?.querySelector("iframe.giscus-frame");
      if (frame) {
        setStatus("ready");
      }
    });

    observer.observe(hostRef.current, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
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
      <h2 className={styles.title}>评论</h2>
      {status === "loading" ? (
        <p className={styles.hint}>评论组件加载中…</p>
      ) : null}
      {status === "blocked" ? (
        <p className={styles.hint}>
          评论未加载成功。请关闭广告/隐私拦截插件后刷新，或直接前往仓库 Discussions 参与讨论。
        </p>
      ) : null}
      <div ref={hostRef} />
    </section>
  );
}
