# DataGridView（网格数据容器）

> 对齐 TableMain 主 props 的**网格数据容器**：自持**存量累加**状态机（api + query + fetchNextPage + hasMore），内部复用 InfiniteListView（按 `gridColumns` chunk 行虚拟化）+ TableToolbar（存量上下文）+ 列配置驱动卡片渲染。
> 走「数据存量 + 虚拟列表」路径，**非分页**——无分页器，到底提示"我是有底线的"。
> 范式页：`apps/reference/src/pages/data/data-view/grid/`
> 类型：data-view 族公共组件（进 core 顶层 export）；**推荐经 `ListLayout` 门面使用**（`viewMode="grid"`），独立使用需自配上下文（与 TableMain 独立使用成本相同）

## 定位

- **何时用**：数据量大、需要滚动到底加载更多 + 卡片网格形态的列表页；经 `ListLayout` `viewMode="grid"` 接入
- **何时不用**：标准表格/分页用 `TableMain`（`viewMode="table"`）；仅当前页卡片渲染用 `TableMain` + `customView`（`DataListView`）
- **数据路径与 TableMain 不同构**：TableMain = 分页替换当前页；DataGridView = **存量累加**（滚动到底 append 下一页，直到 hasMore=false）。两者是两套数据状态机，故**不共存于同一组件内**——切换在 `ListLayout` 的 `viewMode` 层
- 泛型三参：`T` 行 / `SQ` 静态查询参数 / `F` 注入对象类型；`query` 变化时清空存量从第 1 页重新累加
- 内部结构：数据容器（本组件）→ InfiniteListView（IO 哨兵触发 + 虚拟化 + 底部三态）→ gridColumns 卡片网格
- **瀑布流本组件也有**（`masonry` + `estimateItemHeight` 同开同关）：虚拟化与瀑布流**不是天然冲突**（早期文档那个措辞偏强），两者共存**需要一个前提** —— **高度可预先计算**。给了逐项估高即走「算高 → 装箱 → 虚拟化」；不给则保持等高行。与 `DataListView`（分页路径、直接量高、零额外输入）是两套机制，见下「瀑布流」段

## 快速上手（最小可用）

经 `ListLayout` 门面（`apps/reference/src/pages/data/data-view/grid/`）：

```vue
<ListLayout
  v-model:view-mode="viewMode"
  :list="searchItems"
  :api="api"
  :columns="columns"
  row-key="id"
  :grid-columns="4"
>
  <template #custom-view-item="{ row, index }">
    <div class="card">{{ index + 1 }}. {{ row.name }}</div>
  </template>
</ListLayout>
```

直接使用（对齐 TableMain 三必传）：

```vue
<DataGridView
  ref="gridRef"
  :api="api"
  :columns="columns"
  row-key="id"
  :page-size-init="20"
  :grid-columns="4"
>
  <template #custom-view-item="{ row, index }"> ... </template>
</DataGridView>
```

**要点**：

- 三必传 `api` / `columns` / `rowKey`；`api` 收到 `query` 深合并 `page.page/page.pageSize`（键名 `APP_API_LIST_MODEL_KEY_CONFIG` 单源），返回 `TableApiResult<T>` 的 `items` + `page.totalRecord`；`hasMore` 由 `total` 与已累加量比较
- **每批** `pageSizeInit`（默认 20）条，滚动到底自动 append 下一页；`finished`（hasMore=false）底部显示"我是有底线的"
- 出错 → 底部错误原因 + 「点击重试」手动重发
- `#custom-view-item` 缺省时基于 `columns` 渲染朴素卡片（每列一行 `label: value`，render 走 `render`、非 render 走 `row[prop]`）——**只传 columns 即开箱出卡片**，插槽可覆盖
- keepAlive 返回刷新由 core 内置承担（onActivated 清空重拉）——[MUST NOT] app 侧再手写刷新信号

## 能力边界 / 按需使用

