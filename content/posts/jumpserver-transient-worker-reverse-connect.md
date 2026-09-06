---
title: "JumpServer 穿透与瞬态 Worker 执行架构"
summary: "SRE-Buddy 远程执行链路：投放、回连与凭证生命周期"
publishedAt: "2026-09-06"
tags:
  - jumpserver
  - transient-worker
  - wss
  - SRE-Buddy
---
> [!NOTE]
> SRE-Buddy 需要在受控网络（仅经跳板机可达、禁止预装软件）的目标主机上执行诊断命令，并将结果流式回传。本文描述该远程执行链路：以一次性凭证 + 瞬态 Worker + 回连长连接实现"投放-执行-回流"，在零常驻、零预装约束下完成命令交付。

## 一、部署拓扑与网络约束

执行链路受以下部署事实约束：

| 端口 | 组件 | 暴露范围 |
| --- | --- | --- |
| 8080 | 主服务 Web/API（Nginx 反代） | 仅本机/内网 |
| 8081 | Worker Gateway 内部监听 | 仅本机/HA 私网 |
| 8443 | Nginx 承载的 WSS 回连入口 | **目标机必须可出站访问** |
| 2222 | JumpServer Koko SSH | Server → 跳板机 |
| 443 | JumpServer OpenAPI | Server → 跳板机 |

网络白名单方向：目标机 → Server（8443，WSS 回连）；Server → Koko（2222，SSH 穿透投放）；Server → JumpServer API（443）。

三条硬约束决定架构形态：

1. **服务端集中管理**：调度、审批、审计全部位于服务端，Worker 不承载任何管理面能力；
2. **零常驻、零预装**：跳板机与目标机不安装常驻 Agent，任务结束进程自毁；
3. **目标机仅可出站**：目标机通常无法被服务端主动连接，但可访问白名单放行的 8443 端口。

据此采用**瞬态投放 + 回连执行 + 会话级连接复用**架构：将轻量 Worker 程序投放至目标机，由 Worker 主动回连服务端执行已批准任务，完成后自毁。服务端不对目标机持有常驻 SSH 密钥，目标机不残留长期凭据。

## 二、投放通道：正向与反向

Worker 为单文件 Python ZipApp（`sre-buddy-target-worker.pyz`），预置于跳板机固定路径（默认 `/tmp/worker/`，可用 `SRE_JUMPBOX_WORKER_PATH` 覆盖）。投放存在两条通道：

**正向通道（Ephemeral Launcher）**：服务端调用 JumpServer OpenAPI 换取短期连接凭证，经 SSH 拨号 Koko（中枢跳板机），在跳板机侧以 qssh 将 Worker 瞬态下发至目标机。链路为 `Server → Koko(2222) → 跳板机 → qssh → 目标机`。目标机账号与资产授权复用 JumpServer 既有体系。

**反向通道（Jumpbox Launcher）**：当服务端无法触达 Koko，或跳板机侧不宜存放 JumpServer 凭据时，由跳板机侧常驻进程 `sre-buddy-launcher` 主动向服务端发起 WSS 长连接（`/internal/jumpbox/connect`）。服务端将投放调度指令经该通道加密下发，由跳板机本地以 qscp/qssh 执行投放。该通道实现 JumpServer API-key-free 调度，即跳板机侧无需任何 JumpServer 接口凭据。

两条通道实现统一的 Launcher 接口；反向通道无可用连接时自动回退正向通道。

## 三、凭证生命周期与回连握手

以一次已批准执行请求为例，链路时序如下：

