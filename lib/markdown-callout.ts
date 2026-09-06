/**
 * remark 插件：将 GitHub 风格的块引用警示语法渲染为 callout（提示框）。
 *
 * 输入（GFM 块引用）：
 *
 *   > [!NOTE]
 *   > 这是一段说明……
 *
 * 转换方式：命中标记的 `blockquote` mdast 节点被改写为
 * `data.hName = "div"` / `data.hProperties = { className: [...] }`，
 * 由 mdast-util-to-hast 渲染为 `<div class="callout callout-note">`；
 * 标记行转换为首段的 `.callout-title` 标题，正文沿用原有 mdast 子节点。
 *
 * 支持的标记：NOTE / TIP / IMPORTANT / WARNING / CAUTION（大小写不敏感）。
 * 若新增类型，需同步补充 `app/blog/[slug]/post.module.css` 中的配色样式。
 */

type CalloutKind = "note" | "tip" | "important" | "warning" | "caution";

const MARKER_PATTERN = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i;

const KIND_BY_MARKER: Record<string, CalloutKind> = {
  NOTE: "note",
  TIP: "tip",
  IMPORTANT: "important",
  WARNING: "warning",
  CAUTION: "caution",
};

const LABEL_BY_KIND: Record<CalloutKind, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
};

interface CalloutTextNode {
  type: "text";
  value: string;
}

interface CalloutParentNode {
  type: string;
  children: CalloutNode[];
  data?: Record<string, unknown>;
}

type CalloutNode = CalloutParentNode | CalloutTextNode | { type: string; value?: string };

interface CalloutParagraph extends CalloutParentNode {
  type: "paragraph";
}

interface CalloutBlockquote extends CalloutParentNode {
  type: "blockquote";
}

function isText(node: CalloutNode): node is CalloutTextNode {
  return node.type === "text" && typeof (node as CalloutTextNode).value === "string";
}

function convertCalloutBlockquote(blockquote: CalloutBlockquote): void {
  const children = blockquote.children;
  if (children.length === 0 || children[0].type !== "paragraph") {
    return;
  }

  const paragraph = children[0] as CalloutParagraph;
  const paragraphChildren = paragraph.children;
  if (paragraphChildren.length === 0) {
    return;
  }

  // 收集段首连续纯文本节点（标记不可能横跨非文本节点）。
  let runEnd = 0;
  while (runEnd < paragraphChildren.length && isText(paragraphChildren[runEnd])) {
    runEnd += 1;
  }
  if (runEnd === 0) {
    return;
  }

  const joined = paragraphChildren
    .slice(0, runEnd)
    .map((node) => (node as CalloutTextNode).value)
    .join("");

  const matched = MARKER_PATTERN.exec(joined);
  if (!matched) {
    return;
  }

  const marker = matched[0];
  const kind = KIND_BY_MARKER[matched[1].toUpperCase()];
  if (!kind) {
    return;
  }

  const remainder = joined.slice(marker.length).trimStart();
  const tail = paragraphChildren.slice(runEnd);

  // 折叠文本游程为单个文本节点（游程内均为纯文本，内容不丢失）。
  paragraph.children = [
    ...(remainder.length > 0 ? [{ type: "text" as const, value: remainder }] : []),
    ...tail,
  ];

  // 标记独立成段（无正文残留）时整段移除，后续段落直接作为正文。
  if (paragraph.children.length === 0) {
    children.shift();
  }

  // 块引用 → callout 容器。
  blockquote.data = {
    ...blockquote.data,
    hName: "div",
    hProperties: { className: ["callout", `callout-${kind}`] },
  };

  // 标记行渲染为首段标题。
  children.unshift({
    type: "paragraph",
    data: { hProperties: { className: ["callout-title"] } },
    children: [{ type: "text", value: LABEL_BY_KIND[kind] }],
  });
}

function transformTree(node: CalloutNode): void {
  if (!("children" in node) || !Array.isArray(node.children)) {
    return;
  }

  for (const child of node.children) {
    if (child.type === "blockquote") {
      convertCalloutBlockquote(child as CalloutBlockquote);
    }
    transformTree(child);
  }
}

/**
 * remark 插件工厂。
 */
export function remarkCallouts(): (tree: { type: string; children: CalloutNode[] }) => void {
  return (tree) => {
    transformTree(tree as unknown as CalloutNode);
  };
}
