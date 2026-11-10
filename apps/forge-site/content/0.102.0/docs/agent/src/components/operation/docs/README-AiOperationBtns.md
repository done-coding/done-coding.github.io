# AiOperationBtns（内部件 · 仅 API）

> 内部件，[MUST NOT] 当公共组件用。操作条按钮组：logo（图片或 #logo 槽，**缺省不渲染**）+ 关闭（可选）+ 展开/收起会话记录 + 新建会话。折叠态 = 圆形图标按钮，展开态 = 方块带文案按钮。AiOperationBar 装配。

## API

> ⚠️ 以 types.ts（`AiOperationBtnsProps`）与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name | type | 默认 | 语义 |
| --- | --- | --- | --- |
| `onClose` | `(() => void)?` | — | 传入则显示关闭按钮 |
| `tooltipPlacement` | `"left"\|"right"?` | — | tooltip 位置（bar 在 left 外部设 right，反之设 left） |
| `isCollapsed` | `boolean?` | — | 是否折叠（驱动按钮形态：circle ↔ block+round） |
| `logoUrl` | `string?` | — | logo 图片地址（优先级 `#logo` 槽 > logoUrl > **不渲染**；q21yfk 判据 9 删无来源色块占位，对齐 AiSenderHeader 0.3.0 同款清理） |

### Emits

| 事件 | 参数 | 语义 |
| --- | --- | --- |
| `toggle-collapsed` | — | 展开/收起会话记录 |
| `create-session` | — | 新建会话 |

### Slots

| 槽 | scope | 语义 |
| --- | --- | --- |
| `#logo` | `{ size: string, mode: "ai" }` | logo 渲染口（默认 img；无 logoUrl 且无槽 → 不渲染） |

### Expose

无

## 机制契约

- 按钮 key 枚举：`close` / `toggle-collapsed` / `create-session`（内部 enum，不导出）
- 关闭按钮仅在 `onClose` 传入时渲染（事件驱动显隐，非 prop 开关）
