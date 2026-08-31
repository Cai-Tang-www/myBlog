export interface Project {
  id: string;
  name: string;
  type: string;
  period: string;
  tags: string[];
  description: string;
  features: string[];
  problems: string[];
  visualLabel: string;
  visualNodes: string[];
  images?: { src: string; alt: string; width: number; height: number }[];
  link?: { label: string; href: string };
}

export const projects: Project[] = [
  {
    id: "neo-code",
    name: "neo-code",
    type: "团队开源项目 · MIT",
    period: "持续建设",
    tags: ["Go", "AI Coding Agent", "Runtime Hooks", "SubAgent", "MCP", "WebSocket"],
    description: "本地优先的 AI Coding Agent，让模型在真实工作区中理解代码、修改文件、执行命令并管理会话；同一套能力可通过 Gateway 接入终端、Web、桌面端与飞书。",
    features: [
      "工作区理解与工具执行：读取项目、分析代码、修改文件、执行命令，围绕真实上下文完成开发任务。",
      "多端与协议接入：TUI、Web UI、桌面端和飞书共享 Gateway，通过 JSON-RPC、SSE 或 WebSocket 接入。",
      "可扩展运行时：支持多模型 Provider、会话持久化、记忆、Skills、MCP 与主动连接 Gateway 的本地 Runner。",
    ],
    problems: [
      "减少在终端、编辑器和协作工具之间反复搬运上下文，让 AI 直接进入真实项目工作流。",
      "在扩展本机工具能力的同时保持安全边界：本地 Runner 主动连接 Gateway，无需开放入站端口。",
    ],
    visualLabel: "Runtime / Security / Extension",
    visualNodes: ["Gateway", "Runtime Hooks", "ToolManager", "Workspace Sandbox"],
    images: [
      {
        src: "/images/projects/neo-code-summary.png",
        alt: "NeoCode 桌面端项目总结与权限请求界面",
        width: 3056,
        height: 1656,
      },
      {
        src: "/images/projects/neo-code-feishu.png",
        alt: "飞书中的 Neo-Code 任务状态与工具审批消息",
        width: 3070,
        height: 1826,
      },
    ],
    link: { label: "查看开源仓库", href: "https://github.com/1024XEngineer/neo-code" },
  },
  {
    id: "goai",
    name: "GoAI",
    type: "个人项目 · 多 Agent Runtime",
    period: "独立设计",
    tags: ["Go", "Eino", "AG-UI", "A2A", "MCP", "Kafka", "OpenTelemetry", "React Flow"],
    description: "基于 Go 的多 Agent 协议运行时平台，为 Agent 协作提供通信、执行、权限、异步恢复、回放与观测等可复用底座。",
    features: [
      "协议运行时：用 AG-UI 承载用户与 Runtime 的交互，用 A2A 处理 Agent 委派、状态更新和结果回流。",
      "统一执行模型：以 Thread、Message、Run、Delegation 组织协作上下文，接入 Eino Graph / Workflow 与 MCP 工具。",
      "工程化底座：提供 Agent Registry、JWT / RBAC、Kafka、Redis、MySQL，以及 Trace、Replay、Eval 等运行能力。",
    ],
    problems: [
      "避免每个 Agent 应用重复实现通信、鉴权、异步执行、状态持久化和观测基础设施。",
      "处理跨 Agent 调用中的乱序回调、重复消息、部分失败与崩溃接管，让协作过程可恢复、可追踪。",
    ],
    visualLabel: "Protocol / Recovery / Observability",
    visualNodes: ["AG-UI", "A2A Gateway", "Run Lease", "Trace + Replay"],
    link: { label: "查看个人仓库", href: "https://github.com/Cai-Tang-www/GoAI" },
  },
  {
    id: "sre-buddy",
    name: "SRE-Buddy",
    type: "团队项目 · 可审计 AI 运维排障工作台",
    period: "团队项目",
    tags: ["Go", "Gin", "Eino", "PostgreSQL", "MCP", "JumpServer", "mTLS", "WSS"],
    description: "把自然语言对话、模型推理、工具调用、人工审批和基础设施执行放进同一个 SRE 工作台，让排障过程清晰、可控、可回放。",
    features: [
      "对话式排障：在持续会话中展示诊断过程、工具参数、审批状态、执行输出和最终结论。",
      "受控执行：只读操作可按策略直接执行，高风险操作进入审批；通过 JumpServer 和一次性 Worker 诊断真实主机。",
      "MCP 与审计：从管理后台接入远端 MCP Server，持久化会话、流式事件和审计记录，并对敏感结果进行扫描。",
    ],
    problems: [
      "解决 AI 直接触达生产主机时权限不清、过程不可见、审批与实际执行请求不一致的问题。",
      "解决远程 Worker、MCP 工具和敏感凭据接入后安全边界分散、结果难以追溯的问题。",
    ],
    visualLabel: "Approval / Worker / MCP Governance",
    visualNodes: ["AI Plan", "Approval Gate", "mTLS Worker", "Audit + Result"],
    images: [
      {
        src: "/images/projects/sre-buddy-investigation.png",
        alt: "SRE-Buddy 网络排障会话与命令执行结果",
        width: 3582,
        height: 1768,
      },
      {
        src: "/images/projects/sre-buddy-mcp-admin.png",
        alt: "SRE-Buddy 管理后台中的 MCP 服务配置",
        width: 3584,
        height: 1776,
      },
    ],
  },
];
