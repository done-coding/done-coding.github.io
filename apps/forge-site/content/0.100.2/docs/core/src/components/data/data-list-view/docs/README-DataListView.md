# DataListView（数据视图列表）

> 卡片/自定义渲染的列表视图：外部传入数据与列配置，无请求、无分页；TableMain `customView` 模式的渲染载体。
> **自带网格能力**：列数（断点表 / 流体）· item 间距 · 内置卡壳 · 瀑布流（opt-in）—— 消费方 [MUST NOT] 再手写 `:deep(.data-list-view){display:grid;…}`。
> 范式页：`apps/reference/src/pages/data/data-view/custom-view/Index.vue`
> ⚠️ 内部件：仅供 TableMain 内部 import，[MUST NOT] 对外导出（不进 core 顶层 export）

## 定位

- **何时用**：`TableMain` 的 `customView` 模式——自定义卡片视图替代标准表格渲染
- **何时不用**：标准表格用 `TableMain` / `ElTable`；DataListView 不直接对外消费
- 泛型 `<T, F extends Record<string, any>>`：行类型 / 注入上下文类型
- 数据契约：`data` 外部传入（当前页数据），组件无请求/分页逻辑
- **网格能力与 `DataGridView` 同源**：`gridColumns` 的断点语义**逐字一致**（共用 `resolveGridColumnsByBreakpoint`），
  [MUST NOT] 在本路径另造一套 —— 两套断点心智会让同一页切 viewMode 时列数跳
- 接线：TableMain `customView.value ? markRaw(DataListView) : markRaw(ElTable)`；ListLayout 转发 `#custom-view-item` 插槽（类型 `DataListViewItemScope<T>`）

## 快速上手（最小可用）

业务消费范式（经 TableMain `customView` 模式接入，`custom-view/Index.vue` 摘要）：

```html
<TableMain :customView="customView" :columns="columns" :api="api" rowKey="id">
  <template
    #custom-view-item="{ fieldComponentMap, row, index, selected, toggleSelect }"
  >
    <component :is="fieldComponentMap['name']" :row="row" :index="index" />
  </template>
</TableMain>
```

**要点**：

- `fieldComponentMap` 键规则：列 `prop` / `$type_index`（行号）/ `$type_selection`（选中框）；`type: "expand"` 跳过
- 字段组件经 `markRaw(defineComponent)`（name `"DataViewField"`，props `row` / `index` / `selected` / `toggleSelect`）产稳定组件，跨渲染不 remount
- 选中能力 `selectable` 开启后才有 `$type_selection` 键；选中变化走 `selectionChange`；`data` 引用变化（刷新）即清空选中

## 能力边界 / 按需使用

- **内部件不进顶层 export：仅供 TableMain 内部 import，[MUST NOT] 对外导出 / 全局注册 / install。** 业务 [MUST] 走 `TableMain` `customView` 模式消费——本组件无请求/分页，`data` 须外部传入（当前页数据），脱离 TableMain 直接消费没有数据来源。
- **`maxHeight` / `minHeight`：默认 `undefined`（自然高度）即够用。** 仅当限高滚动（`maxHeight` 传入容器 `overflowY: auto`）或配合 TableMain `fillHeight` 顶分页器到底（`minHeight`）才设。
- **`selectable`：默认 `false` 即够用。** 仅当卡片需要选中/批量操作能力才开——开启后才有 `$type_selection` 键。
- **`gridColumns`：默认 `undefined` = 不成网格**（单列流式，与本能力引入前一致）。要多列才传：
  数字 = 定列数；对象 = el-col span 制断点表（与 `DataGridView` 同语义）；`{ min: N }` = **流体列宽**
  （`repeat(auto-fill, minmax(Npx, 1fr))`，列数由容器宽自然得出，不需要断点表）。
- **`gap`：默认取间距阶梯的\*\*模块档\*\***（`APP_LAYOUT_GAP_CONFIG.size × 密度 × 1`，默认 8）。
  `grid` 的 gap 是**卡与卡之间** = 模块档的定义值，[MUST NOT] 在消费侧写死像素补偿。
  🔴 **与 `gridColumns` 正交**：不成网格（默认）时同样有纵向间距，见下「间距无条件存在」。
  要贴合传 `:gap="0"`。
