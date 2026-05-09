---
title: 从终端工具到 Agent 工程底座：NeoCode 的架构演进复盘
titleLines:
  - 从终端工具到 Agent 工程底座：
  - NeoCode 的架构演进复盘
summary: 好的架构做减法，功能做乘法。是我在项目中对 Agent 架构的理解：如何通过 Gateway、Runtime、Tools、Provider、Skills、Hooks、HITL 和 SubAgent，把一个 AI 编码工具从“功能能跑”推进到“边界清楚、状态可控、能力可扩展”。
publishedAt: 2026-05-10
tags:
  - NeoCode
  - Agent
  - Architecture
  - Gateway
  - Engineering
featured: true
featuredOrder: 0
---

刚开始做 NeoCode 时，我更关心的是功能能不能跑起来。

我在一开始，只是手搓了一个http的对话流 ，我以为在对话流上面加工具，加限制就是一个Agent。

当然后面我也了解到我错的彻底，这撑死只能算是一次API调用。Agent远不止这些，他是一套集合系统。

能不能对话？能不能读文件？能不能调用工具？能不能让 AI 修改代码？能不能把任务拆成 Todo？能不能接飞书？能不能做 SubAgent？能不能有桌面端和 Web 端？

这些问题都很直接，也很容易推动项目往前走。但项目越往后，我越发现，真正困难的不是“再加一个功能”，而是“加完之后系统还能不能解释、维护和继续演进”。

一个功能自己跑通并不难。难的是，当 TUI、Web、Desktop、Feishu、Runner 都想接入同一套 Agent 能力时，系统还能不能保持统一入口；当 OpenAI、Gemini、DeepSeek、Qwen、本地模型都可能接入时，模型差异会不会污染 Runtime；当 Tools、MCP、Skills、Hooks、SubAgent、Human-in-the-Loop 都进入系统时，主链路会不会变成一团不断膨胀的逻辑。

这也是我后来重新理解 Agent 架构的起点：

> 架构不是模块图，而是一组约束。它回答的不是“系统里有什么”，而是“什么可以进来，什么不能进来；谁能调用谁，谁不能绕过谁；状态放在哪里，入口收敛在哪里，变化被关在哪里”。

这篇文章不是想复述 NeoCode 的架构文档，而是记录我在参与 NeoCode 的过程中，对 Agent 架构的一次复盘。

我不是 NeoCode 的“架构师”。这个项目的架构是团队一起讨论、实现和调整出来的。但我在这个过程中承担了一个角色：不断把功能想法写成 Issue，把模糊需求拆成边界，把 AI 给出的方案拉回工程约束，再把这些思考沉淀成文档、博客和表达。

所以这篇文章更像是我的个人架构复盘：我如何从参与 NeoCode 的 Gateway、Hooks、SubAgent、Skills、HITL、Tools、安全边界和 Acceptance 链路中，理解一个 Code Agent 要从“能跑”走向“可演进”，到底需要哪些边界。

## 从功能能跑，到系统能演进

最开始看一个 Agent 项目，很容易把注意力放在模型能力上：模型够不够强，代码写得够不够快，能不能直接改文件，能不能执行命令。

但真正做起来以后，我越来越觉得，Agent 系统的核心不是模型，而是模型周围的工程控制层。

模型只是生成下一步动作的部分。一个真正可用的 Code Agent，还必须回答很多工程问题：用户从哪里进入系统？模型如何拿到上下文？工具能力从哪里暴露？权限在哪里判断？执行结果如何回灌？状态如何保存和恢复？失败如何可解释？人在什么时候参与判断？系统如何知道任务真的完成？

这些问题里，任何一个没有收敛，都会让 Agent 从“智能”变成“不可控”。

我以前会更直觉地追问“能不能做这个功能”。后来我开始更多追问：

> 这个功能应该放在哪一层？它会不会绕过原来的边界？它的状态谁维护？它的失败谁负责解释？它是否应该进入当前阶段？

这就是我对架构的第一个变化：从关注“功能能跑”，转向关注“系统能演进”。

## 架构不是模块图，而是“做什么 / 不做什么”

