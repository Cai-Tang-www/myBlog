"use client";

import { useEffect, useRef } from "react";

interface MermaidApi {
  initialize: (config: Record<string, unknown>) => void;
  run: (options?: { nodes?: Element[] }) => Promise<void>;
}

let mermaidInitialized = false;
let mermaidLoadingPromise: Promise<MermaidApi> | null = null;

function ensureMermaid(): Promise<MermaidApi> {
  if (!mermaidLoadingPromise) {
    mermaidLoadingPromise = import("mermaid").then(({ default: mermaid }) => {
      return mermaid as unknown as MermaidApi;
    });
  }

  return mermaidLoadingPromise;
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

      const mermaid = await ensureMermaid();
      if (cancelled) {
        return;
      }

      if (!mermaidInitialized) {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "default",
          suppressErrorRendering: false,
        });
        mermaidInitialized = true;
      }

      await mermaid.run({ nodes });
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