- **`card`：默认 `true`**（内置卡壳：border + radius + padding，全走 token）。
  自带卡片视觉时传 `false` 关掉，[MUST NOT] 在自己的卡上再画一层边框叠上去。
- **`masonry`：默认 `false`**（瀑布流需要 JS 量高，按「需要 JS 就默认不开」的规则关着）。
- **`rowKey` / `columns` / `getRenderCtxParams` 必填契约**：行唯一键、列配置、列 render 上下文缺一不可。
- **完整能力演示**（选中框列 + 行号列 + 字段列 + 操作列全接线）：`apps/reference/src/pages/data/data-view/custom-view/Index.vue`——能力展示，非推荐默认。

## 当前项跟随滚动（`activeScroll`，默认开）

`activeId` 变化后把对应项滚进视口 —— 上/下一条导航、深链直达当前项等场景全靠它。

用 `nearest` 语义（`utils` 的 `domScrollIntoViewport`）：

- **已在视口内则零动作** —— 用户自己滚着看时点某项不会被拽走；
- 避免「越级滚动」：原生默认 `block: "start"` 会把整个页面滚了。

🔴 **瞬时而非 smooth**：这是**跟随**不是**导航**。本仓 `TabsTile` 自研 smooth 滚动
曾被 v-model 回流重渲染打断（真机复现），故此处 [MUST NOT] 默认 smooth。

关掉传 `:active-scroll="false"`。

## 网格能力（列数 / 间距 / 卡壳 / 瀑布流）

```html
<!-- 断点表：与 DataGridView 逐字同语义（24 栅格 span 制） -->
<TableMain
  :customView="customView"
  :custom-view-props="{ gridColumns: { xs: 24, sm: 12, md: 8, lg: 6 } }"
/>

<!-- 流体列宽：列数由容器宽自然得出（消费方 2026-09-02 拍板过的形态） -->
<TableMain :custom-view-props="{ gridColumns: { min: 189 } }" />
```

| `gridColumns` 形态       | 产出                                                            | 何时用                         |
| ------------------------ | --------------------------------------------------------------- | ------------------------------ |
| 不传（默认）             | 不成网格（单列流式）                                            | 普通列表                       |
| `number`                 | `repeat(N, 1fr)`                                                | 列数固定                       |
| `{ xs, sm, md, lg, xl }` | 按断点算列数（span 制，24 栅格；未配档回落 ≤ 当前断点最近一档） | 要按视口分档                   |
| `{ min: N }`             | `repeat(auto-fill, minmax(Npx, 1fr))`                           | **列数按容器宽流体**、不想钉死 |

🔴 **`{ min }` 这一档只有本组件有，`DataGridView` 没有** —— 它按 `gridColumns` 把存量
**chunk 成等长的行**做虚拟化，而流体档的列数是浏览器算的、JS 拿不到 ⇒ chunk 无从下手。
这是实现约束不是遗漏，[MUST NOT] 为「对齐」把它硬塞进 `DataGridView`。

### 间距无条件存在（与网格正交）

**间距是卡片列表的固有属性，不是网格的附属品**（zc6ptn，甲方口径：
「无论是否多列展示、是否瀑布流，都不影响其 gap 的存在」）。

| 形态                             | 间距由谁出                                         | 值           |
| -------------------------------- | -------------------------------------------------- | ------------ |
| 成网格（`gridColumns` 任一形态） | 容器的 grid `gap`                                  | `gap`        |
| **不成网格**（默认）             | **每项的 `margin-bottom`**（末项不下发）           | 同一个 `gap` |
| 瀑布流（`masonry`）              | 跨度里的 gap 分量（`ceil((卡高 + gap) / 行单位)`） | 同一个 `gap` |

三条路径**共用同一个值**，[MUST NOT] 另引第二个间距来源
（本仓已因此栽过：`--dc-core-content-gap` 与 gap 各随不同轴变动，
最松密度档出现「卡内 20 ≥ 外圈 20 > 卡间 8」的乱序，那个变量已被明令废掉）。