我以前容易把架构理解成模块图：这里是 Runtime，那里是 Tools，这里是 Provider，那里是 Gateway。画出来以后，看起来就像有架构了。

但后来我发现，模块图只是结果。真正重要的是约束。

NeoCode 里有很多这样的“不能做”：Feishu Adapter 不直接调用 Runtime；Web / Desktop / TUI 不各自实现一套 Agent 主链路；Gateway 不塞端侧特化逻辑；Runtime 不直接写具体工具实现；Provider 的厂商差异不泄漏到 Runtime；Tool 能力必须经过统一 schema、permission 和 sandbox；Skill 只提供任务经验，不授予额外工具权限；Hooks 不能变成第二套 Runtime；SubAgent 不能绕过 ToolManager、Permission 和 Workspace Sandbox；用户配置不能静默执行任意 command / http / prompt / agent hook。

这些“不做什么”，反而比“做了什么”更能说明架构。

因为一个 Agent 项目最容易失控的方式，就是每个新功能都直接找最短路径接进去。飞书想接入，就直接调 Runtime；桌面端想接入，就复制一套请求逻辑；SubAgent 想用工具，就绕过主链路；Hooks 想扩展，就开放任意命令执行。短期看这都能跑，但长期看系统会失去统一边界。

所以我现在更愿意这样理解架构：

> 架构不是把功能堆起来，而是决定变化应该被关在哪里。

## 强边界单体：本地 Agent 不一定需要微服务

NeoCode 是一个本地优先的 Agent。它首先运行在用户自己的机器上，要读本地项目、执行本地命令、维护本地会话，也要尽可能降低启动和部署成本。

这就决定了它不适合一上来拆成复杂微服务。

如果为了“架构看起来高级”，把 Gateway、Runtime、Provider、Tools、Session 都拆成独立服务，本地部署成本会非常高。一个个人开发者不会为了启动一个 Coding Agent，在自己电脑上跑一组复杂服务。

但另一方面，如果所有逻辑都堆在一个纯单体里，Provider、Tools、Runtime、Gateway 混在一起，后面新增模型、新增入口、新增工具、新增 UI 时，就会互相污染。

所以我越来越认同 NeoCode 采用的“强边界单体”思路：

> 部署上保持简单，内部通过清晰接口维持边界。

这让我第一次比较明确地理解到：架构不是越分布式越高级。对一个本地运行、单用户优先、强调低部署成本的 Agent 来说，一个边界清晰的单体，比一组微服务更合理。

这个取舍对我影响很大。因为它不是在追一种“标准答案”，而是在根据项目约束做选择。

## Gateway：从 CLI 工具到 Agent 万能插座

在我看来，Gateway 是 NeoCode 从一个终端工具走向 Agent 工程底座的关键转折点。

如果没有 Gateway，TUI、Web、Desktop、Feishu、Runner 都可能各自找 Runtime 接口，各自处理事件流、权限、状态和错误。短期看，这样做可能更快；长期看，每个入口都会长出自己的逻辑，系统就会变成多套半重复实现。

Gateway 的意义，不只是“多一个接口层”。

它更像是 NeoCode 的“万能插座”：不同入口可以用不同外形接进来，但背后复用的是同一套 Runtime、Tools、Session、权限和事件流。

我在飞书接入和 Runner 相关的 Issue / PR 里对这一点感受很明显。飞书 Adapter 不应该直接调用 Runtime，也不应该把飞书逻辑塞进 Gateway 内部。它应该作为 Gateway 的外部 Client，走统一的 `authenticate -> bindStream -> run -> gateway.event` 链路。

这样做的价值是：飞书只是一个入口，不是第二套 Agent。

后来 SDK 长连接、本机 Runner、飞书审批卡片、ask_user 多端交互都在往同一个方向收敛：外部入口可以越来越多，但它们都应该复用 Gateway 这个统一控制面，而不是绕开它。

所以我觉得 Gateway 是 NeoCode 的产品架构转折点：

> 多入口架构的关键，不是做更多 UI，而是让更多入口复用同一套稳定能力。（海神的想法）

## Runtime：Agent 架构的核心不是模型，而是循环

