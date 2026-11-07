# TableMain（配置化数据表格）

> 配置化表格：列配置（ElTableColumnProps 超集）驱动渲染 + 内置分页 / 工具栏 / 骨架屏 / 精细化布局高度链。
> 范式页：`apps/reference/src/pages/data/table/toolbar/`（工具栏）、`apps/reference/src/pages/data/table/skeleton/`（骨架屏 + fillHeight）、`apps/reference/src/pages/layout/list-layout/guide/`（与 FormSearch 组合成列表页）

## 定位

- **空间一等公民是 `ListLayout`**：常规列表页 [MUST] 走 `ListLayout`（内部已组合 FormSearch + TableMain + 高度链 + 分页 + 粘性，常用配置提升为直属 prop；TableMain 恒收 `refine=false`）——**TableMain 一般不直接使用**
- **直接使用仅当**：纯表格页（无搜索区）/ 嵌入卡片或面板的局部表格 / 特殊布局——此时取数/分页/工具栏/高度链全由自己负责
- 纯展示静态表格用 ElTable 即可
- 泛型三参：`T` 行数据类型 / `SQ` 静态查询参数 / `F` 注入对象类型；`query` 变化时重置到第 1 页重新拉取

## 快速上手（最小可用）

标准数据表格零配置——只传三必传即得「取数 + 分页 + 骨架屏 + 工具栏 + 布局」全默认（`table/toolbar/Index.vue`）：

```vue
<TableMain ref="tableRef" :api="api" :columns="columns" row-key="id" />
```

需要工具栏按钮时配 `toolbar`（ActionBtn 配置驱动，context 消费选中列表）：

```tsx
const toolbarConfig: TableToolbarConfig<Row> = {
  leftExtraButtons: [
    {
      key: "batch-archive",
      label: "批量归档",
      actionBtnProps: (ctx) => ({
        disabled: ctx.selectedList.length === 0,
        onClick: () => {
          /* ctx.selectedList 消费 */
        },
      }),
    },
  ],
};
```

```vue
<TableMain
  ref="tableRef"
  :api="api"
  :columns="columns"
  row-key="id"
  :toolbar="toolbarConfig"
/>
```

**要点**：

- 三必传 `api`/`columns`/`rowKey`；`api` 收到的是 `query` 深合并 `page.page/page.pageSize` 后的参数（键名由 `APP_API_LIST_MODEL_KEY_CONFIG` 单源定义），返回 `TableApiResult<T>` 的 `items` + `page.totalRecord` 子集
- 增删改后的刷新：`refresh()`（当前页重拉）或 `reload()`（回第 1 页重拉，已在第 1 页则等同 refresh）；keepAlive 返回刷新由 core 内置承担（onActivated 自动 refresh 留页码）——**[MUST NOT]** app 侧再手写刷新信号补偿

## 能力边界 / 按需使用

- **默认即够用：分页 + 骨架屏 + refine 布局 + 工具栏全开**——只传 `api`/`columns`/`rowKey` 即得标准数据表格。
- **高度链三选一（判据）**：`refine` 默认开（按 viewport 高减 toolbar/pager 得出数据区高）即够用；`maxHeight` 显式定高仅当表格嵌定高容器（如固定高度卡片）时配；`viewportHeight` 显式指定视口可用高仅当 refine 计算不满足（嵌套弹层内消费外层 scope，优先级最高）时配。
- `fillHeight`：默认关；仅当数据稀疏/为空时需要数据区撑满、分页器贴底（视觉稳定）时开——需已有 `maxHeight` 或 refine+viewportHeight 基准。
- **空态双态**：非加载态空数据按「api 是否至少被调用过一次」区分——**从未调用过**（如 ListLayout 关 `initialSearch` 首屏）→ ElEmpty 自定义「欢迎触发查询」+ Search 图标；**已调用过但无数据** → 默认 ElEmpty「暂无数据」。
- **激活刷新条件化**：`onActivated` 的自动 refresh 仅「已发生过查询」后生效（`hasRequested` 自判）——初始化查询关闭/从未查询时 KeepAlive 激活不自动刷新；手动查询过后恢复（有数据心智后保持刷新语义）。
- `skeleton`：默认开（冷启行数自适应 3~8）；热刷不出骨架属设计语义（外层遮罩盖旧数据），勿改。
- `customView`（v-model）：默认关；仅当需要网格/卡片视图替代表格（DataListView）时开，且 [MUST] 配 `#custom-view-item` 插槽。
- `query`：仅当有静态查询参数（固定过滤条件）时传；变化自动重置第 1 页重拉。
- `showSwitchView`：默认关；仅当需要表格/网格视图切换按钮时开。
- `tableProps`：仅当需透传 ElTable 事件（如 `onSelectionChange` 供工具栏选中联动）时配。
- `showPager`/`pageSizeInit`/`pageSizeOptions`：仅分页形态不满足时调；常规列表不动。
- **完整能力演示**（工具栏按钮组 + 骨架屏 + fillHeight + 网格视图）：`apps/reference/src/pages/data/table/toolbar/`、`apps/reference/src/pages/data/table/skeleton/`——能力展示，非推荐默认。