🔴 **不成网格时为何走 `margin` 而不是把容器改成 `flex` + `gap`**：
① 改 `display` 会连带改子项的布局语义（block → flex item），存量页面的可见变更面
远超「多出间距」；② `gap` 跨在盒**之间**、不计入 `clientHeight`，本仓在 `ViewLayout`
上栽过同一条（量不到 ⇒ 每页恒溢出一段）。

🔴 **末项不下发 margin**：块级流里末项的 `margin-bottom` 会与父盒底边折叠、**穿透出去**
—— 既量不到又推开后邻，与上面那条坑同形。故本组件只给「非末项」下发。

⚠️ 这是一次**可见变更**：此前不配 `gridColumns` 的页面是零间距。
「就是要贴着」的消费方 [MUST] 显式传 `:gap="0"`（阴性对照，出口有效）。

### 内置卡壳（`card`，默认开）

壳落在**已有的包裹层** `.data-list-view-item` 上（加 `is-card` 类），[MUST NOT] 另包一层：
DOM 层级恒定 ⇒ 消费方写的 `:deep()` 选择器不会随 prop 变；瀑布流的跨度也「量谁写谁」。

壳**只出面**（border / radius / padding，全走 token）。
`.is-active` / `.is-selected` **仍是空钩子** —— 本族的立场从「[MUST NOT] 写死卡片视觉」
**收窄为**「[MUST NOT] 写死**状态**视觉」，两句话不再打架。

### 空态占位自己成卡（v0.32.0）

卡片态下容器**不铺面**（面与面不叠）。判据在**有项**时成立，**没有项时没有
「项自带的卡片」来接替** ⇒「暂无数据」直接浮在页面灰底上。
⇒ `.data-list-view-empty` **自己成卡**（面 / 圆角 / 内呼吸，**与卡壳同源**）。

ℹ️ **本组件不加 `max-width` 内缩**（`InfiniteListView` 那侧有）：它的内缩由宿主
`TableMain` 的自持面 padding 给，而本组件**看不到那份 padding** ——
自己再加一层就是双重内缩，且无从判断该不该加。

### 瀑布流（`masonry`，默认关）

开启后走 `grid-auto-rows: <行单位>` + 每项 `grid-row-end: span N`（N 由实测卡高算），
**顺序仍是行优先（横向）** —— 这正是纯 CSS `columns` 做不到的那点（它竖着填，
按时间/热度排的列表会被打乱）。

- **需要 JS ⇒ 默认关**（规则：需要 JS 就默认不开）。
- 与 `gridColumns` 的 `{ min }` / 断点表都能叠。
- **与 `DataGridView` 的瀑布流是两套机制**（都提供，但前提不同）：
  本条（分页路径）**没有虚拟化** ⇒ 可以**直接量**卡片实际高，消费方零额外输入；
  `DataGridView`（滚动路径）是虚拟化的 ⇒ 必须**先算**，故要消费方给 `estimateItemHeight`。
  ⚠️ 两者**不是「一个能一个不能」** —— 早期文档说「天然冲突」措辞偏强，
  准确说法是后者**需要「高度可预先计算」这一前提**。
- 量不到高度时每项退**兜底跨度**（CSS 给的），表现为「不够好看」而**不会重叠**——
  增强失败 [MUST NOT] 变成布局坏掉。
