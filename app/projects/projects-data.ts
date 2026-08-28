export interface Project {
  id: string;
  name: string;
  type: string;
  period: string;
  tags: string[];
  description: string;
  contribution: string[];
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
    period: "长期参与",
    tags: ["Go", "AI Coding Agent", "Runtime Hooks", "SubAgent", "MCP", "WebSocket"],
    description: "本地优先的 AI Coding Agent。用户请求经 Gateway 进入 Runtime，调用工具后可通过 TUI、Web、桌面端或飞书完成交互。",
    contribution: [
      "推进 Runtime Hooks 从生命周期点位演进到带版本 Schema、Matcher DSL、command JSON 协议和 lint / dry-run / trace CLI 的扩展平台。",
      "实现 SubAgent 的 CapabilityToken、DAG 调度、取消 / 重试 / 恢复和工具调用闭环，统一复用权限与工作区沙箱。",
      "参与飞书审批状态机与本机 Runner 安全通道，支持远程触发本机工具且不开放入站端口。",
    ],
    problems: [
      "解决扩展点、事件契约和 payload 漂移导致的 Runtime 不可维护问题。",
      "解决多 Agent 失败恢复、越权路径、重复执行和多入口状态不一致问题。",
    ],
    visualLabel: "Runtime / Security / Extension",
    visualNodes: ["Gateway", "Runtime Hooks", "ToolManager", "Workspace Sandbox"],
    link: { label: "查看开源仓库", href: "https://github.com/1024XEngineer/neo-code" },
  },
  {
    id: "goai",
    name: "GoAI",
    type: "个人项目 · 多 Agent Runtime",
    period: "独立设计与实现",
    tags: ["Go", "Eino", "AG-UI", "A2A", "MCP", "Kafka", "OpenTelemetry", "React Flow"],
    description: "协议优先的多 Agent Runtime 原型，将 Agent 协作、异步恢复、权限、观测和管理面组织成可复用的平台底座。",
    contribution: [
      "设计 Thread / Run / Delegation 领域模型，建立 AG-UI、Eino Graph、A2A、MCP 与 Kafka 的边界。",
      "实现 callback 驱动的 Parent Run suspend / resume、fenced resume lease，以及 agent_group 的 all / any / quorum fan-in。",
      "补齐 Agent、Workflow、MCP Registry，Loop / Trace / Replay / Eval 观测，OpenAPI 与 React Flow Runtime Console。",
    ],
    problems: [
      "解决远程 Agent 协作中的崩溃接管、乱序回调、重复消息和部分失败问题。",
      "解决本地直调与远程调用语义分叉，让协议、鉴权、trace 和恢复逻辑保持一致。",
    ],
    visualLabel: "Protocol / Recovery / Observability",
    visualNodes: ["AG-UI", "A2A Gateway", "Run Lease", "Trace + Replay"],
    link: { label: "查看个人仓库", href: "https://github.com/Cai-Tang-www/GoAI" },
  },
  {
    id: "sre-buddy",
    name: "SRE-Buddy",
    type: "团队项目 · SRE 排障平台",
    period: "核心贡献者",
    tags: ["Go", "Gin", "Eino", "PostgreSQL", "MCP", "JumpServer", "mTLS", "WSS"],
    description: "面向 SRE 排障的 AI Agent 平台。模型提出诊断计划，系统结合会话、审批、审计、加密凭据和远程 Worker 执行目标机命令。",
    contribution: [
      "基于 Eino StatefulInterrupt 与 checkpoint 实现审批后继续执行，支持同一回合多工具乱序审批和并行执行。",
      "设计 ExecuteRequest、确定性 digest 与审批绑定，落地 Worker mTLS / WSS、短期凭证、连接复用和目标用户隔离。",
      "将 MCP 接入统一 Executor，完成不可变 Catalog、Schema 校验、按工具审批策略、配置加密和发布回滚链路。",
    ],
    problems: [
      "解决线上命令执行中的身份替换、未审批执行、重复副作用和恢复竞态。",
      "解决远程 Worker、MCP 工具和敏感配置接入后安全边界分散的问题。",
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