如果 Gateway 是入口，那么 Runtime 就是 Agent 真正推进任务的地方。

我以前会更关注模型：哪个模型更强，哪个模型工具调用更稳定，哪个模型上下文更长。但做 NeoCode 后，我越来越觉得，Agent 系统真正的核心不是模型，而是 Runtime Loop。

Runtime 要做的不是简单地“把用户输入发给模型”。它需要不断完成一组循环：

```text
构建上下文
-> 调用 Provider
-> 解析模型输出
-> 执行工具
-> 回灌工具结果
-> 更新状态
-> 判断是否继续
-> 判断是否完成
```

这条循环中，任何一步都可能产生工程问题。

上下文过大，模型会迷失。工具执行失败，必须能回灌错误。权限被拒绝，不能崩溃。模型说“完成了”，Runtime 不能盲信。用户需要确认，系统要能暂停和恢复。客户端断线，状态要能从 snapshot 恢复。

所以我现在更愿意把 Runtime 看成 Agent 的“控制循环”，而不是一个调用模型的函数。

这也是为什么 Hooks、Verification、Acceptance、ask_user、SubAgent 都不能随便绕过 Runtime。它们不是孤立功能，而是围绕这条循环建立的控制层。

## Tools：Agent 接触真实世界的手，必须统一入口

Tool 是 Agent 接触真实世界的手。

它能读文件、写文件、执行命令、查 Git 状态、操作 Todo、调用 MCP、启动 SubAgent，甚至在未来通过 Runner 分发到另一台机器执行。

也正因为工具能力这么强，Tool 的入口必须收敛。

如果 Runtime 可以直接写文件，TUI 也可以直接跑命令，某个外部 Adapter 又偷偷实现了一套工具调用，那系统就很难审计：到底是谁改了文件？权限在哪里判断？失败在哪里记录？哪些操作应该阻断？

所以我在参与 Todo、SubAgent、Runner、ask_user、Verification 这些链路时，越来越能理解 ToolManager 的意义：

> 模型能调用什么能力，不应该散落在各层，而应该统一进入 Tools / ToolManager，再经过权限、安全策略和结果回灌。

Todo 是一个很好的例子。

Todo 一开始看起来像普通任务清单，但在 NeoCode 里，它更像 Agent 的任务状态真相源。它要支持 plan、add、update、claim、complete、fail，要处理 revision 冲突，要进入上下文注入，也要服务后续 SubAgent 调度。

所以 Todo 不能只是 UI 上的一个列表，也不能由 Runtime 私自改状态。它必须作为内置工具接入主链路：

```text
Runtime -> ToolManager -> Todo Tool -> Session State -> Context Injection
```

这条路径看似绕了一点，但它让 Todo 的状态变化变得可观察、可测试、可回放，也能避免 UI 或 Runtime 各存一份副本。

同样，SubAgent 的工具调用也不能绕过主链路。子代理即使是“子代理”，也必须经过 ToolManager、Permission 和 Sandbox。否则它只是把风险从主 Agent 转移到了另一个不受控入口。

我参与这些链路之后，对 Tool 的理解变得更清楚：

> Tool 不是能力清单，而是 Agent 与真实世界之间的受控边界。

## 安全层：不是最后加的限制，而是架构的一部分

一开始我会把安全理解成“最后加限制”：危险命令要审批，高风险操作要拦截，敏感信息不要泄露。

但在 NeoCode 里，安全不是最后补上的功能，而是架构边界的一部分。

比如飞书接入里，Adapter 不能直接侵入 Runtime；SDK 长连接模式不要求暴露本机公网端口；Runner 通过主动出站连接接 Gateway，而不是把本机端口暴露到公网；工具分发要带 CapabilityToken、TTL、AllowedTools、AllowedPaths；Hooks 里 repo hook 默认不执行，必须经过 workspace trust gate；external command/http/prompt/agent hooks 不能在 P6-lite 里直接开放。

这些设计背后其实是同一个原则：

> AI 能力越强，默认边界越要收紧。

