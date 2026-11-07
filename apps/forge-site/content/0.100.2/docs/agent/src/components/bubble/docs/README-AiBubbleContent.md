# AiBubbleContent（内部件 · 仅 API）

> 内部件，[MUST NOT] 当公共组件用。气泡内容渲染：AI 角色 = 推理轨脊柱（流式 shimmer）+ 打字机 + 思考折叠 + XMarkdown；用户角色 = 纯文本（无 markdown）。两种角色**共用同一条 parts 渲染链**（`#part` / `#tool` 转发口 + `AiPartRenderer` 兜底）——用户侧的 parts 来自 `ask({ parts })`。AiDialogue / AiMessageList 的 `#content` 渲染核心。

## 窄容器可读性（0.3.0）

侧栏内嵌（约 300px）时 AI 正文的实际可用宽只剩百余像素，本组件对 XMarkdown 输出做了四处修正——都是几何 / 可达性，不是视觉定制：

| # | 修正 | 原状 |
| --- | --- | --- |
| ⓐ | **代码块横向可达**：滚动容器上移到 `.pre-md` + `code` 撑到 `max-content`，语言标签栏 `sticky left:0` 钉住 | `code` 虽标 `overflow-x:auto` 但 `scrollWidth` 恒等于 `clientWidth`——超出的行**既看不见也滚不到**（实测 300px 下右侧 117px 永久丢失） |
| ⓑ | **行内 code 不逐字符劈开**：`word-break: normal` + `overflow-wrap: break-word` | 第三方设 `break-all`，`greet(name)` 被断成 `gre` / `et(name)` |
| ⓒ | **列表缩进归一** `1.5em` | 浏览器默认 `40px`，在 300px 面板里吃掉 20% 横向空间 |
| ⓓ | **窄容器脊柱缩进降档**（`@container dc-agent (max-width:360px)` → `space-2`） | 恒 `space-4`(16px) |

> 容器上下文由 `.ai-dialogue`（自管路径）与 `.ai-message-list`（受控路径）**同名建立**（`container-name: dc-agent`），两条路径行为一致。

## API

> ⚠️ 以组件源码为真相源；与文档冲突时以源码为准。

### Props

| name | type | 默认 | 语义 |
| --- | --- | --- | --- |
| `item` | `XBubbleListItemProps`（必填） | — | 内部气泡项（content / role / isFinished / showThink / typing 等） |
| `codeXSlot` | `CodeBlockHeaderExpose`（必填） | — | 代码块头部控制（useCodeXSlot 产物） |
| `typingMsgUuid` | `string?` | — | 打字机效果消息 uuid（仅该 uuid 的消息流式打字，其余直接展示） |
| `allowHtml` | `boolean?` | `true` | markdown 允许内联 HTML（透传 XMarkdown） |

### Emits

| 事件 | 参数 | 语义 |
| --- | --- | --- |
| `typingFinished` | `uuid: string` | 打字机完成（AiDialogue 据此推进 typingMsgCtrl） |

### Slots

| 槽 | scope | 语义 |
| --- | --- | --- |
| `part` | `{ part: AiDataPart, item: XBubbleListItemProps }` | 业务 `data-*` part 渲染口；缺省退回 `AiPartRenderer` |
| `tool` | `{ part: AiToolPart, item: XBubbleListItemProps }` | 工具调用 part 渲染口；缺省退回 `AiPartRenderer` |

两槽由 `AiDialogue` 以 `v-if="$slots.x"` 守卫转发（无条件转发会用空 `<slot>` 遮蔽掉默认内容）。

### Expose

无

## 机制契约

- 打字机开关：`item.typing`（默认 true）→ 当前消息为 typingMsgUuid 时逐字、否则直接全文；`item.typing === false` 全局禁用
- `customAttrs.think`：`<think>` 标签自定义渲染（div + break-all）
- **parts 渲染链两角色共用**：`data-*` → `#part`、`tool-call` → `#tool`、其余（reasoning / file）→ `AiPartRenderer`。用户气泡的 parts 由 `ask({ parts })` 写入；`item.parts` 为空时该段不产出任何节点
- **时序交错（q21yfk 判据 1 · 方案 B）**：`item.partOffsets`（与 `parts` 平行的正文偏移数组，sse 层记录）存在时，正文按偏移切段、parts 插在对应切点——重演 agent 真实工作时序（正文₁ → 工具卡 → 正文₂）；打字机推进越过偏移点时 part 才浮现（`textShow.length >= offset`）。**切点保护**：偏移落在未闭合 `<think>` 块内时顺延到 `</think>` 后。`partOffsets` 缺省（存量历史消息）→ 退回旧序（正文后挂 parts），零回归
- 错误信息（`item.errorMsg`）在内容下方红色渐变展示；用户角色无错误场景
- markdown 透传 props：`allowHtml` + codeXSlot（代码块复制/折叠经 `AiCodeHeaderControl`）