## 自持面（`surface`）

`TableMain` **自己持有那块面**（面色 `--el-bg-color` + 内呼吸 + 圆角），
不依赖外层容器伸手来刷 —— 单独用 `TableMain`（不套 `ListLayout`）时观感一致。

🔴 **内呼吸计入可用高**：`surface` 开启时自身 padding 会从数据区可用高里扣掉。
这是「面归组件自己持有」的**根本理由** —— 样式与高度账在同一个组件内闭环。
此前 padding 由 `ListLayout` 经 `:deep()` 从外面刷、可用高在 `TableMain` 里算，
两边各管一半，结果每页恒漏一个 padding（甲方 2026-09-15 报障）。
**[MUST NOT] 退回「外层刷面、内层算高」。**

**弹窗内不二次成面**：置于 `ModalConfirm` 正文（`data-dc-slot=ModalConfirm_Body`）
时，经 `useContextDefaults` 自动取 `false`。亮色下 `--el-bg-color` 与
`--el-bg-color-overlay` 同为 `#fff`、**看不出区别**；暗色下 overlay `#1d1e1f`
上盖 `#141414` 才会露出「弹窗里凹下去一块」。

⚠️ **已知边界**：`useContextDefaults` 只读**直系父** DOM。若弹窗正文里放的是
`ListLayout`（它包着 `TableMain`），直系父不是弹窗正文 ⇒ 推导不到、仍会成面，
此时 [MUST] 显式传 `:surface="false"`。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（泛型 `T` 行 / `SQ` 静态 / `F` 注入）