1. 执行引擎按连接键查询连接池（Reserve）；仅当无现成连接时触发投放；
2. 投放前由 BootstrapIssuer 签发**一次性凭证**：256-bit 随机令牌，默认 5 分钟 TTL；同时登记 `PendingToken`，绑定完整执行上下文（会话、目标主机/端口、目标用户、跳板机用户、传输方式及整份规范执行请求）；
3. 经正向或反向通道将 Worker 投放至目标机；
4. Worker 启动，经环境变量获取回连参数：`SRE_SERVER_URL`、`SRE_AUTH_TOKEN`、`SRE_SESSION_ID`、`SRE_WORKER_ID`；
5. Worker 向 `/internal/workers/connect` 发起 WSS 握手，携带 `Authorization: Bearer <TOKEN>`；
6. 服务端对令牌执行原子消费（`Take`）：锁内完成查找、删除、过期判定。令牌仅可消费一次，二次使用返回 `not found or already consumed`，过期返回 `expired`；
7. 握手后进行 attempt 匹配校验（与预留尝试一致且未过期），连接置为 ready；
8. 下发任务，Worker 执行并以事件流回传 stdout/stderr 与最终结果，进程随后自毁。

握手顺序为三层校验：传输层 TLS 证书校验（系统 CA，Nginx 于 8443 终止 TLS）→ Bearer 令牌原子核销 → WebSocket 升级后的 attempt/过期校验。令牌核销先于升级完成，重放无第二次机会。

**凭证演进**：早期版本曾实现客户端证书体系（内部 CA、客户端证书、指纹固定），后下线（#424、#629）。证书体系所需的签发、分发、吊销与续期管理与一次性任务模型不匹配；当前身份识别以短 TTL、绑定上下文、原子核销的一次性令牌承载。令牌存储设有容量上限（默认 4096），注册时先驱逐过期项。

**失败语义**：Worker 不在目标机执行自动重连——连接中断即退出自毁，下一次执行由服务端重新投放；等待 Worker 就绪（WaitReady）默认 30 秒超时。执行阶段另设硬超时保护（请求超时 + 5 秒 guard），目标机进程 D 状态或通道半开不致阻塞会话。

## 四、连接复用与隔离

Worker 回连成功后，连接进入注册表，供后续执行复用。复用键为：

```text
跳板机用户 | 目标登录用户 | 目标主机 | 目标端口 | 传输方式 (+connectorID)
```

复用键不含会话 ID：同一操作人对同一目标机的连接可跨会话复用；不同用户或不同目标机之间天然隔离，不存在通道串扰。每次执行前执行 Reserve，仅空连接触发重新投放。

为便于运维归因与权限隔离：Worker 进程按 `跳板机用户-目标用户-会话ID-调用ID` 命名（#587）；目标机侧 Worker 路径按目标登录用户隔离，避免多用户同机执行冲突（#606）。

## 五、半开连接治理

回连长连接配置心跳保活：Gateway 侧默认以 15 秒间隔 Ping、5 秒超时判定；Worker 侧 10 秒 Ping。Ping 失败或读空闲超过阈值（15 分钟）时，连接关闭并对挂起执行标记失败（`worker heartbeat lost`），避免半开连接与僵尸执行长期占用。

## 六、跳板机反向通道

### 6.1 端到端加密

反向长连接在传输层之上实施应用层全量加密（内网环境可能无 TLS 证书）：

- 密钥派生：配置密钥（32 字节 hex，与 `SRE_JUMPBOX_RELAY_KEY` 一致）经代码内置静态盐与 **PBKDF2-HMAC-SHA256（100,000 次迭代）** 派生 32 字节 AES 密钥；
- 消息信封：AES-256-GCM，12 字节随机 Nonce + 密文 + 16 字节认证标签；
- 防重放：Go 服务端与 Python 端各维护已见 Nonce 集合，容量上限 50,000；
- 密钥缺失语义：跳板机未配置 `relay_key` 时拒绝启动；服务端未配置 `SRE_JUMPBOX_RELAY_KEY` 时对接入返回 403；两端不一致时握手或解密失败。

来源控制叠加两层：后端按 `SRE_JUMPBOX_ALLOWED_IPS` 校验接入 IP；Nginx 在 `/internal/jumpbox/` 路径配置 `allow <跳板机IP>; deny all;`。

### 6.2 实现约束

跳板机 Launcher 为纯 Python 标准库实现：WebSocket 握手与帧解析自行实现（RFC 6455），AES-256-GCM 经 `ctypes` 调用系统 libcrypto，适用于无 pip、无第三方依赖的存量跳板机。协议含硬性上限：握手响应头 64 行以内、单帧 64KiB、各字段长度受限。