- **默认即够用：存量累加 + 滚动加载 + 错误重试 + 到底提示 + 虚拟化 + 工具栏 + refine 布局全开**——只传 `api`/`columns`/`rowKey` 即得标准网格页。
- **高度链三选一（同 TableMain 判据）**：`refine` 默认开；`maxHeight` 显式定高仅嵌定高容器时；`viewportHeight` 仅嵌套弹层消费外层 scope 时。
- **`maxHeight` 默认 `"100vh"`（满视口高）**：非 refine 且外部未显式传时兜底限高，容器内部滚动、杜绝无限顶开；数字 = px，字符串 = CSS 长度（"50vh" 等），外部认为有更合适的值直接显式传入覆盖。
- `fillHeight`：默认关；数据稀疏/为空时撑满、底部状态贴底时开。
- `gridColumns`：**定列数**等宽网格（默认 4），卡片自动填满格子（`repeat(gridColumns, 1fr)`）；消费方在 `#custom-view-item` 里只管卡片**内容**，宽度不用设。传**对象**则走 el-col span 制断点配置（24 栅格，对齐 FormSearch layout 心智）：`{ xs: 24, sm: 12, md: 8, lg: 6, xl: 4 }` = 1/2/3/4/6 列（列数 = 24 / span），未配断点回落 ≤ 当前断点最近一档。
- `pageSizeInit`：每批加载条数（对齐 TableMain 的 pageSizeInit"初始一次设置"机制，默认 20）；**批次固定，运行期不改**。
- `infiniteListProps`：InfiniteListView 配置透传（`distance` / `endText` / `errorText` / `pullRefresh` / `estimateSize` / `overscan` 等）。
- `skeleton`：默认开（冷启网格卡片骨架）。
- **空态双态**：非加载态空数据按 `api` 是否至少被调用过一次区分——从未调用（`initialSearch=false` 首屏）→「欢迎触发查询」；已调用无数据 → ElEmpty「暂无数据」。
- **激活刷新条件化**：`onActivated` 自动刷新仅「已发生过查询」后生效（`hasRequested` 自判），与 TableMain 同语义。
- **完整能力演示**：`apps/reference/src/pages/data/data-view/grid/`。

## 自持面（`surface`）

本组件**自己持有那块面**（面色 `--el-bg-color` + 内呼吸 + 圆角），不依赖外层容器
伸手来刷 —— 单独使用时观感一致。

🔴 **内呼吸计入可用高**：`surface` 开启时自身 padding 会从数据区可用高里扣掉。
样式与高度账在同一个组件内闭环，[MUST NOT] 退回「外层刷面、内层算高」——
那样每页恒漏一个 padding（甲方 2026-09-15 报障的根因）。

**弹窗内不二次成面**：置于 `ModalConfirm` 正文时经 `useContextDefaults` 自动取
`false`。亮色下面色与 overlay 同为 `#fff` 看不出区别，**暗色**下才会露出
「弹窗里凹下去一块」——[MUST NOT] 只用亮色验收。

⚠️ 只读**直系父**：弹窗正文里若隔了一层容器，[MUST] 显式传 `:surface="false"`。

**面只有一层**：内嵌的 `InfiniteListView` 恒 `surface=false`（面归本组件这一层），不进
`infiniteListProps` 白名单 —— 否则两层各自成面、呼吸叠两次（每侧 12+12）。网格上拉加载与网格分页两路的左右留白因此一致。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（泛型 `T` 行 / `SQ` 静态 / `F` 注入）