| name                        | type                                                                        | 默认                                        | 语义                                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `api`                       | `(params: TableApiParams<SQ>) => Promise<TableApiResult<T>>`（必传）        | —                                           | 列表请求；params = query 深合并 page.page/page.pageSize（键名由 APP_API_LIST_MODEL_KEY_CONFIG 定）                                     |
| `columns`                   | `ElTableColumnProps<T,F>[]`（必传）                                         | —                                           | 列配置数组                                                                                                                             |
| `rowKey`                    | `Extract<keyof T,string> \| ((row:T)=>string)`（必传）                      | —                                           | 行主键                                                                                                                                 |
| `query`                     | `SQ`                                                                        | —                                           | 静态查询参数；变化时重置到第 1 页重新拉取                                                                                              |
| `surface`                   | `boolean`                                                                   | `true`                                      | **自持面**：面色 + 内呼吸 + 圆角。置于 `ModalConfirm` 正文里时经上下文自动转 `false`（那儿已是一块面）；显式传值恒优先。见下「自持面」 |
| `showPager`                 | `boolean`                                                                   | `true`                                      | 展示分页器                                                                                                                             |
| `pageSizeInit`              | `number`                                                                    | `20`                                        | 初始每页条数                                                                                                                           |
| `pageSizeOptions`           | `number[]`                                                                  | `[10,20,30,40]`                             | 分页器每页条数选项                                                                                                                     |
| `pageLayout`                | `string`                                                                    | `"total, sizes, prev, pager, next, jumper"` | ElPagination layout                                                                                                                    |
| `showSwitchView`            | `boolean`                                                                   | `false`                                     | 显示切换视图按钮（表格/网格）                                                                                                          |
| `showToolbar`               | `boolean`                                                                   | `true`                                      | toolbar 顶层开关                                                                                                                       |
| `toolbar`                   | `TableToolbarConfig<T,SQ,F>`                                                | —                                           | toolbar 配置（按钮 / 刷新 / 自动刷新 / 导出）                                                                                          |
| `tableProps`                | `Omit<TableProps<T>,"data"\|"maxHeight"\|"rowKey"> & Record<`on${...}`,fn>` | —                                           | 透传 ElTable props + 事件（如 `{ onSelectionChange }`，内部与选中存储合并）                                                            |
| `maxHeight`                 | `number`                                                                    | —                                           | 表格最大高度；与 refine 二选一作为高度基准                                                                                             |
| `headerColor`               | `string`                                                                    | `"rgb(240,240,240)"`                        | @deprecated，样式已注释无实际效果                                                                                                      |
| `refine`                    | `boolean`                                                                   | `true`                                      | 精细化布局：无 maxHeight 时按 viewport 高减 toolbar/pager 得出数据区高                                                                 |
| `refineReduceHeight`        | `number`                                                                    | `0`                                         | refine 模式下预留高度减量                                                                                                              |
| `injectInfo`                | `F`                                                                         | —                                           | 注入列插槽 / DataListView 作用域的额外对象                                                                                             |
| `dataViewMaxHeightMinValue` | `number`                                                                    | `500`                                       | 数据视口最大高最小值 floor 兜底                                                                                                        |
| `skeleton`                  | `boolean`                                                                   | `true`                                      | 冷启（首次无数据）骨架屏；热刷不出骨架（外层遮罩盖旧数据）                                                                             |
| `skeletonRows`              | `number`                                                                    | 自适应 3~8                                  | 骨架行数（table）/ 卡片数（grid）                                                                                                      |
| `fillHeight`                | `boolean`                                                                   | `false`                                     | 数据滚动区 min-height 撑满可用高、稀疏/空数据时分页器顶到底；需有 maxHeight 或 refine+viewportHeight 基准                              |
| `viewportHeight`            | `number`                                                                    | —                                           | 显式指定视口可用高（优先级最高）；缺省走 SCOPE_VIEWPORT_MAX_HEIGHT scope 链 + fallback 0（500 floor 兜底）                             |
| `parentChannel`             | `string`                                                                    | —                                           | 定向消费的祖先 scope 标识；setup 期快照，沿 scope 链找 scope === parentChannel 取高                                                    |

**v-model**：`isAutoRefresh`（boolean）、`refreshInterval`（number，秒）、`customView`（boolean，默认 false，显式切 DataListView 替代 ElTable，需配 `#custom-view-item` 插槽）、`activeId`（`string | number | undefined`）/ `activeData`（行对象 | undefined）—— **「当前项」双 model**（= 用户点击/激活的那一条，[MUST NOT] 与勾选 selection 混同）。两者**同生同灭**：`activeId` 有值 ⇒ `activeData` 必有值且恒为**列表数据原样**；列表刷新后当前项不在新数据内 → 两者一并清空；外部写入不在列表内的 id → 忽略 + `console.warn`（不清空既有选中）。⚠️ `activeId` 的 `string` / `number` **两种都是一等公民**：出口值**保业务数据里的原始类型**（`rowKey` 为字段名时即 `row[rowKey]`，数字 id 出数字）；外部用另一种类型写入（如 `"1"` 对数字 id）同样命中——比对时内部统一 `String()` 归一，且**保留调用方写入的原值**不回写覆盖。ElTable 态由本组件接管（命令式 `setCurrentRow` 同步高亮——EP 的 `current-row-key` 置空不清高亮，故不用它）；`customView` 态让位内层 `DataListView`

### Emits

| 事件             | 载荷            | 语义                                   |
| ---------------- | --------------- | -------------------------------------- |
| `pageChange`     | `number`        | 页码变化                               |
| `pageSizeChange` | `number`        | 每页条数变化                           |
| `dataChange`     | `T[]`           | 数据变更                               |
| `loadingChange`  | `boolean`       | 加载态变化                             |
| `pageInfoChange` | `TablePageInfo` | 分页信息（pageSize/currentPage/total） |