- **0 条时不铺轨道**：空态按非瀑布流形态完整显示（否则空态占位只占一条行单位轨道、被裁成一条缝）。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name                 | type                                                                              | 默认               | 语义                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`               | `T[]`（必填）                                                                     | 无                 | 当前页数据，外部传入，组件无请求/分页逻辑                                                                                                                |
| `rowKey`             | `Extract<keyof T, string> \| ((row: T) => string)`（必填）                        | 无                 | 行唯一键：键名或函数，内部统一 String 化                                                                                                                 |
| `columns`            | `DataViewColumn<T>[]`（必填）                                                     | 无                 | 列配置（Pick 自 ElTableColumnProps 的 `prop` / `label` / `type` / `render`），内部归一为 `fieldComponentMap`                                             |
| `maxHeight`          | `number`                                                                          | `undefined`        | 传入时容器 `overflowY: auto` 限高滚动                                                                                                                    |
| `minHeight`          | `number`                                                                          | `undefined`        | 传入时撑满至此高（配合 TableMain `fillHeight` 顶分页器到底）                                                                                             |
| `gridColumns`        | `number \| Partial<Record<Breakpoint, number>> \| { min: number }`                | `undefined`        | 列数：数字 = 定列数；对象 = el-col span 制断点表（与 `DataGridView` 同语义）；`{ min }` = 流体列宽 `repeat(auto-fill, minmax(Npx,1fr))`。不传 = 不成网格 |
| `gap`                | `number`                                                                          | 模块档（默认 `8`） | item 间距（px）。缺省取间距阶梯模块档，随 gap 基数与密度缩放。**与 `gridColumns` 正交**：不成网格时走每项 `margin-bottom`、同值                          |
| `card`               | `boolean`                                                                         | `true`             | 内置卡壳（border/radius/padding，走 token；落在 `.data-list-view-item` 上）。自带卡片视觉时关掉                                                          |
| `masonry`            | `boolean`                                                                         | `false`            | 瀑布流装箱（需要 JS 量高，故默认关）。顺序仍行优先                                                                                                       |
| `selectable`         | `boolean`                                                                         | `false`            | 启用选中能力                                                                                                                                             |
| `getRenderCtxParams` | `() => Pick<TableColumnDefaultScope<T, F>, "injectInfo" \| "exposeInfo">`（必填） | 无                 | 列 render 上下文（必填契约）                                                                                                                             |

### v-model

| 名           | type                            | 语义                                                                                                                                                                                                                                                                                              |
| ------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activeId`   | `string \| number \| undefined` | **「当前项」唯一键**（= 用户点击/激活的那一条；[MUST NOT] 与勾选 `selected` 混同）。点击任一项即写入。`string` / `number` 两种都是一等公民：出口值**保原始类型**（`rowKey` 为字段名时即 `row[rowKey]`，数字 id 出数字），外部用另一种类型写入也命中（比对内部 `String()` 归一，且保留调用方原值） |
| `activeData` | `T \| undefined`                | 当前项对应的**列表数据原样**。与 `activeId` **同生同灭**：`activeId` 有值 ⇒ 本值必有值；`data` 刷新后当前项不在新数据内 → 两者一并清空；外部写入不在 `data` 内的 id → 忽略 + `console.warn`（不清空既有选中）                                                                                     |

### Emits

| 事件              | 载荷        | 语义                                   |
| ----------------- | ----------- | -------------------------------------- |
| `selectionChange` | `rows: T[]` | 选中项变更（勾选语义，与 active 无关） |

### Slots

| 槽       | scope                                                                                                                      | 语义                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `#item`  | `DataListViewItemScope<T>`（`fieldComponentMap` / `row` / `index` / `selected` / `toggleSelect` / `active` / `setActive`） | 单项渲染（customView 卡片内容）。`active` = 是否当前项、`setActive()` = 设为当前项（等价点击该项） |
| `#empty` | 无                                                                                                                         | 空态（默认 `<el-empty />`，消费方可覆写）                                                          |

### Expose（`DataListViewInstance` = TableInstance 对齐）

实际实现 5 个：`clearSelection` / `getSelectionRows` / `toggleRowSelection` / `toggleAllSelection` / `columns`。

其余 10 个方法（`toggleRowExpansion` / `setCurrentRow` / `clearSort` / `clearFilter` / `doLayout` / `sort` / `scrollTo` / `setScrollTop` / `setScrollLeft` / `updateKeyChildren`）经 utils 填「not supported」抛错桩——调用即抛错，勿依赖。

## 反模式 / 注意

