# AiCodeHeaderControl（内部件 · 仅 API）

> 内部件，[MUST NOT] 当公共组件用。代码块头部右侧控制条：复制（变勾反馈）+ 折叠/展开（箭头旋转）。左侧语言标签由 XMarkdown 库默认头部承担。经 `useCodeXSlot()` 注入 `codeHeaderControl` 插槽。

## API

> ⚠️ 以组件源码为真相源；与文档冲突时以源码为准。

### Props

| name | type | 默认 | 语义 |
| --- | --- | --- | --- |
| `codeBlock` | `CodeBlockExpose`（必填） | — | 库注入的代码块 expose（raw / isExpand / toggleExpand / copyCode） |

### Emits

无

### Slots

无

### Expose

无

## 机制契约

- **本地展开态跟踪**：库经 `renderSlot2` 注入 expose，跨 slot 边界后 `isExpand` 的 ref 响应性不可靠——组件不依赖它驱动视图，用 `toggleExpand()` 的权威返回值本地同步（`readLibExpand` 兜底：未注入时默认展开）
- 复制成功 Check 图标 + 「已复制」反馈；`aria-label` 动态传达折叠态（aria-expanded 被 ElTooltip 占用）