| name                        | type                                                                 | 默认               | 语义                                                                                                                                                                                                                                 |
| --------------------------- | -------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api`                       | `(params: TableApiParams<SQ>) => Promise<TableApiResult<T>>`（必传） | —                  | 列表请求；params = query 深合并 page.page/page.pageSize（键名 APP_API_LIST_MODEL_KEY_CONFIG 定）                                                                                                                                     |
| `columns`                   | `ElTableColumnProps<T,F>[]`（必传）                                  | —                  | 列配置数组（驱动默认卡片渲染）                                                                                                                                                                                                       |
| `rowKey`                    | `Extract<keyof T,string> \| ((row:T)=>string)`（必传）               | —                  | 行/卡唯一键                                                                                                                                                                                                                          |
| `query`                     | `SQ`                                                                 | —                  | 静态查询参数；变化时清空存量从第 1 页重新累加                                                                                                                                                                                        |
| `pageSizeInit`              | `number`                                                             | `20`               | 每批加载条数（批次固定，运行期不改）                                                                                                                                                                                                 |
| `gridColumns`               | `number \| Partial<Record<Breakpoint, number>>`                      | `4`                | 定列数（`repeat(N, 1fr)`）；对象 = el-col span 制断点配置（24 栅格，列数 = 24 / span，未配档回落更小档）。⚠️ **不支持** `DataListView` 那档 `{ min }` 流体列宽——本组件按列数 chunk 成等长行做虚拟化，流体列数是浏览器算的、JS 拿不到 |
| `gap`                       | `number`                                                             | 模块档（默认 `8`） | item 间距（px，横纵同值）。缺省取间距阶梯模块档，随 gap 基数与密度缩放。⚠️ **原写死 `12`**（呼吸档的值，档位用错），见 migrations                                                                                                    |
| `card`                      | `boolean`                                                            | `true`             | 内置卡壳（border/radius/padding）。**壳已从插槽 fallback 内移到 `.data-grid-view__cell`** ⇒ 给了 `#custom-view-item` 时也有壳。自带卡片视觉时关掉                                                                                    |
| `maxHeight`                 | `number \| string`                                                   | `"100vh"`          | 数据区最大高度；数字 px / 字符串 CSS 长度；默认满视口高（非 refine 兜底限高）                                                                                                                                                        |
| `refine`                    | `boolean`                                                            | `true`             | 精细化布局：无 maxHeight 时按 viewport 高减工具栏/底部得出数据区高                                                                                                                                                                   |
| `refineReduceHeight`        | `number`                                                             | `0`                | refine 模式预留高度减量                                                                                                                                                                                                              |
| `viewportHeight`            | `number`                                                             | —                  | 显式指定视口可用高（优先级最高）；缺省走 SCOPE_VIEWPORT_MAX_HEIGHT scope 链 + fallback 0（500 floor 兜底）                                                                                                                           |
| `parentChannel`             | `string`                                                             | —                  | 定向消费的祖先 scope 标识；setup 期快照                                                                                                                                                                                              |
| `fillHeight`                | `boolean`                                                            | `false`            | 数据滚动区 min-height 撑满可用高、底部状态贴底                                                                                                                                                                                       |
| `dataViewMaxHeightMinValue` | `number`                                                             | `500`              | 数据视口最大高最小值 floor 兜底                                                                                                                                                                                                      |
| `injectInfo`                | `F`                                                                  | —                  | 注入列作用域/卡片作用域的额外对象                                                                                                                                                                                                    |
| `skeleton`                  | `boolean`                                                            | `true`             | 冷启（首次无数据）网格卡片骨架                                                                                                                                                                                                       |
| `skeletonRows`              | `number`                                                             | 自适应             | 骨架卡片数                                                                                                                                                                                                                           |
| `initialSearch`             | `boolean`                                                            | `true`             | 挂载后是否立即触发初始化查询；false 时挂载不自动拉数（欢迎空态）                                                                                                                                                                     |
| `showToolbar`               | `boolean`                                                            | `true`             | toolbar 顶层开关                                                                                                                                                                                                                     |
| `toolbar`                   | `TableToolbarConfig<T,SQ,F>`                                         | —                  | toolbar 配置（按钮 / 刷新 / 自动刷新 / 导出）                                                                                                                                                                                        |
| `infiniteListProps`         | `InfiniteListViewConfig`                                             | —                  | InfiniteListView 配置透传（distance/endText/errorText/pullRefresh/estimateSize/overscan）                                                                                                                                            |

**v-model**：`isAutoRefresh`（boolean）、`refreshInterval`（number，秒）、`activeId`（`string | number | undefined`）/ `activeData`（行对象 | undefined）—— **「当前项」双 model**（= 用户点击/激活的那一条，[MUST NOT] 与勾选 selection 混同）。两者**同生同灭**：`activeId` 有值 ⇒ `activeData` 必有值且恒为**列表数据原样**；列表刷新后当前项不在新数据内 → 两者一并清空；外部写入不在列表内的 id → 忽略 + `console.warn`（不清空既有选中）。⚠️ `activeId` 的 `string` / `number` **两种都是一等公民**：出口值**保业务数据里的原始类型**（`rowKey` 为字段名时即 `row[rowKey]`，数字 id 出数字）；外部用另一种类型写入（如 `"1"` 对数字 id）同样命中——比对时内部统一 `String()` 归一，且**保留调用方写入的原值**不回写覆盖。点击卡片即设为当前项，卡片容器挂 `.is-active` 钩子类（视觉由消费方覆写）。⚠️ 该能力**止步于本组件**，[MUST NOT] 下沉 `InfiniteListView`——它的「一项」是网格**整行**（多张卡片），粒度是可滚动单元而非业务记录。

### Emits

| 事件             | 载荷            | 语义                                                                                                                                                 |
| ---------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pageChange`     | `number`        | **拉取下一页时触发**（载荷 = 新页码）                                                                                                                |
| `dataChange`     | `T[]`           | 存量数组变更                                                                                                                                         |
| `loadingChange`  | `boolean`       | 加载态变化                                                                                                                                           |
| `pageInfoChange` | `TablePageInfo` | 存量信息：`{pageSize, currentPage, total}`——**`currentPage` = 当前已最大拉取到第几页**（非"第几页数据"）；复用 TableMain 形状，ListLayout 转发零改动 |
| `pageSizeChange` | —               | **不触发**（批次大小固定，运行期不改）                                                                                                               |

### Slots

| 槽                  | scope                                                                                 | 语义                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#custom-view-item` | `DataListViewItemScope<T>`：`{fieldComponentMap, row, index, selected, toggleSelect}` | 网格卡片渲染；**缺省基于 columns 渲染朴素卡片**（每列 `label: value`，render 走 render / 非 render 走 `row[prop]`，`$type_selection` 勾选 / `$type_index` 序号） |
| `empty`（内部默认） | 无                                                                                    | 空数据——默认按 `hasRequested` 双态（未调用过 api → 欢迎触发查询；已调用无数据 → ElEmpty「暂无数据」）                                                            |