因为 Code Agent 不是普通聊天机器人。它会读写文件、运行命令、改代码、操作本地工作区。只要入口不清楚，风险就会被放大。

我在相关 Issue / PR 里参与最多的，不一定是写每一行安全代码，而是反复把“做什么 / 不做什么”写清楚：哪些是当前阶段必须做的，哪些必须暂缓，哪些不能绕过 Gateway，哪些不能绕过 ToolManager，哪些必须保留审批、幂等、超时、错误回传和可观测性。

这让我理解到，安全不是产品体验的对立面。对 Agent 来说，安全边界本身就是可用性的一部分。没有边界的自动化，用户反而不敢放心使用。

## Provider：模型会变，所以模型不能污染 Runtime

Agent 项目里，模型一定会变。

今天可能用 OpenAI，明天可能用 Gemini、DeepSeek、Qwen，后天可能要接本地模型。不同模型的流式格式、工具调用格式、错误结构、上下文字段都可能不一样。

如果这些差异泄漏到 Runtime，后面系统就会越来越难维护。

所以 Provider 层的意义，就是把模型厂商差异关在适配器里。Runtime 不应该关心背后是哪家模型，它只应该面对统一的生成接口、工具调用结构和事件流。

这也是架构边界的典型价值：

> 边界不是为了让代码看起来漂亮，而是为了防止变化扩散。

Provider 会变，入口会变，工具会变，UI 会变。架构要做的事情，就是让这些变化尽量不要互相污染。

## Skills、MCP、Hooks：Agent 不是一个模型，而是一组控制层

当 Runtime、Tools、Provider 这些主链路逐渐稳定后，NeoCode 还需要解决另一个问题：

> Agent 怎么变得可控、可复用、可演进？

这里就出现了 Skills、MCP、Hooks 这些能力。

MCP 更像外部工具生态的接入方式，让 Agent 可以连接更多外部能力；Skills 更像任务经验的沉淀，把某类任务怎么做写成可复用的 SOP；Hooks 则是 Runtime 生命周期上的控制点，让系统或用户可以在固定节点观察、提醒、阻断或补充上下文。

我在 Skills 里参与过项目级 Skills 的方向：让项目可以在 `.neocode/skills` 里沉淀自己的工作流，并通过 project > global 的优先级合并，解决团队协作时“每个人全局配置不一致”的问题。

这个点让我理解到，Skill 不应该是“另一个工具权限入口”。Skill 不授予工具权限，它只是告诉 Agent 某类任务应该怎么做。真正能读写文件、执行命令的能力，仍然必须走 Tools 和权限链路。

Hooks 给我的启发更强。Runtime Hooks 的分阶段落地，让我第一次比较完整地理解“运行时控制面”的价值。

P0 先做 Hook Core；P1 接入 `before_tool_call / after_tool_result / before_completion_decision`；P2/P3 区分 user hooks 和 repo hooks；P4 扩展生命周期点和能力矩阵；P5 做 async/async_rewake；P6-lite 暂缓 external hooks，只开放安全 builtin handlers；P7 再把 Acceptance / Verification 收敛进 internal hook 主链。

这个顺序本身就是架构思考：

> 不是什么都一次性开放，而是先建立可测试的核心，再逐步扩大能力边界。

尤其 P6-lite 对我影响很大。它没有急着开放 command/http/prompt/agent external hooks，而是先让用户通过 builtin hook 做受控配置。因为 external hooks 会带来命令沙箱、HTTP allowlist、环境变量泄露、prompt/agent 预算、循环保护、repo trust 联动等一系列问题。

这让我更加理解“做什么 / 不做什么”的重要性。

很多时候，架构能力不是“我们能不能做”，而是“现在应不应该做”。

## HITL 与 ask_user：人不是审批按钮，而是反馈回路

我刚写过一篇 Human-in-the-Loop 的文章。那篇文章里我想表达的核心不是“人类点一个确认按钮”，而是：

> 人必须参与目标定义、架构取舍、证据校验和完成判断。

在 NeoCode 里，ask_user 这条线让我从产品层面进一步理解了这个问题。

