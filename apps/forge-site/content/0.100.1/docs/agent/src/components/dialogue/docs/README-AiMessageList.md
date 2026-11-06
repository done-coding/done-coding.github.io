# AiMessageList（受控消息展示）

> 受控展示原语：消费方持有消息数组（业界 UIMessage 形态 `{id, role, parts|content}`），组件只做渲染——markdown（text part）/ 业务卡片（`data-*` part 经 `#part` 槽）。**零协议耦合、零持久化依赖**，静态数据即可用。
> 范式页：`apps/reference/src/pages/other/integration/agent/`、`demo-src/demos/MessageListDemo.vue`

## 定位

- **受控路径一等公民**：消息数据由消费方持有的场景用它（配 `AiSender` 即完整受控对话原语）——平台不碰 IndexedDB / SSE，业务自管数据源
- **何时不用**：要平台自管持久化 + SSE 全流程用 `AiDialogue`（此时无需本组件）
- 内部实现（不导出）：`AiBubbleContent`（text part 渲染）/ `useCodeXSlot`（代码块头部控制）/ `normalizeParts`（消息 → parts 归一化）

## 快速上手（最小可用）

```html
<AiConfigProvider :is-dark-theme="false">
  <AiMessageList :messages="messages" />
</AiConfigProvider>
```

```ts
import type { AiMessage } from "@done-coding/forge-kit-agent";

const messages: AiMessage[] = [
  { id: "m1", role: "user", content: "你好" },
  { id: "m2", role: "assistant", content: "**你好！** 我是 forge-agent。" },
];
```

**要点**：

- 消息形态 `{ id, role: "user"|"assistant", parts | content }`：`content` = 纯文本 shorthand（等价 `parts:[{type:"text",text}]`）；`parts` 存在时以 `parts` 为准
- 文本走 markdown 渲染（含代码块复制/折叠）；用户消息为右对齐 chip、AI 消息整宽文档化
- 业务数据 part `{ type:"data-card", data: {...} }`：经 `#part` 槽渲染；缺槽时平台占位兜底（dev 控制台警告一次）
- 推理 / 工具 / 文件 part（C 阶段新增）：平台默认渲染——reasoning 折叠块（思考过程）/ tool-call 状态机块（name + state + 入参/结果折叠）/ file 图片或附件块

## 能力边界 / 按需使用

- **`allowHtml`**：默认 `true`（透传 markdown 渲染器允许内联 HTML）——需要禁用内联 HTML 的安全敏感场景显式传 `false`
- **`bubbleMaxWidth`**：默认 `"100%"`（AI 消息整宽）；用户消息右对齐 chip 宽度由内部 `--dc-agent-read-width` 阅读列约束，一般无需改
- **`#empty` 槽**：空列表占位（默认空白）——需要空态引导时提供
- **`normalizeParts`（工具函数）**：消息 → parts 归一化（parts 优先 / content 兜底 / 相邻 text 合并）——消费方需要自定义渲染消息前可复用
- **完整能力演示**：`demo-src/demos/MessageListDemo.vue`——能力展示，非推荐默认

## API

> ⚠️ API 以 types.ts（`AiMessage` 等）与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name             | type                  | 默认     | 语义                                           |
| ---------------- | --------------------- | -------- | ---------------------------------------------- | ----------- |
| `messages`       | `AiMessage[]`（必填） | —        | 受控消息列表（`{id,role,parts                  | content}`） |
| `allowHtml`      | `boolean?`            | `true`   | markdown 允许内联 HTML（透传 AiBubbleContent） |
| `bubbleMaxWidth` | `string?`             | `"100%"` | 消息最大宽度                                   |

### Emits

无

### Slots

| 槽       | scope                                      | 语义                                        |
| -------- | ------------------------------------------ | ------------------------------------------- |
| `#part`  | `{ part: AiDataPart, message: AiMessage }` | 业务 `data-*` part 渲染口；缺省平台占位兜底 |
| `#empty` | —                                          | 空列表态                                    |

### Expose

无

## 反模式 / 注意

- **data part 无 #part 槽**：平台只占位不渲染（`[unsupported part: data-xxx]`）——业务卡片必须配 `#part` 槽
- **相邻 text part**：`normalizeParts` 会合并相邻 text part（避免多 markdown 块割裂）——传 parts 时相邻 text 无需自行合并
- **改 message 数组**：消息为受控 prop，增删改由消费方持有并更新——组件内部无可变状态
- **`parts` 与 `content` 同传**：以 `parts` 为准、`content` 忽略（优先级契约）

## 关联

- 受控输入配对：`AiSender`（v-model + @submit）
- 全流程对照：`AiDialogue`
- 消息结构：`AiMessage` / `AiMessagePart`（text/reasoning/tool-call/file/data-\*）/ `normalizeParts`（types.ts 真相源）；协议契约见包级 README「协议契约」节
