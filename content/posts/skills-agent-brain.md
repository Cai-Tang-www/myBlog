```
title：Skill--agent的技能系统
summary：好的架构做减法，功能做乘法。--许世伟
publishedAt：2026-4-17
tags：
  - vibCoding
  - Skills
  - feat
```

关于 Skills ，我认为它其实就是Agent的技能/插件系统。

##  Harness

在谈到Skills之前，我想先提到Harness，之前一直很火的一个概念，名为驭术。

关于Harness更具体的可以看这篇文章：[Codex中的工程技术](https://openai.com/zh-Hans-CN/index/harness-engineering/)

它们之间的关系是

```Harness = 任务运行/验证外壳
Harness = 任务运行/验证外壳
Skill = Agent 执行任务时使用的能力提示包
```

更直白点说，Harness 在组织一次任务运行/测试/评测时，可以把某些 Skill 作为运行条件的一部分加载进去。

Skill存在于Agent之中，在需要时被调用/启用。

## 技能系统

Claude Code的技能系统是一个多层次的扩展机制。它允许用户通过 Markdown 文件定义可复用的 prompt 模板，也允许开发者通过 TypeScript 代码注册编译时内置的技能。整个系统的设计目标是：**零配置可用，自定义配置强大**。

- ## 一、为什么需要 Skill

  ### 1. 最开始为什么会觉得 code agent 需要 Skill？

  最开始的原因很简单：我发现模型“会用工具”和“会稳定完成某类任务”之间还有很大距离。

  比如同样是代码 Review，模型可能会读文件、会 grep、会跑测试，但它不一定知道 Review 的重点是什么：是看架构边界？安全问题？错误处理？并发风险？还是 API 兼容性？

  如果每次都靠用户在 prompt 里重新解释：

  ```
  你要先看模块边界，再看错误处理，再看安全风险，最后按 P0/P1/P2 输出。
  ```

  这会很重复，也不稳定。

  所以我觉得 code agent 需要 Skill，本质上是为了把某类任务的经验沉淀下来。它不是给模型新增工具，而是告诉模型：**当你做这类任务时，应该按什么方法、什么约束、什么输出格式来做。**

  ------

  ### 2. Agent “会调用工具”和“会完成任务”之间差了什么？

  差的是任务策略。

  会调用工具只是底层能力，比如：

  ```
  read_file
  grep
  bash
  edit_file
  webfetch
  ```

  但会完成任务，需要模型知道：

  ```
  什么时候该读文件？
  先读哪个文件？
  读完如何判断问题？
  什么时候应该停止？
  结果应该怎么组织？
  哪些动作不能做？
  ```

  所以 Skill 想补的不是单纯知识，也不只是 prompt，而是：

  ```
  知识 + 流程 + 约束 + 经验 + 输出规范
  ```

  比如 Go Review Skill 不只是告诉模型“你是 Go 专家”，而是告诉它：

  ```
  先看包边界
  再看错误处理
  再看并发和资源释放
  再看测试覆盖
  最后按 severity 输出 findings
  ```

  这才是 Skill 的价值。

  ------

  ### 3. Skill 希望解决的核心问题是什么？

  我希望 Skill 解决四个问题。

  第一，**减少重复提示词**。
   很多任务的要求是固定的，不应该每次都让用户重新写一遍。

  第二，**复用任务经验**。
   比如 Review、Debug、Issue 写作、RFC 写作、竞赛方案、政审表填写，这些任务都有可复用方法。

  第三，**提高工具使用质量**。
   Skill 可以告诉模型某类任务应该优先用哪些工具、少用哪些工具、什么情况下不要贸然执行。

  第四，**规范输出**。
   尤其是工程协作场景，输出格式比“灵感”更重要。比如 issue 要有背景、问题、目标、非目标、验收标准；review 要有 severity、证据、建议。

  ------

  ## 二、Skill 到底是什么

  ### 4. 一句话定义 Skill

  我会这样定义：

  > Skill 是 Agent 在特定任务场景下可激活的能力提示包，用来提供任务 SOP、约束、参考和输出规范。

  更短一点：

  > Skill 是 Agent 的任务能力提示层。

  它不是插件本身，也不是工具本身，而是一种**结构化、可复用、可管理的任务提示能力**。

  ------

  ### 5. Skill 在 NeoCode 里更像什么？

  在 NeoCode 里，我觉得 Skill 更像：

  ```
  任务 SOP + 上下文增强模块 + 专家经验包
  ```

  它不应该直接等同于插件。因为插件通常意味着能注册新能力、执行代码、改变系统行为；但 Skill 的第一定位应该是影响模型上下文，而不是改 runtime。

  也不只是专家角色。
   “你是资深 Go 工程师”这种角色设定太虚。Skill 应该更偏 SOP：

  ```
  你要如何分析？
  先看什么？
  不要做什么？
  输出什么格式？
  遇到信息不足怎么处理？
  ```

  所以我会说：**Skill 是可激活的任务 SOP，而不是简单角色扮演。**

  ------

  ### 6. Skill 和普通 prompt 最大区别是什么？

  普通 prompt 是一次性的，Skill 是可管理的。

  区别主要有几个：

  ```
  1. Skill 有 metadata，可以被发现、索引、启用、禁用；
  2. Skill 是可复用的，不是一次性输入；
  3. Skill 是结构化的，可以包含 instruction、references、examples、tool_hints；
  4. Skill 可以会话级激活，而不是每轮手动复制；
  5. Skill 可以被 runtime 注入，而不是靠用户记得粘贴。
  ```

  普通 prompt 更像临时口头要求；Skill 更像团队沉淀下来的任务手册。

  ------

  ## 三、Skill 和 Tool / Harness / Hook 的边界

  ### 7. Skill 和 Tool 的区别是什么？

  Tool 是动作能力，Skill 是使用能力的方法。

  比如：

  ```
  Tool：read_file，可以读文件
  Skill：做 Go Review 时，应该先读 go.mod，再读核心 package，再看错误处理
  ```

  Tool 负责“能做什么”，Skill 负责“怎么做得更好”。

  Skill 不应该直接执行动作。
   它可以建议模型优先使用某些工具，但不能自己绕过 runtime 去执行，也不能改变权限。

  一句话：

  ```
  Tool 是手，Skill 是手册。
  ```

  ------

  ### 8. Skill 和 Harness 的关系是什么？

  我会这样说：

  > Harness 是任务运行和验证外壳，Skill 是 Harness 或 Agent 在执行任务时可以加载的能力提示包。

  Harness 更偏外部组织：

  ```
  准备任务
  设置运行环境
  注入测试
  验证结果
  评测 agent
  ```

  Skill 更偏 agent 内部能力：

  ```
  任务策略
  操作流程
  输出规范
  工具使用建议
  ```

  所以关系可以是：

  ```
  Harness 组织一次任务运行；
  Skill 作为运行条件之一被加载；
  Agent 在该 Skill 指导下执行任务。
  ```

  比如做一个 Go 项目修复 Harness，它可以要求加载：

  ```
  go-debugging skill
  go-test skill
  issue-writing skill
  ```

  ------

  ### 9. Skill 和 Hook 的区别是什么？

  Hook 是生命周期扩展点，Skill 是模型上下文策略。

  Hook 运行在 runtime 生命周期里，比如：

  ```
  before_tool_call
  after_tool_result
  before_completion_decision
  ```

  它可以观察、阻断、补充事件、生成通知。

  Skill 不在生命周期里执行，它只是被注入到模型上下文，影响模型行为。

  二者可以配合：

  ```
  Skill 告诉模型：做安全 review 时要关注敏感文件；
  Hook 在 before_tool_call 阶段阻止模型访问超出范围的文件。
  ```

  也就是说：

  ```
  Skill 是软约束；
  Hook 是运行时硬边界或扩展点。
  ```

  ------

  ### 10. Skill 不应该做什么？

  Skill 不应该做这些事：

  ```
  1. 不应该绕过权限；
  2. 不应该注册真实工具；
  3. 不应该替代 verifier；
  4. 不应该改变 runtime 终态；
  5. 不应该隐藏执行逻辑；
  6. 不应该成为“提示词里的后门”；
  7. 不应该让模型以为自己拥有未暴露的能力。
  ```

  尤其要注意：Skill 不能说“你可以直接修改任意文件”这种话。真正能不能修改文件，要由工具暴露和 permission 决定。

  Skill 只能影响模型选择，不应该改变系统权限。

  ------

  ## 四、Skill 文件应该怎么设计

  ### 11. `SKILL.md` 最重要的字段有哪些？

  我觉得 metadata 里至少要有：

  ```
  id: go-review
  name: Go Review
  description: Review Go code for correctness, safety and maintainability.
  version: 1.0.0
  scope: user
  source: ~/.neocode/skills/go-review/SKILL.md
  tool_hints:
    prefer:
      - filesystem_read_file
      - grep
      - bash
    avoid:
      - filesystem_write_file
  ```

  核心字段是：

  ```
  id：唯一标识
  name：人类可读名称
  description：什么时候该用
  version：版本
  scope：user / project / builtin
  source：来源
  tool_hints：工具使用建议
  ```

  后续还可以有：

  ```
  tags
  activation_keywords
  risk_level
  compatible_modes
  ```

  但第一版不需要太复杂。

  ------

  ### 12. 正文应该包含哪些 section？

  我建议正文分成这些：

  ```
  # Instruction
  这个 skill 的核心行为要求。
  
  # Workflow
  推荐步骤。
  
  # Constraints
  不能做什么。
  
  # Tool Hints
  建议优先使用哪些工具，避免哪些工具。
  
  # Output Format
  最终输出格式。
  
  # Examples
  好例子和坏例子。
  
  # References
  可选参考资料。
  ```

  其中最重要的是：

  ```
  Instruction
  Workflow
  Constraints
  Output Format
  ```

  因为 Skill 不是知识库文章，而是要指导模型执行任务。

  ------

  ### 13. Skill 应该写得像角色设定，还是任务 SOP？

  我更倾向任务 SOP。

  角色设定可以有，但不能只停留在角色设定。

  差的写法是：

  ```
  你是资深 Go Reviewer，请认真审查代码。
  ```

  好的写法是：

  ```
  执行 Go Review 时：
  1. 先确认模块边界和入口；
  2. 再检查错误处理、资源释放、并发安全；
  3. 对每个发现给出 severity、证据、影响和修复建议；
  4. 不要在没有证据时输出猜测。
  ```

  所以 Skill 应该是：

  ```
  少一点“你是谁”
  多一点“你怎么做”
  ```

  ------

  ## 五、Skill 加载引擎怎么做

  ### 14. Skill 应该从哪里加载？

  第一版我支持：

  ```
  ~/.neocode/skills/
  ~/.codex/skills/ fallback
  ```

  这适合用户个人配置。

  后续我觉得应该加项目级：

  ```
  .neocode/skills/
  .agents/skills/
  ```

  但项目级 Skill 要谨慎，因为它可能来自仓库，存在 prompt injection 风险。
   所以项目级 Skill 必须配合 trust workspace：

  ```
  未信任 workspace：不自动加载项目 skill
  已信任 workspace：允许加载
  ```

  加载顺序可以是：

  ```
  builtin
  user
  project trusted
  ```

  但优先级要定义清楚。

  ------

  ### 15. Loader / Registry / Filter 三层怎么理解？

  这三层边界是清楚的。

  ```
  Loader：负责从文件系统扫描、读取、解析 SKILL.md
  Registry：负责把解析后的 skill 放进内存索引
  Filter：负责按当前 session/workspace/source/scope 决定可见哪些 skill
  ```

  换句话说：

  ```
  Loader 关心“有什么”
  Registry 关心“怎么查”
  Filter 关心“当前能不能用”
  ```

  这样以后加项目级、远程 skill、builtin skill 都比较自然。

  ------

  ### 16. 加载失败怎么处理？

  我倾向于：**单个 Skill 失败不影响整体加载**。

  比如：

  ```
  metadata 无效
  内容为空
  文件过大
  id 冲突
  ```

  这些都应该记录成 `LoadIssue`，然后继续加载其他 Skill。

  但是 id 冲突要 fail-closed。
   因为如果两个 Skill 都叫 `go-review`，系统无法确定用户到底启用了哪个，继续加载会有安全和可预测性问题。

  所以规则是：

  ```
  普通解析失败：跳过该 skill，记录 LoadIssue；
  id 冲突：冲突项全部不可用；
  整体 registry 不因为单个 skill 崩溃。
  ```

  ------

  ## 六、Skill 怎么被使用

  ### 17. Skill 应该自动启用，还是用户手动启用？

  第一版我更支持手动启用：

  ```
  /skill use <id>
  /skill off <id>
  /skill active
  ```

  好处是可控。

  Skill 会影响模型上下文，如果自动启用太激进，用户可能不知道为什么模型突然按某个 SOP 做事。

  手动启用的优点：

  ```
  1. 用户明确知道当前激活了什么；
  2. 避免错误匹配；
  3. 便于 debug；
  4. 便于复现；
  5. 不会让项目级 skill 悄悄影响模型。
  ```

  后续可以做“推荐启用”，但不要一开始就强自动。

  ------

  ### 18. Skill 激活后如何影响模型？

  当前设计是 Runtime 在每轮 context 构建时注入一个 `Skills` section，包括：

  ```
  instruction
  tool_hints
  references
  examples
  ```

  这个方式优点是简单、可解释、provider 无关。

  缺点是：

  ```
  1. 会占用上下文；
  2. 多个 Skill 同时启用可能冲突；
  3. Skill 太长会污染 prompt；
  4. 模型可能过度服从 Skill，而忽略当前用户请求。
  ```

  所以需要限制：

  ```
  最大注入长度
  Skill 数量上限
  冲突检测
  优先级
  摘要注入
  ```

  我的倾向是：**Skill 激活后只注入必要部分，不要把整个 SKILL.md 原文全塞进去。**

  ------

  ### 19. `tool_hints` 应该有多大权力？

  `tool_hints` 只能是提示，不能改变权限。

  也就是说它可以做：

  ```
  优先展示 read_file
  提醒模型少用 bash
  建议先 grep 再读文件
  ```

  但不能做：

  ```
  新增工具
  绕过 permission
  暴露隐藏工具
  自动授权高危工具
  ```

  当前文档里写“只调整已暴露工具排序，不新增工具、不改变权限决策”，这个边界我认同。

  一句话：

  ```
  tool_hints 影响模型选择，不影响 runtime 权限。
  ```

  ------

  ## 七、Skill 的未来演进

  ### 20. 希望 Skill 后续怎么演进？

  我希望分阶段演进。

  第一阶段：**本地用户 Skill**。

  ```
  ~/.neocode/skills/
  手动启用
  注入上下文
  支持 tool_hints
  ```

  第二阶段：**项目级 Skill**。

  ```
  .neocode/skills/
  需要 workspace trust
  适合团队共享 SOP
  ```

  比如一个项目可以自带：

  ```
  project-architecture-review
  project-test-guideline
  project-release-process
  ```

  第三阶段：**Skill 与 Harness 联动**。

  Harness 可以声明：

  ```
  本任务需要 go-test skill
  本评测需要 issue-writing skill
  本修复任务需要 debugging skill
  ```

  这样任务运行和能力注入就能组合起来。

  第四阶段：**Skill 质量评测**。

  Skill 不能只是写出来，还要知道有没有用。可以统计：

  ```
  启用次数
  任务成功率
  用户关闭率
  是否导致工具误用
  是否导致输出变差
  ```

  第五阶段：**Marketplace / 版本管理**。

  远程 Skill marketplace 有价值，但要很晚做。因为它引入安全问题：

  ```
  远程 Skill 是否可信？
  是否有 prompt injection？
  是否诱导模型泄露信息？
  版本升级是否破坏行为？
  ```

  所以 marketplace 必须建立在签名、版本、权限、trust 之上。

  ------

  # 总结

  > Tool 让 Agent 能做事，Hook 让 Runtime 能被扩展，Harness 让任务能被运行和验证，而 Skill 让 Agent 在某类任务上“知道该怎么做”。它不是执行层，不是权限层，也不是评测层，而是把可复用的任务经验、流程约束和输出规范沉淀成可激活的上下文能力。

  或者更短一点：

  > Skill 的价值不是给 Agent 增加更多手，而是让 Agent 更会用已有的手。