如果模型只能用自然语言追问用户，系统就很难形成稳定分支：模型问法不可控，用户回答格式不可控，多端展示不一致，Runtime 也很难知道当前 run 是否真的在等用户。

所以 ask_user 的价值，不只是“让 AI 问用户一个问题”。它更像是把用户输入变成 Runtime 控制面的一部分：

```text
Runtime ask_user
-> Gateway event
-> 客户端卡片交互
-> gateway.userQuestionAnswer
-> Runtime 注入 tool_result
-> 推理继续
```

这条链路里，用户不是站在旁边随便回复一句话，而是进入了 Agent 的执行状态机。

这个方向也和我对 HITL 的理解一致：人不是每一步都要介入的审批者，而是 Agent 系统不失控的反馈回路。尤其在目标不清、风险较高、分支需要选择、完成需要验收的时候，人必须回到循环里。

## Verification / Acceptance：Agent 不能自己宣布完成

NeoCode 里另一条让我收获很大的线，是 Verification / Acceptance。

我以前也容易被模型的“已完成”影响。它说已经修好了、已经实现了、已经跑通了，我就倾向于相信。

但做 Runtime 以后会发现，Agent 不能靠自然语言宣布完成。

真正的完成必须基于事实：Todo 是否收敛？文件是否真的写入？写入后是否验证？测试是否执行成功？工具结果是否是错误？SubAgent 是否完成？final 是否只是模型自我总结？如果缺少事实，下一步该执行什么工具？

我参与过的 verification continue 循环问题，就是一个典型例子：任务已经执行验证，但后续 `todo_write` 又被误归类为 workspace write，导致 completion gate 继续判定 `unverified_write`，系统反复拦截模型 final，进入空转。

这个问题表面上是一个 bug，实际上暴露的是 Agent 架构里的核心问题：

> Runtime 不能只看模型说了什么，而要基于 tool facts、verification facts、decision snapshot 判断是否完成。

所以后来我们把这个问题收敛成一条端到端验收链路：

```text
tools -> runtime facts -> final decider -> runtime events -> gateway / TUI display
```

这条链路让我意识到，Acceptance 不是最后一句“看起来完成了”，而是系统对证据的聚合判断。

---

## 从 DAG 到 inline SubAgent：我对架构取舍的转折

我个人最大的架构认知转折，是 SubAgent / DAG 这条线。

一开始我也被 DAG、Scheduler、多 Worker、Coordinator 这些词吸引过。它们看起来更像一个完整的 Agent 系统，也更像“高级架构”。

当时的想法很自然：复杂任务可以拆成 Todo DAG，多个 SubAgent 并发执行，最后汇总结果。这个方向并不是错的，从长期看也确实有价值。

但真正落地时，我很快发现问题：当单 Agent 主链路、工具执行、权限边界、状态回灌、可观测性和验收闭环都还没稳定时，复杂调度只会放大不确定性。

DAG 里的状态太多了。Task 有状态，依赖有状态，Worker 有状态，SubAgent 有状态，Tool Call 有状态，Result Merge 有状态，Retry / Cancel 也有状态。每个状态看起来都有道理，但组合起来以后，我自己都很难解释系统到底处在哪个阶段。

后来我们把方向收敛为顺序 Todo + inline SubAgent：先让主 Agent 按 Todo 顺序推进，在当前 Todo 需要时显式调用一个 inline subagent；SubAgent 的结果即时回灌主 Agent，工具调用仍走 ToolManager、Permission 和 Sandbox。

这不是放弃架构，而是一次架构收敛：

> 先做一个可解释、可验证、可维护的闭环，再谈更复杂的自动化。

这件事也改变了我对“高级架构”的理解。高级不是模块名字高级，而是系统在当前阶段能不能被人理解、测试和维护。

## 我在这个架构里的位置

回头看 NeoCode 的开发过程，我参与最多的不是单一 UI 或单一工具，而是几条横跨模块的链路。

Gateway / Feishu / Runner 让我理解多入口不应该绕过 Runtime，而应该通过统一控制面进入系统。

Runtime Hooks 让我理解 Agent 主循环不应该无限堆逻辑，而应该通过生命周期扩展点治理变化。

