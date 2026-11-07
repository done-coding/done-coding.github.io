# AiPartRenderer（内部件 · 仅 API）

> 内部件，[MUST NOT] 当公共组件用（无独立对外使用场景）。非 text part 的默认渲染（C 阶段 REQ-2 新增）：AiMessageList（reasoning/tool-call/file + data-* 缺槽兜底）与 AiBubbleContent（自管路径 `item.parts`）共用。

## API

> ⚠️ 以组件源码为真相源；与文档冲突时以源码为准。

### Props

| name | type | 默认 | 语义 |
| --- | --- | --- | --- |
| `part` | `AiMessagePart`（必填，非 text） | — | reasoning / tool-call / file / data-* part |
| `item` | `XBubbleListItemProps?` | — | 气泡项（reasoning 标题态取 `isAborted`；缺省时降级为无中止态） |

### Emits

无

### Slots

无

### Expose

无

## 机制契约

- **reasoning**：复用 `AiThinkBox`（与 `<think>` 内联路径**同一套**标题三态「正在思考 / 已思考(N秒) / 已停止」+ 流式自动展开 / 完成自动折叠 / 手动优先）。`isThinking` 取 `part.state === "streaming"`；耗时取 `part.thinkTime`（q21yfk 判据 4：双路径一致，[MUST NOT] 再维护独立的「思考过程」简易折叠块）
- **tool-call**：工具卡（q21yfk 判据 2/3，对标 AI SDK Elements Tool）：
  - **默认折叠**，折叠态 = 一行摘要：工具名（mono）+ 入参紧凑单行预览（truncate）+ 状态 pill；
  - 状态 pill 带图标 + 语义色（streaming=info 旋转 / input-available=warning / output-available=success / output-error=danger / output-denied=warning），色走 `--dc-agent-color-*` + `color-mix` 淡底，零自造 var；
  - 展开态 = 发丝边卡片内「入参 / 结果」分节 `pre`；`errorText` 红色展示；
  - [MUST NOT] 猜业务人话摘要（「查询天气」这类归消费方 `#tool` 槽，见批次 D8）
- **file**：`mediaType` 为 `image/` 且带 `url` → `<img>`；否则附件占位（文件名或 MIME）
- **data-***：占位文案 `[unsupported part: <type>]` + console.warn（按 type 去重）——#part 槽由消费方接管时的兜底
- 主题变量全走 `--dc-agent-*`（含 color-primary 派生错误色），零自造变量（规则 14）