### Slots

无默认插槽。动态列插槽：

| 槽                      | scope                                                                      | 语义                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `#<column.prop>`        | `TableColumnDefaultScope`：`{row, column, $index, injectInfo, exposeInfo}` | 覆盖列单元格                                                                                                            |
| `#header-<column.prop>` | `TableColumnHeaderScope`：`{column, $index, injectInfo, exposeInfo}`       | 覆盖列表头                                                                                                              |
| `#custom-view-item`     | `DataListViewItemScope<T>`                                                 | customView 模式单项渲染                                                                                                 |
| `empty`（内部默认）     | 无                                                                         | 空数据插槽——默认按 `hasRequested` 双态：未调用过 api →「欢迎触发查询」+ Search 图标；已调用无数据 → ElEmpty「暂无数据」 |

### Expose（`TableMainInstance`）

`refresh(silent?: boolean): Promise<unknown>`（当前页重拉）、`reload(slice?: boolean): Promise<unknown>`（回第 1 页重拉，已在第 1 页则等同 refresh）、`getTableInstance(): TableInstance | undefined`（底层 el-table 实例）

## 关键类型

- `ElTableColumnProps<T,F>`：EP ElTableColumn 全量 props + `render`/`headerRender` 三态——string 全局组件名 / 组件对象 / functional `(props)=>VNode`
  - 列 `render` **只收到真实行**：Element Plus 探测嵌套子列时会以 `{ row: {}, $index: -1 }` 调列默认插槽，TableMain 在该探测作用域**不挂载** `render` ⇒ render 可按「row 是真实行」读嵌套字段。⚠️ 列**命名插槽**（`#<prop>`）保持 EP 原生语义、不做此拦截
- `TableColumnDefaultScope` / `TableColumnHeaderScope` / `TableColumnComponentProps`：组件 props 版把 `$index` 改 `_index`（`$` 开头属性 vue 报错）
- `TableToolbarConfig<T,SQ,F>`：`showRefresh?`/`showAutoRefresh?`（默认均 true）、`exportByFe?`（默认 true，前端 fetchListAll + exportCSV）、`exportFn?`（exportByFe=false 时必传）、`exportColumns?`（ExportColumnConfig，不传则不显示导出按钮）、`leftExtraButtons?`/`rightExtraButtons?`（均默认 `[]`）
- `ToolbarButtonConfig`：`ActionBtnConfigItem<ToolbarButtonContext>` 别名——`key`/`actionBtnProps`/`props`/`label`/`render`/`show`
- `ToolbarButtonContext`：`{tableExpose, loading, exportContext, selectedList, pagination}`
- `TableExportContext<T,SQ,F>`：`{columns(prop+label), selectedList, currentPageList, api, query?, total, hasSelection}`
- `TablePageInfo`：`{pageSize, currentPage, total}`；`ExportType`：`"selected"|"current"|"all"`
- `TableInstance`：el-table 实例 Pick 子集

## 反模式 / 注意

- **`headerColor` 勿用**：@deprecated，样式已注释无实际效果
- **`fillHeight` 需高度基准**：必须已有 maxHeight 或 refine+viewportHeight 基准，否则撑高无据
- **keepAlive 页返回刷新**：core 内置（onActivated refresh 留页码），app 侧 [MUST NOT] 补偿（双重请求反模式）
- **`skeleton` 只覆盖冷启**：热刷不出骨架（外层遮罩盖旧数据），勿误判为骨架失效
- **customView 需配套插槽**：`customView=true` 显式切 DataListView 时 [MUST] 配 `#custom-view-item` 插槽，否则无渲染
- **组件 props 版列 scope 是 `_index`**：`$index` 仅插槽 scope 可用；组件 props 版 `$` 开头属性 vue 报错
- **[MUST NOT] 从外面给 `.dc-table-main` 刷 padding / 背景**：面归组件自持，外面刷会让内呼吸游离在高度账之外（这正是被修掉的老毛病）。要关面用 `:surface="false"`
- **TableSkeleton / TableToolbar / ToolbarButtons 是内部件**：index.ts 不导出，[MUST NOT] 外部直接消费；对外只认 `TableMain` + types/constants

