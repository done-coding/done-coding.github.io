# AutoRefresh（自动刷新开关）

> 独立自动刷新开关：开关 + 刷新间隔（秒），按间隔定时调用刷新方法。
> 消费范式：core 内无直接使用点，列表/表格场景经 `AutoRefreshGroup` 使用——内部消费者 `packages/forge-core/src/components/data/TableToolbar.vue`（经 AutoRefreshGroup）即范例。

## 定位

- **何时用**：需要「按间隔自动刷新」的独立开关（不跟随工具栏整体布局的场景）
- **何时不用**：列表/表格工具栏场景用 `AutoRefreshGroup`（自动刷新 + 手动刷新 + loading + 布局根一次拿齐）
- 内部组合：`ElPopover`(hover) + `ElSwitch` + `ElInputNumber`
- 刷新失败被 catch，不影响下轮定时

## 快速上手（最小可用）

直接使用场景较少；典型用法是经 `AutoRefreshGroup` 组合进工具栏（见 [README-AutoRefreshGroup](../../auto-refresh-group/docs/README-AutoRefreshGroup.md)）。单独使用即开关 + 间隔双向绑定：

```html
<AutoRefresh v-model="open" v-model:interval="interval" />
```

```ts
const open = ref(false); // 开关（modelValue）
const interval = ref(5); // 刷新间隔，秒（v-model:interval）
```

**要点**：

- `v-model` = 开关（modelValue）；`v-model:interval` = 间隔秒数
- `refreshFn` 返回 Promise，失败被 catch——**不会**中断下轮定时
- 防并发：`doRefresh` 未结算前重入共享同一 promise，不并发发请求
- 激活语义：mounted 只 schedule 不立即刷新；仅 keep-alive 重激活（`triggerType === "activated"`）才立即刷新

## 能力边界 / 按需使用

- **直接使用 vs 走 `AutoRefreshGroup`：独立开关场景才直接用本组件。** 判据——只要「开关 + 刷新间隔」本身、不跟随工具栏整体布局；列表/表格工具栏场景 [MUST] 走 `AutoRefreshGroup`（自动刷新 + 手动刷新 + loading + 布局根一次拿齐，手拼两组件属重复造轮）。
- **`refreshFn` 必填**：无刷新方法组件无意义——返回 Promise，失败被 catch 吞掉、不影响下轮定时，业务需感知失败请在 `refreshFn` 内自行处理。
- **`disabled`：默认 `undefined`（开关正常可用）即够用。** 仅当「禁用自动刷新」（置 `true` 即 `openRefresh=false`：清 timer 且不排下轮）才设——注意不是灰化开关。
- **完整能力演示**（组合进表格工具栏的标准接线）：`packages/forge-core/src/components/data/TableToolbar.vue`（经 AutoRefreshGroup）——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name        | type                             | 默认        | 语义                                               |
| ----------- | -------------------------------- | ----------- | -------------------------------------------------- |
| `refreshFn` | `() => Promise<unknown>`（必填） | 无          | 刷新方法；失败被 catch，不影响下轮定时             |
| `disabled`  | `boolean`                        | `undefined` | `true` 时 `openRefresh=false`：清 timer 且不排下轮 |

**v-model**：`modelValue: boolean`（默认 `false`，开关，`v-model`）；`interval: number`（默认 `5`，秒，`v-model:interval`）

### Emits

无

### Slots

无

### Expose

无

## 反模式 / 注意

- **`disabled` 不是灰化开关**：置 `true` 即 `openRefresh=false`（清 timer 且不排下轮），而非仅置灰不可点
- **刷新失败勿在组件外兜**：失败被 catch 吞掉，业务需感知失败请在 `refreshFn` 内自行处理
- **工具栏场景勿直接拼**：自动刷新 + 手动刷新成套能力（loading/布局根联动）在 `AutoRefreshGroup`，手拼两组件属重复造轮

## 关联

- 组合形态：`AutoRefreshGroup`（misc 族）
- 内部消费者：`TableToolbar`（table 族，经 AutoRefreshGroup）
- 激活语义：`useActivated`（core hooks）

> 目录迁移：本组件及配套归入 `components/other/auto-refresh`；仅源码位置变化，包根导入、props、slots 与实例契约保持。

## bridge 事件（v0.35.0）

`auto-refresh-toggle {enabled,interval}` 在 modelValue 实际变化时发射（包含程序更新，interval 单位秒），首次挂载不发；只改间隔或 disabled 暂停业务定时不伪造开关事件。失活时不采集，重新激活不补发旧状态。独立使用与 Group 内使用都由本组件报告一次。业务定时器维持原行为，埋点不新增定时器。演示：`/other/integration/event-bus`。

## 无障碍语义（td1v4s）

自动刷新开关和间隔数字框分别带“自动刷新”“自动刷新间隔（秒）”名称，无新增 prop。
