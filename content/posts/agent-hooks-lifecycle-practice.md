---
title: 把 Hook 当作 Agent 的神经系统：从生命周期扩展点到工程落地
summary: 我把钩子系统当成 Agent 的“神经反射弧”：事件是感知，钩子是反应，决策是动作。本文从设计哲学、实践模式到实现模板，给出一套可直接上手的方案。
publishedAt: 2026-04-25
tags:
  - Agent
  - Hooks
  - Lifecycle
  - Engineering
featured: true
---

最近我在系统化梳理 Agent 的 Hook 机制。  
核心判断很明确：**权限系统决定“能不能做”，Hook 系统决定“在何时、以什么方式做”**。  
如果把 Agent 看成一个可演化的工程体，Hook 不是“外挂”，而是生命周期上的一等扩展点。

这篇文章是我对钩子系统的阶段性总结，内容会更偏向“生命周期扩展点”的视角，也会给出我实际会用的实现策略。

## 1. 我对 Hook 的第一性理解

我现在把 Hook 系统定义为三层：

1. **事件层（When）**：在什么生命周期节点触发
2. **策略层（What）**：要审批、改写、补充上下文，还是只记录
3. **执行层（How）**：Command / Prompt / Agent / HTTP / Function 怎么落地

这三层拆开后，一个复杂的“Agent 行为治理”就会变成可以维护的工程系统，而不是临时脚本堆叠。

## 2. 生命周期视角：先画“信号流”，再写规则

我做 Hook 的顺序不是“先写脚本”，而是先画信号流：

1. 用户输入进来（`UserPromptSubmit`）
2. 模型决定是否调用工具（`PreToolUse`）
3. 工具执行成功/失败（`PostToolUse` / `PostToolUseFailure`）
4. 一轮响应结束（`Stop` / `StopFailure`）
5. 会话起止（`SessionStart` / `SessionEnd`）

这个顺序的价值是：你不会在错误的节点做正确的事。

例如：

- 你要“阻止危险写入”，就放在 `PreToolUse`
- 你要“做审计与通知”，就放在 `PostToolUse`
- 你要“后台检查并在异常时唤醒”，就放在 `Stop` + `asyncRewake`

## 3. 五类 Hook，我的选型标准

从工程成本和可控性看，我的默认选型是：

1. **先 Command，再 Prompt，最后 Agent**
2. **HTTP 只做外部集成，不做核心决策**
3. **Function 只在 SDK 内嵌场景用**

原因很简单：

- Command 可测试、可复现、可版本化，最稳定
- Prompt 适合语义判断，但要控制幻觉和延迟
- Agent 适合多步验证，但必须限流，不然成本会飙升

## 4. 决策协议：让 Hook 响应“结构化”

我实践里最关键的点是：**所有关键 Hook 都必须返回结构化 JSON**，不用“人类语义”猜意图。

最低可用协议：

```json
{
  "decision": "approve",
  "reason": "optional",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "updatedInput": {}
  },
  "additionalContext": "optional"
}
```

我的约束是：

1. `decision` 只允许 `approve` / `block`
2. 退出码和 `decision` 必须表达同一意图
3. 涉及改写输入时，必须带审计日志

## 5. 我的落地架构：三段式治理

我会把 Hook 系统拆成三段：

1. **前置防线（PreToolUse）**  
检查危险操作、路径边界、环境状态，必要时阻断
2. **后置审计（PostToolUse / PostToolUseFailure）**  
记录成功与失败上下文，形成可追踪链路
3. **会话治理（SessionStart / Stop / SessionEnd）**  
注入上下文、校验任务完成度、输出总结

下面是一个简化但可执行的思路：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "python scripts/guard_write_path.py",
            "timeout": 3000
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "http",
            "url": "https://audit.example.com/events",
            "async": true
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python scripts/check_pending_tasks.py",
            "asyncRewake": true
          }
        ]
      }
    ]
  }
}
```

## 6. 实践中最容易踩的坑

我踩过或见过最多的问题，基本集中在这几类：

1. **把耗时逻辑放在同步 `PreToolUse`**  
每个工具调用都被拖慢，体感“Agent 卡住”
2. **Hook 范围过宽**  
不写 matcher，导致每个事件都跑同一套脚本
3. **退出码和 JSON 冲突**  
维护者根本看不懂系统为何阻断
4. **把业务逻辑写死在 Hook 脚本里**  
后期改策略时只能重写，无法复用

我的修正策略是：

1. 同步路径只保留“快判定”
2. 复杂审查尽量异步化
3. 所有规则抽成可配置策略文件

## 7. 我现在的实现原则（可长期维护）

如果你也在做代码 Agent，我建议 Hook 系统从第一天就遵循这三条：

1. **最小拦截原则**：只拦截真正高风险事件
2. **可观测优先**：先记录，再优化，再自动化
3. **策略与执行解耦**：Hook 负责触发，策略文件负责判断

这三条的结果是：你的 Agent 不会因为功能增加而“不可解释”，也不会因为安全加码而“不可用”。

## 8. 接下来我会怎么迭代

我接下来准备做三件事：

1. 做一份统一的 Hook 响应 JSON Schema，避免团队内格式漂移
2. 做一套可复用的策略模板（写入保护、发布保护、敏感命令审查）
3. 把审计事件接到看板，形成“策略命中率 + 阻断原因”的反馈闭环

一句话总结：  
**Hook 系统不是“附加能力”，它是 Agent 工程化的主干。**  
当你开始按生命周期设计扩展点，Agent 才真正具备可控、可演化、可交付的能力。

---

附注：  
本次整理以《第8章：钩子系统——Agent 的生命周期扩展点》为核心参考。你给的另一份文档目前是空文件（0 字节），后续你补充内容后，我可以再做一版“观点融合增强稿”。