SubAgent 从 DAG 到 inline 的收敛，让我理解复杂编排不能早于最小闭环。

Todo / ToolManager / MCP 安全链路让我理解，Agent 的任务状态和工具执行必须走统一入口，不能在 UI、Runtime、SubAgent 里各自存一份“私有真相”。

Skills 让我理解，任务经验可以沉淀，但不能绕过权限系统；Skill 是手册，不是手。

Verification / Acceptance 让我意识到，Agent 不能靠自然语言宣布完成，而要基于事实、测试和结构化决策收敛。

文档、README、推文和博客则让我学会把这些边界表达成别人能理解、能讨论、能验收的材料。

所以我觉得，架构贡献不只发生在写核心代码的时候，也发生在定义边界、拆分 Issue、提出取舍、补充验收标准和让团队形成共同语言的过程中。

我不是代码架构层的主作者，但我确实在这个过程中越来越清楚地理解并参与维护了 NeoCode 的架构。

## 我从 NeoCode 学到的 Agent 架构原则

通过 NeoCode，我对 Agent 架构形成了几个比较明确的认识。

第一，Agent 的核心不是模型，而是 Runtime Loop。模型负责生成下一步动作，但 Runtime 负责让动作进入可控循环。

第二，多入口的关键不是多个 UI，而是统一 Gateway。TUI、Web、Desktop、Feishu、Runner 都应该接入同一套能力，而不是各自实现一套 Agent。

第三，工具能力越强，越需要统一入口和权限边界。ToolManager、Permission、Sandbox、CapabilityToken 不是附属功能，而是 Agent 能安全接触真实世界的前提。

第四，架构不是功能越多越好，而是状态、边界、证据能不能被人理解。DAG、Scheduler、多 Worker 这些能力可以是未来方向，但不能早于最小可验证闭环。

第五，Skills、Hooks、MCP、HITL、SubAgent 都不是孤立功能，而是围绕 Runtime 建立的控制层。它们的价值不是让系统看起来复杂，而是让 Agent 更可控、更可复用、更可演进。

第六，AI 可以帮我们写代码，但架构取舍必须由人参与。人不是每一步都要介入的审批者，而是系统不失控的反馈回路。

## 总结：架构是把自动化放进可验证的边界里

做 NeoCode 以前，我对 Agent 的想象更偏功能：让 AI 多做一点，让它能读文件、写代码、跑命令、拆任务、调工具。

做 NeoCode 以后，我对 Agent 的理解变得更偏架构：让这些能力在正确的边界里发生。

入口要统一，能力要收敛，状态要可解释，工具要受控，完成要有证据，人在关键节点要参与判断。

所以我现在觉得，一个 Code Agent 从“能跑”走向“可演进”，关键不是把 AI 能力无限堆上去，而是把变化关进边界，把状态收敛到人能理解，把自动化放进可验证的闭环。

这也是我从 NeoCode 里学到的最重要的架构经验：

> AI 可以帮我写得更快，但架构决定了系统能不能走得更远。

## 相关记录

- Gateway / Feishu / Runner：[#553](https://github.com/1024XEngineer/neo-code/issues/553)、[#561](https://github.com/1024XEngineer/neo-code/pull/561)、[#570](https://github.com/1024XEngineer/neo-code/pull/570)
- Runtime Hooks：[#487](https://github.com/1024XEngineer/neo-code/issues/487)、[#551](https://github.com/1024XEngineer/neo-code/pull/551)
- Todo / SubAgent：[#262](https://github.com/1024XEngineer/neo-code/issues/262)、[#364](https://github.com/1024XEngineer/neo-code/issues/364)
- Verification / Acceptance：[#467](https://github.com/1024XEngineer/neo-code/issues/467)、[#540](https://github.com/1024XEngineer/neo-code/pull/540)、[#546](https://github.com/1024XEngineer/neo-code/pull/546)
- Skills：[#480](https://github.com/1024XEngineer/neo-code/pull/480)
- ask_user / HITL：[#577](https://github.com/1024XEngineer/neo-code/issues/577)、[#585](https://github.com/1024XEngineer/neo-code/pull/585)
