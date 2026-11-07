# AiOperationBar（内部件 · 仅 API）

> 内部件，[MUST NOT] 当公共组件用。折叠式会话操作条：左/右侧竖条 = AiOperationBtns（logo + 关闭 + 展开收起 + 新建会话）+ 展开区 = Conversations 会话列表（按日期分组 / 分页加载 / 点选切换）。AiDialogueGroup 装配。

## API

> ⚠️ 以 types.ts（`AiOperationBarProps`）与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name | type | 默认 | 语义 |
| --- | --- | --- | --- |
| `position` | `"left"\|"right"?` | `"right"` | 操作条位置 |
| `collapsedWidth` | `number\|string?` | `50` | 折叠宽度 |
| `unCollapseWidth` | `number\|string?` | `200` | 展开宽度 |
| `onClose` | `(() => void)?` | — | 关闭回调（传入则显示关闭按钮；`tooltipPlacement` 相应联动） |
| `logoUrl` | `string?` | — | logo 图片地址（优先级 `#logo` 槽 > logoUrl > 色块占位） |
| `list` | `XConversationItem[]`（必填） | — | 会话列表（AiDialogueGroup 注入） |
| `sessionListLoadMoreLoading` | `boolean?` | `false` | 会话列表分页加载中 |

**v-model**：`activeSessionId`（string，激活会话）/ `isCollapsed`（boolean，折叠态，默认 `true`）

### Emits

| 事件 | 参数 | 语义 |
| --- | --- | --- |
| `sessionListLodeMore` | — | 会话列表滚动到底请求下一页（注意：emit 名为源仓遗留拼写 `Lode`） |

### Slots

| 槽 | scope | 语义 |
| --- | --- | --- |
| `#logo` | `{ size: string, mode: "ai" }` | logo 渲染口（透传给 AiOperationBtns） |

### Expose

无

## 机制契约

- 展开状态下点选会话 → `@update:active` → 内部 `hideBar` 立即收起（显式操作后收起）
- **0.3.0 起不再有「悬停主体区自动收起」**（原 `useGroupUX` 300ms 防抖）——鼠标飘过即消失属反直觉交互，业界会话列表为常驻或显式切换
- 会话按日期分组（`Conversations groupable`）：今天 / 更早（`formatTimestamp` 按 `YYYY-MM-DD` 分组标题）
- `tooltipPlacement` 由 position 派生（left → right，right → left），无需外部传
- **空列表态（q21yfk 判据 9）**：无会话时弱化文案「暂无会话记录」（`--dc-agent-text-secondary`），[MUST NOT] 用 ElEmpty 纸箱插画——这是会话历史侧栏不是后台空态页