- **不对外导出**：本组件 [MUST NOT] 对外导出 / 全局注册 / 提供 install 插件；消费方 [MUST] 走 `TableMain` `customView` 模式
- **无请求/分页**：`data` 须外部传入（当前页数据），勿期待组件内部取数
- **刷新清选中**：`data` 引用变化即清空选中——跨页 / 刷新后选中状态不保留
- **未实现方法抛错**：Expose 面与 TableInstance 对齐但 10 个方法为「not supported」桩（表格特有行为在自定义视图无意义）——含 `setCurrentRow`，故 TableMain 在 `customView` 态 [MUST NOT] 调它同步高亮（active 由本组件自持）
- **`.is-active` / `.is-selected` 是空钩子类**：本族 [MUST NOT] 写死**状态**视觉，选中 / 当前项的样式由消费方覆写。
  ⚠️ 这条立场 2026-09-17 **收窄过**：内置卡壳（`card`，默认开）只出**面**（border/radius/padding），
  状态视觉仍是空钩子 —— [MUST NOT] 拿旧话「不写死卡片视觉」去否掉卡壳，也 [MUST NOT] 反过来在钩子里写死状态色
- **列键依赖归一规则**：消费 `fieldComponentMap` 只用 `prop` / `$type_index` / `$type_selection` 三系键，`type: "expand"` 列不产出

## DataListViewItem（列表项容器）

由 DataListView 内部 `v-for` 使用的列表项容器；消费方一般不直接使用。

### Props

| name       | type              | 默认        | 语义                                                                                                                                                     |
| ---------- | ----------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `selected` | `boolean`（必填） | 无          | 是否选中（勾选语义，由 DataListView 传入）→ `.is-selected`                                                                                               |
| `active`   | `boolean`         | `false`     | 是否为「当前项」（active，与勾选无关）→ `.is-active`                                                                                                     |
| `card`     | `boolean`         | `false`     | 是否套内置卡壳 → `.is-card`（border/radius/padding 走 token）。由 `DataListView` 下发，默认值以它为准                                                    |
| `spanRows` | `number`          | `undefined` | 瀑布流跨度（`grid-row-end: span N`）；仅 `masonry` 开启时由 `DataListView` 下发                                                                          |
| `flowGap`  | `number`          | `undefined` | **不成网格时的纵向间距**（`margin-bottom`）；由 `DataListView` 按「非末项 且 不成网格」条件下发，成网格时恒 `0`（间距归 grid 的 `gap`，[MUST NOT] 叠加） |

### Emits / Expose

无

### Slots

| 槽         | scope | 语义   |
| ---------- | ----- | ------ |
| `#default` | 无    | 项内容 |

### 定位注释（.vue 头）

- 承载选中 / 当前项 class 钩子 + 可选卡壳（`card`）+ 项内容插槽
- [MUST NOT] 写死**状态**视觉（`.is-active` / `.is-selected` 归消费方）；卡壳只出面，不碰状态
- [MUST NOT] 内置选中状态机

## 关联

- 宿主：`TableMain`（table 族，`customView` 模式）；`ListLayout`（转发 `#custom-view-item`）
- 内部件：`DataListViewItem`（本文件上文）
- 类型：`DataViewColumn<T>` / `DataListViewItemScope<T>`（data-view types.ts）
- 范式页：`apps/reference/src/pages/data/data-view/custom-view/Index.vue`

> 目录迁移：实现与配套收纳到 `components/data/data-list-view`，包根 API 与演示能力保持。

## Bridge 事件（v0.35.0）

通过 `useBridgeReport` 按需报告；无订阅且 signal 镜像关闭时不求值载荷。单行选择依次发 `dataview-selection-change {count}` → `dataview-row-select {rowKey,selected}`；全选/全不选只发聚合数量，不逐行展开。rowKey 保持已有行键解析语义。

`clearSelection`、刷新与数据替换均不报告选择埋点，原业务 selectionChange 回调保留。显式 toggle API 属选择操作（TableMain 的 EP toggleRowSelection 依 EP 契约不发 select，因此只保留业务回调）；没有“抑制下一次”的跨操作标志。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-data`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。

## 无障碍语义（td1v4s）

根滚动区域默认 tabindex=0，键盘用户可进入区域滚动；原有 attrs 可覆盖，不改选择/激活和布局契约。
