# AiBubbleFooter（内部件 · 仅 API）

> 内部件，[MUST NOT] 当公共组件用。气泡尾部：中止 / 错误状态提示 + 复制操作条（hover 显隐，由 AiDialogue 深度样式控制；触摸设备常显）。

## API

> ⚠️ 以组件源码为真相源；与文档冲突时以源码为准。

### Props

| name | type | 默认 | 语义 |
| --- | --- | --- | --- |
| `item` | `XBubbleListItemProps`（必填） | — | 内部气泡项（isAborted / errorMsg / content） |

### Emits

无

### Slots

无

### Expose

无

## 机制契约

- 状态优先级：`isAborted`（「被中止」）> `errorMsg`（「出错了」）> 正常态（仅复制按钮）
- 复制按钮仅在 `item.content` 非空时渲染；复制走 `navigator.clipboard`，成功后 Check 图标 + 「已复制」反馈（1.5s 复位）；剪贴板不可用静默
- hover 显隐：操作条默认 `opacity:0`，`.el-bubble:hover` 浮现；`@media (hover: none)` 触摸设备常显（AiDialogue 深度样式）
- **左缘对齐（q21yfk 判据 6）**：操作条与 AI 正文左缘对齐（补推理轨缩进），[MUST NOT] 凸出正文列（对标 DeepSeek）
- **AI 侧分割线（q21yfk 追改，甲方要求）**：操作条上缘发丝线横贯阅读列（`ai-bubble-actions_divided`，仅 AI 气泡；宿主需配合 footer `align-self: stretch`——wrapper 是 flex 列默认不拉伸，AiDialogue 已带）；正文到操作条的空白同步收口（末段 markdown 尾距修剪 + footer margin-top 归零，48px → ~21px）
