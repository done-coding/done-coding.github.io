# AiThinkBox（内部件 · 仅 API）

> 内部件，[MUST NOT] 当公共组件用。思考折叠框：标题行（「正在思考…」/「已思考(N秒)」/「已停止」+ 折叠箭头）+ 内容区（折叠可收起，含流式自动展开 / 完成自动折叠 / 手动优先）。

## API

> ⚠️ 以组件源码为真相源；与文档冲突时以源码为准。

### Props

| name | type | 默认 | 语义 |
| --- | --- | --- | --- |
| `isThinking` | `boolean?` | `true` | 正在思考（驱动标题态 + 流式自动展开） |
| `item` | `XBubbleListItemProps?` | — | 内部气泡项（isAborted / thinkTime 驱动标题态）；q21yfk 起可选——reasoning part 路径（AiPartRenderer）复用本组件时可无完整 item |
| `thinkTime` | `number?` | — | 思考耗时（秒），优先于 `item.thinkTime`（reasoning part 自带耗时时用） |

### Emits

无

### Slots

| 槽 | scope | 语义 |
| --- | --- | --- |
| `default` | — | 思考内容（AiContentSplit 注入） |

### Expose

无

## 机制契约

- **自动展开/折叠**：`isThinking` 翻转即驱动（immediate 兼设初值）：流式思考中默认展开、完成后自动折叠
- **手动优先**：用户点过折叠头后（`userToggled`）停止自动驱动，尊重手动选择
- **命名反话**：内部 `isCollapsed` 值为 true 时挂 `_collapse` 类 = 内容**展开**（名为反话，实为「是否展开」——迁入既有语义不改名）
- 折叠头键盘可达（role=button + tabindex + Enter/Space）；内容区随机 id 防撞（内容由 slot 注入）