### Expose（`DataGridViewInstance`）

`refresh(silent?: boolean): Promise<unknown>`（清空存量重拉第 1 页）、`reload(silent?: boolean): Promise<unknown>`（回第 1 页重拉，同 refresh）、`getTableInstance(): TableInstance | undefined`（虚拟网格实例——选中/滚动能力对齐 TableInstance 子集，未实现方法为「not supported」抛错桩）。

## 瀑布流（`masonry` + `estimateItemHeight`，opt-in）

```vue
<DataGridView
  :api="api"
  :grid-columns="4"
  masonry
  :estimate-item-height="
    (row, columnWidth) => columnWidth * (row.coverHeight / row.coverWidth) + 72
  "
>
  <template #custom-view-item="{ row }"><SocialCard :row="row" /></template>
</DataGridView>
```

### 🔴 为什么要 `estimateItemHeight`（不是啰嗦）

虚拟化与瀑布流各自的硬需求撞在一起：

|          | 硬需求                                                        |
| -------- | ------------------------------------------------------------- |
| 虚拟列表 | **不渲染**也要知道每项的位置与总高（撑滚动条、算视口渲染谁）  |
| 瀑布流   | 第 N 张的 y = 它所在列的**累计高度** ⇒ 取决于前面所有卡的高度 |

⇒ 循环是「要装箱就得知道高度 → 要虚拟化就不能渲染 → 不渲染就量不到高度」。
**这个循环能打破，只要高度是【算出来】的而不是【量出来】的**
（masonic / Pinterest 走的都是这条）。
`DataGridView` 是通用容器、不知道你插槽里塞了什么 ⇒ 这个「算」只能由**你**提供。

⚠️ 早期文档说两者「天然冲突」，那个措辞**偏强了** ——
准确说法是**需要「高度可预先计算」这一前提**。

### 同开同关，[MUST NOT] 半开

`masonry` 与 `estimateItemHeight` **两者都给**才生效；只给其一 ⇒ **保持等高行**
（与本能力引入前逐字一致）。

🔴 `gridColumns` 取 **`{ min }` 流体档时恒不生效** —— 那条的列数是浏览器算的、
JS 拿不到，而装箱必须先知道列数。用**断点表**或**定列数**。

### `columnWidth` 由组件回传

`estimateItemHeight(row, columnWidth)` 的第二参是组件算好的**列宽**
（`(容器内容宽 − (列数−1) × 间距) / 列数`）。
🔴 断点解析在组件内部，**你算不出来** ⇒ [MUST NOT] 自己去猜容器宽。

### 估不准会怎样（[MUST] 知情）

估值只是**起点**：**渲染到的项会被量准**并替换掉估值
（virtual-core 的 `measureElement` → `itemSizeCache`）⇒ **不会长期留白**。

|                                         |                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| ✅ 卡片**不会**在量准后跳到另一列       | 列归属按估值定下来就缓存住（`laneAssignmentMode: "estimate"`）——换列比一点留白刺眼得多            |
| ⚠️ 视口**下方**未渲染项的位置会轻微浮动 | 上方项被量准后，同列后续项的 y 跟着微调。这是「估算 + 校准」的**固有代价**，[MUST NOT] 期待零跳动 |

⚠️ **最容易估偏的不是图、是文字区**（标题 1～3 行浮动）——
消费方实测栽过：估值偏大 ⇒ 每张卡底下多一截空白。
封面给 `aspect-ratio` 能让图那部分在加载前就定高，文字区按**最常见行数**估即可。

### 顺序仍是**行优先**

前 N 项（N = 列数）按 `i % N` 铺满第一行 ⇒ 第 1、2、3 条就在第一行；
之后每项落**当前最矮的那一列**。
🔴 [MUST NOT] 期待 CSS `columns` 那种**竖向填充**（1,2,3 落第一列）——
按时间 / 热度排序的列表会被打乱。

### 与 `DataListView` 的瀑布流是两套机制