## 面与面不叠（`itemCard`）

项自带卡片时，容器**只撤面色、不撤呼吸与圆角**：

```
容器面（--el-bg-color） + 卡片面（--el-bg-color） = 同一个色
⇒ gap 漏出的就是与卡片同色的容器面，视觉上「一整片白 + 若干 1px 细框」
```

- 判据 `itemCard`：`TableMain` 缺省跟随 **`customView`**（该态下内层 `DataListView` 的 `card`
  默认开）、`DataGridView` 缺省跟随 **`card`**、`InfiniteListView` 缺省 **`false`**
  （它没有内置卡壳、卡由消费方自画，core 无从判断 ⇒ 自画卡时 [MUST] 显式传 `itemCard`）。
- 🔴 判据 [MUST NOT] 收窄成「`card === true`」—— 那会整条漏掉 `InfiniteListView`。
- 🔴 **撤色不撤呼吸**：呼吸计入高度账（`surfacePad` 与可用高扣减同源），
  一并撤会连带改 refine 的 reserve、整页溢出。
- 阴性：`card: false` / `itemCard: false` 时容器**照常出面**（别把非卡片态的面一起干掉）。

## 关联

- 组合页：`ListLayout`（list-layout 族，内部 FormSearch + TableMain，常用配置提升为直属 prop，TableMain 恒收 `refine=false`）
- 列表接口模型：`APP_API_LIST_MODEL_KEY_CONFIG`（core config 单源，api 参数/结果类型由它推导）
- 高度链：`refine` + `viewportHeight`/`parentChannel`（SCOPE_VIEWPORT_MAX_HEIGHT scope 链，见 modal 族 ModalConfirm 的 `modalReserve`）
- 常量：`TABLE_COLUMN_KEY_OPERATE = "OPERATE"`、`TABLE_COLUMN_KEY_SELECTION = "SELECTION"`（index.ts 导出）
- 范式页：`apps/reference/src/pages/data/table/toolbar/`、`apps/reference/src/pages/data/table/skeleton/`、`apps/reference/src/pages/layout/list-layout/guide/`

## 内部契约整理（30mf7k 第一批）

分页协议从底座 `types/list-api.ts` 单一定义，原类型名、泛型默认值与 KEY_CONFIG 推导保持不变。CSV 导出列的 prop/label/type 使用底座协议；表格列仍兼容该协议。

## 数据层内部依赖（30mf7k / 3a7k02）

工具栏、空态、骨架、列常量与共享类型由 `table/shared` 内部桶提供；TableMain 与 DataGridView 单向消费它。共享契约定义在 `table/data-types.ts`，`table/types.ts` 保留 TableMainProps 并兼容转出；旧 table 入口与包根公开 API 不变，消费方仍从包根 import。组件、样式原位，本次不新增能力。既有 toolbar、skeleton、custom-view、grid 与 list-layout/guide 演示用于回归。

> 目录迁移：实现与配套收纳到 `components/data/table-main`，包根 API 与演示能力保持。

## Bridge 事件（v0.35.0）

通过 `useBridgeReport` 按需报告；无订阅且 signal 镜像关闭时不求值载荷。单行选择依次发 `table-selection-change {count}` → `table-row-select {rowKey,selected}`；全选/全不选只发聚合数量，不逐行展开。rowKey 保持已有行键解析语义。

`clearSelection`、刷新与数据替换均不报告选择埋点，原业务 selectionChange 回调保留。显式 toggle API 属选择操作（TableMain 的 EP toggleRowSelection 依 EP 契约不发 select，因此只保留业务回调）；没有“抑制下一次”的跨操作标志。

表格模式仅由 TableMain 发选择事件；customView 模式仅由 DataListView 发 dataview 事件。分页器用户改页/容量分别发 `table-page-change {currentPage}` / `table-size-change {pageSize}`；初始化与程序性回页不发。`table-scroll {scrollTop,scrollLeft}` 取表格滚动容器的最后位置，每帧最多一次、无 leading；没有采集需求不加监听，失活、卸载、退订、切换视图或替换滚动目标取消待发帧。已有 Element Plus 回调透传不变。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-data`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
