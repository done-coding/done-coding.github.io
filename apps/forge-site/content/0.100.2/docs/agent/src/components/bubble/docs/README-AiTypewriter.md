# AiTypewriter（内部件 · 仅 API）

> 内部件，[MUST NOT] 当公共组件用。打字机：按 step 逐字展示内容 + 光标后缀（流式中），完成后全文 + 无后缀。纯渲染原语（不持消息状态）。

## API

> ⚠️ 以 types.ts（`AiTypewriterProps`）与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name | type | 默认 | 语义 |
| --- | --- | --- | --- |
| `item` | `XBubbleListItemProps`（必填） | — | 内部气泡项（content 为打字源文本） |
| `disabled` | `boolean?` | `false` | 禁用打字（直接全文展示） |
| `step` | `number?` | `2` | 每次增加字数 |
| `interval` | `number?` | `50` | 间隔时间 ms |
| `suffix` | `string?` | `"\|"` | 流式中光标后缀 |

### Emits

| 事件 | 参数 | 语义 |
| --- | --- | --- |
| `finished` | — | 打字完成 |

### Slots

| 槽 | scope | 语义 |
| --- | --- | --- |
| `default` | `{ textShow: string }` | 展示文本渲染口（AiBubbleContent 注入 XMarkdown） |

### Expose

无

## 机制契约

- 单定时器守护：已有定时器不重建；内容缩回（textShow 超出 content）时展示全文（`needChangeIndex` 短路）
- 后缀仅在仍在推进时展示（`textShowWithSuffix`）；disabled 时 textShow = 全文
- 内部 index 初值 `ceil(7/step)`——初始 7 字符为 `<think>` 标记预留（与 AiContentSplit 切割语义衔接）