|                | `DataGridView`（本组件，滚动路径）               | `DataListView`（分页路径）    |
| -------------- | ------------------------------------------------ | ----------------------------- |
| 虚拟化         | **有**                                           | 无                            |
| 高度从哪来     | **消费方算**（`estimateItemHeight`）+ 渲染后校准 | **直接量**（RO 量卡片实际高） |
| 消费方额外输入 | 需要                                             | **零**                        |

⇒ 数据量不大、走分页就够的场景用 `DataListView` 更省事；
要「上拉加载 + 瀑布流」两者兼得才用本条。

## 反模式 / 注意

- **只给 `masonry` 不给 `estimateItemHeight`**：[MUST NOT] 指望它半开 —— 虚拟化路径缺了「不渲染也知道多高」这个前提就装不了箱，会保持等高行
- **`gridColumns` 用 `{ min }` 流体档 + 瀑布流**：[MUST NOT]——流体档的列数是浏览器算的、JS 拿不到，装箱必须先知道列数
- **在 `estimateItemHeight` 里自己猜容器宽**：[MUST NOT]——`columnWidth` 由组件回传，猜的必然与断点解析脱钩
- **期待瀑布流零跳动**：[MUST NOT]——视口下方未渲染项会随上方项被量准而轻微浮动，这是「估算 + 校准」的固有代价（换来的是不会长期留白）

- **非分页形态**：[MUST NOT] 期待分页器 / 页码跳转；数据到底即停，无"下一页"按钮
- **批次固定**：`pageSizeInit` 运行期不改；`pageSizeChange` 不触发
- **`currentPage` 语义**：`pageInfoChange` 的 `currentPage` = 已拉最大页，消费方勿当"当前展示第几页"
- **动态切换**：`viewMode` 换载（v-if）天然回到第 1 页重新累加；「翻到底再切网格续拉断点」不在支持范围
- **独立使用成本**：不传 `toolbar`/搜索区时只有网格本体；完整列表页 [MUST] 走 `ListLayout`（搜索/头部/操作/粘性共享）
- **列插槽无 `#<column.prop>`**：网格卡片是"一卡多列"形态，非表格"一列一格"；卡片渲染走 `#custom-view-item` 或默认 column 配置

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

- 门面：`ListLayout`（`viewMode="grid"`；`viewMode="table"` 渲染 TableMain，内部 customView 切 ElTable/DataListView）
- 底座：`InfiniteListView`（内部复用：IO 哨兵 + 虚拟化 + 底部三态）
- 共享 hook：`useDataViewFieldMap`（列 → 稳定字段组件，与 DataListView 同源）
- 工具栏：`TableToolbar`（table 族内部件，经 `toolbar` prop 配置）
- 列表接口模型：`APP_API_LIST_MODEL_KEY_CONFIG`（core config 单源）
- 范式页：`apps/reference/src/pages/data/data-view/grid/`

## 数据层内部依赖（30mf7k / 3a7k02）

工具栏、空态、骨架、列常量与共享类型由 `table/shared` 内部桶提供；TableMain 与 DataGridView 单向消费它。共享契约定义在 `table/data-types.ts`，`table/types.ts` 保留 TableMainProps 并兼容转出；旧 table 入口与包根公开 API 不变，消费方仍从包根 import。组件、样式原位，本次不新增能力。既有 toolbar、skeleton、custom-view、grid 与 list-layout/guide 演示用于回归。

> 目录迁移：实现与配套收纳到 `components/data/data-grid-view`，包根 API 与演示能力保持。

## Bridge 事件（v0.35.0）

通过 `useBridgeReport` 按需报告；无订阅且 signal 镜像关闭时不求值载荷。单行选择依次发 `datagrid-selection-change {count}` → `datagrid-row-select {rowKey,selected}`；全选/全不选只发聚合数量，不逐行展开。rowKey 保持已有行键解析语义。

`clearSelection`、刷新与数据替换均不报告选择埋点，原业务 selectionChange 回调保留。显式 toggle API 属选择操作（TableMain 的 EP toggleRowSelection 依 EP 契约不发 select，因此只保留业务回调）；没有“抑制下一次”的跨操作标志。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-data`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。

## 无障碍 API（td1v4s）

选择列复用 column.label；缺省名称“选择第 N 项”，绑定到原生 checkbox。

## 请求失败反馈

首拉/刷新失败（同步 throw 或 reject）清空旧数据与总数，沿用错误/重试区展示默认「加载失败：<error.message>」；显式 infiniteListProps.errorText 仍优先。console.error 一次、不弹消息，下一次成功恢复。追加页失败保留已加载页与原重试机制。
