---
title: 从 DAG 梦想回到工程现实：我做 SubAgent 的一次架构转向
summary: 从并发 DAG 调度到顺序 Todo + inline subagent，我把一次“很酷但过重”的设计收敛成可交付主链路。这篇复盘聚焦动机、实现、踩坑和工程判断。
publishedAt: 2026-05-08
tags:
  - SubAgent
  - AgentLoop
  - ReAct
  - Engineering
featured: true
---

我这次想聊一个很真实的话题：  
**我们明知道并发 DAG 很酷，为什么最后还要回到“顺序 Todo + inline subagent”？**

这不是“技术降级”，而是一次典型的工程取舍。  
如果你正在做 code agent，这篇文章可能会帮你少走一段弯路。

---

## 先说结论

我最后做的选择是：

- 主路径从自动 DAG 派发收敛为顺序 Todo 执行
- 子代理通过显式工具 `spawn_subagent(mode=inline)` 调用
- 子代理结果即时回灌主代理，不引入隐藏调度状态
- 安全链路仍统一经过 ToolManager、Permission、Sandbox

对应 issue / PR：

- Epic：[#273](https://github.com/1024XEngineer/neo-code/issues/273)
- 路线调整：[#364](https://github.com/1024XEngineer/neo-code/issues/364)
- 落地 PR：[#365](https://github.com/1024XEngineer/neo-code/pull/365)

一句话概括就是：  
**先把单循环跑稳，再谈复杂并发。**

---

## 1. 我一开始为什么执着做 SubAgent

动机其实很直接：我想要更干净的上下文和并发能力。

在主 agent 的早期实践里，我遇到过这些问题：

- tool 调用轮次多了之后，历史上下文越来越脏
- 提示词越来越长，模型“专注单任务”的能力下降
- ReAct loop 稳定性受影响，容易漂移

所以我当时相信：

1. 子代理可以隔离任务上下文，减少幻觉
2. 并发执行可以提升整体任务推进速度
3. Todo + Task + DAG 可以成为可扩展的调度真相源

这也是我在 #273 里定义 Epic 的原因。

---

## 2. 理想方案为什么是 DAG

当时心里那个“killer feature”很明确：

> 自动派发 -> 自动执行（并发） -> 回传结果 -> 更新 Todo

我希望系统天然具备：

- 优先级
- 依赖关系
- blocked 状态
- 重试与恢复

听起来很对，也确实有长期价值。  
问题是：**价值成立，不等于当前阶段适合落地。**

---

## 3. 我第一次意识到“DAG 太重了”

真正让我警醒的不是一个概念争论，而是持续的工程现实：

- 字段语义容易错位（模型、工具、Todo 协议交叉影响）
- 依赖状态迁移复杂（pending / blocked / in_progress / failed）
- 子代理偶发“没真正启动”但表面看起来像跑过
- 重试和回写逻辑很难在复杂链路里保持可解释

最关键的是：牵一发而动全身。  
当你在一个未完全稳定的主链路上叠加 DAG 调度，调试成本会急剧上升。

---

## 4. 促成转向的判断：稳定优先，不是酷优先

我后来和团队讨论时，最打动我的一句话是：

> 先做好单循环，再考虑其他。

这句话背后其实是完整的风险判断：

- 工作区隔离还不完整
- 并发读写冲突风险真实存在
- Git 还没完全成为主链路基础设施
- Todo 强约束还在完善
- 子代理执行过程可观测性还不够

所以我们决定先收敛主路径。  
这是从“功能野心驱动”切到“交付稳定驱动”。

---

## 5. inline subagent 的真实执行链路

很多人会误解成：Todo 写了 `executor=subagent` 就会自动派发。  
我们后来的设计不是这样。

`spawn_subagent(mode=inline)` 是显式工具调用，链路大致是：

```text
模型决定需要子代理
-> 调用 spawn_subagent
-> 工具层参数校验/schema 校验
-> 构造 SubAgentRunInput
-> ToolCallInput.SubAgentInvoker 调 runtime
-> runtimeSubAgentInvoker.Run(...)
-> resolveInlineSubAgentCapability(...)
-> RunSubAgentTask(...)
-> 返回 SubAgentRunResult
-> 渲染 ToolResult
-> 主代理继续下一轮推理
```

核心原则：  
**子代理不是绕开 runtime 单独跑，而是 runtime 内的受控执行。**

---

## 6. 上下文隔离和回灌防污染，我做了什么

我最后很在意的一点是：不能让 subagent 变成“上下文污染放大器”。

### 6.1 输入约束

对 prompt、arguments、allowed_tools、allowed_paths 做大小和数量限制，避免偷渡大段上下文。

### 6.2 输出结构化

不是把子代理完整聊天记录回灌，而是固定结构输出，例如：

- mode / task_id / role / state / stop_reason
- summary / report / findings / artifacts
- error / logs

### 6.3 输出限长

结果会走统一 output limit，防止大输出直接冲垮主上下文窗口。

### 6.4 错误分类

失败会结构化分类，而不是一段模糊报错：

- `subagent_permission_denied`
- `subagent_budget_exceeded`
- `subagent_contract_violation`
- `subagent_timeout`
- `subagent_canceled`
- `subagent_failed`

---

## 7. 一个很坑但很常见的问题：HTML 错误污染

这个坑非常典型：上游异常不一定给你 JSON，可能是整页 HTML。

如果原样回灌，常见副作用是：

1. 模型误把 HTML 当任务内容继续推理
2. 用户看到巨量不可读噪声
3. acceptance/decider 难以稳定识别错误语义

我的处理方式是归一化：

```text
HTML / 非 JSON 错误
-> 提取 status / title / 摘要
-> 归一为 error_class + message
-> 原始 body 截断或仅进入 debug
```

本质上是把“页面噪声”变成“可消费信号”。

---

## 8. 安全边界：子代理权限绝不能高于父代理

我最坚持的一条约束是：

> 子代理权限 <= 父代理权限

代码策略是做交集收敛：

```text
final_tools = parent_tools ∩ requested_tools
final_paths = parent_paths ∩ requested_paths
```

如果请求超边界，直接拒绝，不做隐式放行。

这件事看似基础，但对多代理系统是生死线。  
没有这条线，subagent 很容易成为绕过权限系统的后门。

---

## 9. 这次最大的工程教训

我这次最深的反思不是“DAG 不好”，而是：

1. **不要一人拍板复杂架构**
2. **不要盲从 AI 给出的“可行方案”**
3. **先确认业务问题，再设计系统形式**

很多时候我们会过早讨论状态机、流程图、模块边界，  
却没先回答：

- 现在到底要解决什么问题？
- 当前阶段不做什么？
- 最小可交付闭环是什么？

对于 coding agent，我现在更认同这个优先级：

1. file read / write / edit
2. bash
3. Git
4. 基础判定与验证工具

这些主链路能力没打稳前，过早追求复杂编排，往往性价比很低。

---

## 10. 技术债还在，但方向更清晰

现在的 inline subagent 能力已经可用，但还不是完整并发系统。  
它更像“受限 worker 调用”，而不是“全功能调度平台”。

后续如果要平滑升级回可控并发，我会走这条路：

1. 保留 inline，先补全任务记录与审计字段
2. 引入 bounded queue（先 `max_concurrent=1/2`，不是任意并发）
3. 再逐步加取消传播、进度聚合、结果合并、冲突检测

也就是说，不是“放弃并发”，而是“分阶段拿回并发”。

---

## 结语

这次 SubAgent 的路线变化，表面看是从 DAG 回退到顺序执行。  
但在我看来，这是一次更成熟的工程前进：

- 从追求炫技，转向追求稳定闭环
- 从隐式语义，转向显式工具调用
- 从大而全设计，转向可验证的小步迭代

我希望你看完能带走一句话：

> **先在脑子里跑通工程，再在代码里跑通系统；复杂架构要靠协作共识，而不是一人拍板。**

