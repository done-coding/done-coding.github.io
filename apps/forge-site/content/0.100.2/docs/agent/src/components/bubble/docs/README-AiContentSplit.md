# AiContentSplit（内部件 · 仅 API）

> 内部件，[MUST NOT] 当公共组件用。思考内容切分：按 `<think>...</think>` 标记把流式文本切成「思考段（进 AiThinkBox 折叠）+ 答复段」交替渲染。AiBubbleContent 在 `item.showThink` 时装配。
>
> ⚠️ **0.3.0 起默认关**：`item.showThink` 由 `AiDialogue` 的 `showThink` prop 驱动（默认 `false`），此前在 `useSenderScoped` 内**硬编码为 `true`**、无任何开关。
> 本路径与结构化 `reasoning` part（走 `AiPartRenderer`）是**同一件事的两条路**——仅当后端把思考塞在正文文本里、且不吐 `reasoning` part 时才开。

## API

> ⚠️ 以组件源码为真相源；与文档冲突时以源码为准。

### Props

| name | type | 默认 | 语义 |
| --- | --- | --- | --- |
| `textShow` | `string`（必填） | — | 展示内容（不看 item.content，由打字机传入当前展示文本） |
| `splitMark` | `string?` | `"</think>"` | 分割符 |
| `item` | `XBubbleListItemProps`（必填） | — | 内部气泡项（isFinished 驱动 isThinking） |

### Emits

无

### Slots

| 槽 | scope | 语义 |
| --- | --- | --- |
| `default` | `{ text: string }` | 段落渲染口（每段各调一次；AiBubbleContent 注入 XMarkdown） |

### Expose

无

## 机制契约

- 切割算法：`openMark = splitMark 去斜杠`；无 `<think>` 开标记的纯答复 [MUST NOT] 塞进折叠框（否则完成后被 AiThinkBox 自动折叠整段藏没）；末段恒为答复段
- `isThinking`：`item.isFinished ? false : 段数 < 2`——流式过程中首段仍在思考（展开），完成后收拢
- 算法为 TODO 级精度（「优化切割算法」注释在案），语义边界以「纯答复不进折叠框」为守
