# AutoRefreshGroup（工具栏自动刷新组）

> 「自动刷新开关 + 手动刷新按钮」组合组：loading 联动、布局根可选，表格工具栏自动刷新能力即此组件。
> 消费范式：`packages/forge-core/src/components/data/TableToolbar.vue`（内部代表消费）；列表页经 TableMain/ListLayout 工具栏生效。

## 定位

- **何时用**：工具栏/操作区需要「自动刷新开关 + 手动刷新按钮」成套能力
- **何时不用**：只要自动刷新开关（不要手动按钮/布局控制）用 `AutoRefresh`
- 组合：`AutoRefresh`（开关本体）+ 手动刷新按钮 + loading 联动 + 布局根控制；`refreshFn` 等核心 props 透传 `AutoRefresh`

## 快速上手（最小可用）

必填 `refreshFn` + 两个 v-model——开关 + 间隔 + 手动刷新一次拿齐：

```html
<AutoRefreshGroup
  v-model:isAutoRefresh="isAutoRefresh"
  v-model:interval="refreshInterval"
  :refreshFn="tableExpose.refresh"
/>
```

**要点**：

- `v-model:isAutoRefresh` = 自动刷新开关；`v-model:interval` = 刷新间隔秒数
- `showAutoRefresh` / `showRefresh` 可分别关掉开关 / 按钮——如只留手动刷新
- `loading` 传入时：`AutoRefresh` 收 `:disabled` + 图标旋转动画（异步刷新免自管 loading）

## 能力边界 / 按需使用

- **`needRootNode`：默认 `true`（包布局根）即够用（独立使用）。** 嵌入既有布局（如表格工具栏）时 [MUST] 设 `false`——工具栏自身已是布局一部分，否则多包一层布局根（TableToolbar 标准接线即 `false`）。
- **`showAutoRefresh` / `showRefresh`：默认全开即够用。** 仅当只要其中一半能力才关另一半——如只留手动刷新按钮（`showAutoRefresh={false}`）。
- **`loading`：默认 `undefined` 即够用（不联动）。** 仅当异步刷新需要免自管 loading 态才传——传入后开关置 `disabled` + 图标旋转，[MUST NOT] 在消费方再手写 loading。
- **完整能力演示**（表格工具栏标准接线 = TableToolbar 内部消费）：`packages/forge-core/src/components/data/TableToolbar.vue`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name              | type                             | 默认        | 语义                                                                  |
| ----------------- | -------------------------------- | ----------- | --------------------------------------------------------------------- |
| `refreshFn`       | `() => Promise<unknown>`（必填） | 无          | 透传 AutoRefresh                                                      |
| `showAutoRefresh` | `boolean`                        | `true`      | 是否显示自动刷新开关                                                  |
| `showRefresh`     | `boolean`                        | `true`      | 是否显示手动刷新按钮                                                  |
| `loading`         | `boolean`                        | `undefined` | 加载中：传入 AutoRefresh `:disabled` + 图标旋转动画                   |
| `needRootNode`    | `boolean`                        | `true`      | 是否需要根节点（传 SlotLayoutTemplate `:disabled`，控制是否包布局根） |

**v-model**：`isAutoRefresh: boolean`（`v-model:isAutoRefresh`）；`interval: number`（默认 `5`，秒，`v-model:interval`）

### Emits

无

### Slots

无

### Expose

无

## 反模式 / 注意

- **异步刷新勿自管 loading**：`refreshFn` 返回 Promise，`loading` 传入即开关置 `disabled` + 图标旋转——[MUST NOT] 在消费方再手写 loading 态
- **`needRootNode` 语义**：默认 `true`（传 SlotLayoutTemplate `:disabled`，包布局根）；嵌入既有布局（如工具栏）时 [MUST] 设 `false`，否则多包一层布局根
- **工具栏场景勿手拼 AutoRefresh + ElButton**：成套能力已在此组件，重复造轮

## 关联

- 子组件：`AutoRefresh`（misc 族，开关本体）
- 内部消费者：`TableToolbar`（table 族）
- 布局根：`SlotLayoutTemplate`（slot-layout 族）

> 目录迁移：本组件及配套归入 `components/other/auto-refresh-group`；仅源码位置变化，包根导入、props、slots 与实例契约保持。

## bridge 事件（v0.35.0）

仅手动按钮点击时发 `refresh`（无 data），随后原样调用 refreshFn；自动定时刷新不发 refresh。`auto-refresh-toggle` 委托 AutoRefresh，不在 Group 二次 watch。既有 loading 只暂停自动刷新并转动图标，不禁用手动按钮，此行为不变。演示：`/other/integration/event-bus`。

## 无障碍语义（td1v4s）

手动刷新图标按钮默认可访问名“刷新”，无新增 prop；不改自动刷新和手动刷新事件。
