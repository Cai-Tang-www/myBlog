"use client";

import { useEffect, useRef } from "react";

interface MermaidApi {
  initialize: (config: Record<string, unknown>) => void;
  run: (options?: { nodes?: Element[] }) => Promise<void>;
}

declare global {
  interface Window {
    mermaid?: MermaidApi;
    __mermaidLoadingPromise?: Promise<void>;
  }
}

let mermaidInitialized = false;

function ensureMermaidScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.mermaid) {
    return Promise.resolve();
  }

  if (window.__mermaidLoadingPromise) {
    return window.__mermaidLoadingPromise;
  }

  window.__mermaidLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Mermaid script"));
    document.head.appendChild(script);
  });

  return window.__mermaidLoadingPromise;
}

function collectMermaidNodes(root: HTMLElement): HTMLElement[] {
  const codeBlocks = Array.from(
    root.querySelectorAll("pre > code.language-mermaid")
  );

  const nodes: HTMLElement[] = [];
  for (const code of codeBlocks) {
    const pre = code.parentElement;
    if (!pre) {
      continue;
    }

    const container = document.createElement("div");
    container.className = "mermaid";
    container.textContent = code.textContent ?? "";
    pre.replaceWith(container);
    nodes.push(container);
  }

  return nodes;
}

interface MarkdownContentProps {
  html: string;
  className?: string;
}

export function MarkdownContent({ html, className }: MarkdownContentProps) {
  const hostRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderMermaid = async () => {
      if (!hostRef.current) {
        return;
      }

      const nodes = collectMermaidNodes(hostRef.current);
      if (nodes.length === 0) {
        return;
      }

      await ensureMermaidScript();
      if (cancelled || !window.mermaid) {
        return;
      }

      if (!mermaidInitialized) {
        window.mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "default",
          suppressErrorRendering: false,
        });
        mermaidInitialized = true;
      }

      await window.mermaid.run({ nodes });
    };

    renderMermaid().catch((error) => {
      console.error("Mermaid render failed", error);
    });

    return () => {
      cancelled = true;
    };
  }, [html]);

  return (
    <section
      ref={hostRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