### 6.3 协议与配对

控制帧类型：`jumpbox_hello`、`jumpbox_ready`、`launch_target_worker`、`launch_worker_ack`、`ping`、`pong`。接入执行配对（pairing）：跳板机以短期配对令牌完成接入，并将连接归属至具体邮箱（配对 TTL 5 分钟），使多用户共享跳板机场景下可逐连接追责。心跳间隔 30 秒，投放指令超时 30 秒。断线后以固定 3 秒间隔重连。

### 6.4 投递兼容处理

| 问题 | 成因 | 处理 |
| --- | --- | --- |
| 内联投放脚本被拒绝 | 跳板机 `_ssh` 侧命令解析拒绝多行输入 | 内联 runner 整体 Base64 单行化后下发（#639/#623） |
| 默认账号前缀错误 | 目标用户为默认账号时不应拼接 `user@` | 依目标用户是否为默认账号决定拼接（#622） |
| 权限拒绝被误判成功 | SSH 层拒绝但远端 shell 退出码为 0 | 识别权限拒绝标记，避免误判成功并空等超时（#581/#580） |
| 投放通道无响应 | qssh 阻塞 | 30 秒超时保护 |

## 七、Worker 探针约束

Worker（`scripts/worker/worker.py`，打包为单文件 `.pyz`）需运行于多样化的目标机环境：

- **Python 3.5 兼容**（#614）：不使用 f-string，asyncio 用法降级，兼容缺少新版本解释器的存量机器；
- **执行姿态**：命令以 `/bin/bash -c` 执行，`setsid` 脱离会话、`nice 10` 降级优先级，减少对生产负载干扰；单次输出上限 4MiB；
- **清理**：退出时自删临时文件并清理执行沙箱；
- 执行输出经 WSS 流式回传后，先经服务端脱敏管道再写入会话与审计，Worker 侧不保留日志。

## 八、安全措施汇总

| 环节 | 机制 | 防护目标 |
| --- | --- | --- |
| 凭证 | 256-bit 随机、5 分钟 TTL、绑定执行上下文 | 缩小泄露窗口 |
| 凭证消费 | 原子 Take（删除后判过期） | 杜绝重放与二次消费 |
| 连接升级 | Bearer 核销 + attempt 匹配 | 防止冒用预留连接 |
| 连接复用 | 键级隔离（用户/主机/端口/协议） | 防止跨用户、跨主机串扰 |
| 反向通道 | AES-256-GCM + Nonce 防重放 + 双重来源白名单 | 防嗅探与记录重放 |
| Worker | 零常驻、单任务、退出自毁 | 目标机不残留长期凭据 |
| 半开连接 | 心跳 Ping 与超时关闭 | 防止僵尸连接与挂起执行 |

## 九、配置项

| 配置 | 默认 | 说明 |
| --- | --- | --- |
| `SRE_WORKER_GATEWAY_URL` | `wss://127.0.0.1:8443/internal/workers/connect` | Worker 回连地址，须为目标机可达 |
| `SRE_WORKER_GATEWAY_ADDR` | `127.0.0.1:8081` | Gateway 内部监听地址 |
| `SRE_JUMPBOX_RELAY_KEY` | 无 | 反向通道加密密钥，须与跳板机 `relay_key` 一致 |
| `SRE_JUMPBOX_ALLOWED_IPS` | 无 | 反向通道接入来源白名单 |
| `SRE_JUMPBOX_WORKER_PATH` | `/tmp/worker/sre-buddy-target-worker.pyz` | 跳板机侧 Worker 探针路径 |

## 小结

该架构的核心取舍为：以"零常驻"换取每次执行可能重新投放 Worker 的成本，以"短生命周期一次性凭证"取代长期证书，将信任集中收敛于服务端可校验的握手与核销环节。凭证绑定、连接隔离、心跳治理与双层白名单共同构成远程执行链路的纵深防护。
