# AiSenderHeader（内部件 · 仅 API）

> 内部件，[MUST NOT] 当公共组件用（无独立对外使用场景）。AiDialogue 新会话态经 `#header` 插槽渲染：空态欢迎语（logo + 问候）+ 快捷问题卡（2 列网格，**点选即发送**；窄容器降单列）。

## API

> ⚠️ 以组件源码为真相源；与文档冲突时以源码为准。

### Props

| name | type | 默认 | 语义 |
| --- | --- | --- | --- |
| `greeting` | `string?` | 见下 | 欢迎语文案 |
| `swiftAsk` | `string[]?` | — | 快捷问题；空/不传 → **整块建议卡不渲染** |
| `logoUrl` | `string?` | — | logo 图片地址（优先级 `#logo` 槽 > logoUrl > **不渲染**） |

`greeting` 缺省值在本组件内解析（AiDialogue 只透传、不预填）：有 `swiftAsk` → `你可以这么问：`；无 → `今天有什么可以帮到你？`

### Emits

无

### Slots

| 槽 | scope | 语义 |
| --- | --- | --- |
| `#logo` | `{ size: string, mode: "ai" }` | logo 渲染口（默认 img；无 logoUrl 且无槽 → 不渲染） |

### Expose

无

## 视觉取向（0.3.0）

**极简 / 克制**——靠留白与字重分层，不靠描边与色块（甲方定调「简洁为主，不要太华丽花哨」）。建议卡的调整**只做减量、零新 token**：

| 项 | 0.2.0 | 0.3.0 | 为什么 |
| --- | --- | --- | --- |
| 底 / 边 | 透明底 + `1px --dc-agent-border` | `--dc-agent-bubble-bg` 浅底 + 无边 | 三条并排描边在窄侧栏里形成栅栏感；浅底与输入框 / 用户气泡同料，归为同一族 |
| hover | 底变色 | **加边框**（底不变） | 反馈由「变色」改为「显形」，静态更安静 |
| 圆角 | `radius-lg` 12px | `radius` 6px | 12px 在 246px 宽的长条上过圆润 |
| 字号 | 正文 16px | `font-size-sm` 13px | 与欢迎语（18px bold）拉开层次，避免读作「三个表单控件」 |

节奏（在 `AiDialogue` 的 `.ai-dialogue-sender-header` 上）：**横向内边距归零**（原 10px 让卡片比输入框窄一圈、左右缘对不齐）+ **底部 `space-6`(24px)**（原 10px 与卡间距 8px 几乎相等，四个同色浅底块连成一片）。

## 视觉修订（q21yfk 判据 8 · 对标豆包）

- **建议卡 chips 化**：撑满网格的灰方块 → 自适应宽度描边 chips（`inline-flex` 流式换行、发丝边 + 透明底、圆角上调），hover 浅底显形——「三条可点的建议」而非「三个禁用输入框」；窄容器仍靠流式换行自适应（容器查询降列随之退役）
- **欢迎语字阶上调**：`font-size-lg`(18px) → `font-size-xl`(22px，新 token，见批次 D7：不取豆包 28px，agent-ui 常嵌窄浮层/侧栏）

## 机制契约

- 快捷问题按钮 `@click` 调 `useAiSessionInject().sessionExpose.ask({ value })`——依赖 AiDialogue 经 `useAiSessionProvide` 注入的当前会话 expose；脱离对话上下文会拿到 undefined（按钮静默无效）
- **降列走容器查询**（`@container (max-width: 480px)`，容器上下文由 `.ai-dialogue` 的 `container-type: inline-size` 建立），[MUST NOT] 改回 `@media`——侧栏内嵌时视口宽而容器窄，媒体查询永不触发
- **无 logo 时不渲染占位**（0.3.0 起）：此前无 `logoUrl` 会渲染一个 25px 灰色空圆，属纯噪音
