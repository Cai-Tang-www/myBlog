"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import type { PostSection } from "@/lib/posts";
import styles from "./article-progress.module.css";

interface ArticleProgressProps {
  sections: PostSection[];
}

function findActiveSectionId(sections: PostSection[]): string | null {
  const offset = 140;
  let candidate: string | null = null;

  for (const section of sections) {
    const node = document.getElementById(section.id);
    if (!node) {
      continue;
    }
    const top = node.getBoundingClientRect().top;
    if (top <= offset) {
      candidate = section.id;
    } else {
      break;
    }
  }

  return candidate ?? sections[0]?.id ?? null;
}

export function ArticleProgress({ sections }: ArticleProgressProps) {
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null);

  useEffect(() => {
    if (sections.length === 0) {
      return;
    }

    let ticking = false;
    const update = () => {
      const current = findActiveSectionId(sections);
      setActiveId(current);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  const activeIndex = useMemo(() => {
    if (!activeId) {
      return 0;
    }
    const index = sections.findIndex((section) => section.id === activeId);
    return index < 0 ? 0 : index;
  }, [activeId, sections]);

  const progress = useMemo(() => {
    if (sections.length <= 1) {
      return 0;
    }
    return (activeIndex / (sections.length - 1)) * 100;
  }, [activeIndex, sections.length]);

  if (sections.length === 0) {
    return null;
  }

  return (
    <aside className={styles.wrap}>
      <p className={styles.kicker}>阅读进度</p>
      <div className={styles.rail} aria-hidden="true">
        <span className={styles.progress} style={{ height: `${progress}%` }} />
      </div>
      <ol className={styles.list}>
        {sections.map((section) => {
          const isActive = section.id === activeId;
          const levelClass =
            section.level === 1
              ? styles.level1
              : section.level === 2
                ? styles.level2
                : styles.level3;
          return (
            <li
              key={section.id}
              className={`${styles.item} ${levelClass} ${isActive ? styles.active : ""}`}
            >
              <button
                type="button"
                onClick={() => {
                  const node = document.getElementById(section.id);
                  if (!node) {
                    return;
                  }
                  node.scrollIntoView({ behavior: "smooth", block: "start" });
                  history.replaceState(null, "", `#${section.id}`);
                }}
              >
                {section.title}
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
