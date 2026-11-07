# InfiniteListView（通用无限滚动容器）

> 受控无限滚动 + 虚拟列表容器：**不自持数据获取**——接收存量数据 + 加载状态，滚动到底触发 `load-more`，底部按状态渲染（加载中 / 错误+手动重试 / 到底提示）。
> 通用原语：不依赖 table / list-layout 语境，任何「存量 + 无限滚动 + 虚拟列表」场景独立使用（纯列表流、聊天流、网格底座等）。
> 范式页：`apps/reference/src/pages/data/data-view/grid/`（经 DataGridView 组装的网格形态）
> 类型：data-view 族公共组件（进 core 顶层 export）

## 定位

- **何时用**：需要「数据存量 + 滚动到底加载 + 虚拟列表渲染」的列表/流式场景；作为 `DataGridView` 的网格渲染底座
- **何时不用**：分页形态用 `TableMain`；仅当前页数据渲染用 `DataListView`
- **受控组件**：`data`（存量）与 `loading / loadingMore / error / finished`（状态）均由外部传入；滚动到底发 `load-more`，错误点击发 `retry`，下拉刷新发 `refresh`——**数据状态机由外部（通常是数据容器）持有，本组件只管滚动触发 + 状态展示 + 虚拟化**
- 泛型 `<T>`：行/项数据类型
- 虚拟化：`@tanstack/vue-virtual` 单轴虚拟化（动态高经 measureElement 自动测量），只渲染可见项

## 快速上手（最小可用）

```vue
<InfiniteListView
  :data="store"
  item-key="id"
  :loading="loading"
  :loading-more="loadingMore"
  :error="error"
  :finished="finished"
  @load-more="fetchNextPage"
  @retry="fetchNextPage"
>
  <template #item="{ item, index }">
    <div>{{ index }}: {{ item.name }}</div>
  </template>
</InfiniteListView>
```

**要点**：

- `data` / `itemKey` 必传；滚动到底（哨兵进入视口）且非 loading/loadingMore/error/finished 时发 `load-more`
- 错误态底部显示 `error` 内容 + 「点击重试」→ 发 `retry`；`finished` 时底部显示 `endText`（默认"我是有底线的"）
- `#item` 缺省时兜底渲染 `JSON.stringify(item, null, 2)`——**仅调试兜底，生产必传 `#item`**

## 能力边界 / 按需使用

- **默认即够用：滚动触发 + 底部三态（加载/错误重试/到底）+ 虚拟化 + 内置卡壳全内置**——只传 `data` / `itemKey` / 状态 + 监听 `load-more` 即得无限滚动卡片列表。
- **`card`：默认 `true`**（内置卡壳：面 + 圆角 + 1px 边框 + 内呼吸，全走 token）。
  自画卡片视觉时传 `false` 关掉，[MUST NOT] 在自己的卡上再画一层边框叠上去。
- `estimateSize`：默认 200px 预估行高，虚拟化按实际测量自动校准；项高差异大时可调小/调大优化滚动条精度。
- `maxHeight`：默认 `undefined`（自然高度，撑开父容器）；限高滚动时传容器最大高（内部 `overflowY: auto`）。
- `pullRefresh`：默认关；开启后支持触摸下拉刷新（touch 三事件 + 顶部刷入指示器）→ 发 `refresh`。桌面 Web 常规用外部刷新按钮/自动刷新，[MUST NOT] 依赖手势。
- `#error` / `#end` / `#loading-more` 插槽可覆写底部各态默认渲染。
- `#empty`：`data` 为空时显示（默认 `<el-empty />`）。

## item 间距（`itemGap`，缺省 = 模块档）

**间距是列表的固有属性，不是某个形态的附属品**（zc6ptn）—— 故缺省值取间距阶梯的
**模块档**（`APP_LAYOUT_GAP_CONFIG.size × 密度 × 1`，默认 8），而不是 `0`。
解析走 data-view 族的 `useDataViewGap`，与 `DataListView` 的 `gap` **同一个函数**
⇒ 「同源同值」是构造保证，不是两处碰巧写了同一个表达式。

🔴 **[MUST] 透传给虚拟器（`gap`），[MUST NOT] 改用项自身的 `margin`**：
`measureElement` 量的是 borderBox、**吃不到 margin** ⇒ 总高会短一截、滚到底提前停。
（这与 `DataListView` 不成网格时走 margin 不矛盾：那条路径没有虚拟化、
父盒直接按块级流累高。）

⚠️ 这是一次**可见变更**：此前缺省是 `0`（贴在一起）。要贴合的消费方 [MUST] 显式传 `:item-gap="0"`。

ℹ️ `DataGridView` **不受影响** —— 它一直显式下发（非瀑布流传 `0`，行与行的间距由
每行自己的 `padding-bottom` 承担；瀑布流传 `gridGap`）。

## 内置卡壳（`card`，默认开）

上拉加载的三条路径此前**只有它没有卡壳**（`TableMain` 的 `customView` → `DataListView`、
`DataGridView` 都是 `hn3kzp` 那批做的、默认即开）。而本组件**在 core 顶层 export**、
app 也有独立范式页直接用它 ⇒ **缺口对下游可见**，不是「它只是 `DataGridView` 的内部引擎」。

壳落在每项外层的 `.infinite-list-view__row` 上（虚拟项容器，`measureElement` 量的是
borderBox ⇒ 壳的 padding / border **计进项高**，总高与落位自动正确）。

🔴 **取值与另两条路径同源**：面 / 圆角 / 边框取自共享 less mixin `card-shell.less`，
内呼吸取间距阶梯**呼吸档**（`useDataViewGap().cardPad`）。
[MUST NOT] 另写一套 —— 本仓已因「第二来源」栽过（`--dc-core-content-gap` 被明令废掉，
它与 gap 各随不同轴变动，最松密度档出现「卡内 20 ≥ 外圈 20 > 卡间 8」的乱序）。

⚠️ **这是一次可见变更**：自画卡片的下游会**多出一层边框**。出口 = `:card="false"`。

ℹ️ `DataGridView` **不受影响**：它的卡壳落在自己的 `__cell` 上，
内层本组件由它显式传 `:card="false"`（否则整行会被再套一层壳）。

## 占位块自己成卡（空 / 加载 / 错误）

卡片态下容器**不铺面**（`itemCard` ⇒ 面与面不叠）。这条判据在**有项**时成立，
**没有项时没有「项自带的卡片」来接替，面的责任无人接** ——
于是「暂无数据」直接浮在页面灰底上，整块区域没有任何面。

⇒ 空 / 加载 / 错误三态共用的 `.infinite-list-view__empty` **自己成卡**
（面 / 圆角 / 内呼吸，**与卡壳同源**）。**占位块在视觉上扮演的正是那张缺席的卡**。
（无数据时的错误 + 重试也走 `#empty` 槽 ⇒ 一处修覆盖三态。）

🔴 **[MUST NOT] 改走「空态时把容器的面开回来」**：那会让数据由空变非空时
**面闪一下消失**，是新引入的问题；且「项自带卡片 ⇒ 容器不铺面」这条判据本身是对的，
不该为空态把它改成跟数据走。

**最大宽度**：`max-width: calc(100% - 模块档 × 2)`，**仅在 `surfacePad === 0` 时生效**
（`surface` 关档，如置于 `ModalConfirm` 正文）—— `surface` 开时容器已有呼吸档内缩，
再加就是双重内缩。

ℹ️ **底部三态条（加载更多 / 错误重试 / 到底）不套卡**：它们出现在**已有卡片之下**，
是尾随的状态行，不是「缺席的那张卡」的替身。

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

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（泛型 `T` 行/项）

| name               | type                                                    | 默认                   | 语义                                                                                                                                                                               |
| ------------------ | ------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`             | `T[]`（必传）                                           | —                      | 存量数据（累加结果，外部持有）                                                                                                                                                     |
| `itemKey`          | `Extract<keyof T,string> \| ((item:T)=>string)`（必传） | —                      | 虚拟项唯一键                                                                                                                                                                       |
| `loading`          | `boolean`                                               | `false`                | 首次加载中（底部显示加载占位）                                                                                                                                                     |
| `loadingMore`      | `boolean`                                               | `false`                | 加载更多中（底部显示加载占位，禁止重复触发）                                                                                                                                       |
| `error`            | `Error \| string \| null`                               | `null`                 | 错误信息；非空时底部显示错误 + 重试（发 `retry`，手动点击才重新加载）                                                                                                              |
| `finished`         | `boolean`                                               | `false`                | 是否到底（hasMore=false）；true 时底部显示 `endText`                                                                                                                               |
| `loadMoreDistance` | `number`                                                | `100`                  | 哨兵提前量（px）：距容器底部此距离内即触发 `load-more`                                                                                                                             |
| `endText`          | `string`                                                | `"我是有底线的"`       | 到底提示文案                                                                                                                                                                       |
| `errorText`        | `string`                                                | `"加载失败，点击重试"` | 错误重试文案                                                                                                                                                                       |
| `estimateSize`     | `number`                                                | `200`                  | 虚拟项预估高（px），按实际测量自动校准                                                                                                                                             |
| `overscan`         | `number`                                                | `5`                    | 视口外预渲染项数（防快速滚动白屏）                                                                                                                                                 |
| `maxHeight`        | `number`                                                | `undefined`            | 传入时容器限高滚动（内部 `overflowY: auto`）                                                                                                                                       |
| `pullRefresh`      | `boolean`                                               | `false`                | opt-in 触摸下拉刷新（默认关；开启后 touch 手势触发 `refresh`）                                                                                                                     |
| `card`             | `boolean`                                               | **`true`**             | 内置卡壳（落在 `.infinite-list-view__row` 上）。与另两条卡片路径**同一份取值**                                                                                                     |
| `lanes`            | `number`                                                | `1`                    | 虚拟化列数（>1 即**瀑布流装箱**，由 virtual-core 的 `lanes` 算列位与 y）                                                                                                           |
| `laneGap`          | `number`                                                | `0`                    | 多列时的**列间距**（px，横向）；纵向间距走 `itemGap`                                                                                                                               |
| `itemGap`          | `number`                                                | **模块档（默认 `8`）** | 同列相邻项的**纵向间距**（px）。缺省取间距阶梯模块档，与 `DataListView` 的 `gap` **同一个解析口**（`useDataViewGap`）。透传 virtual-core 的 `gap` ⇒ 总高与位置都正确。要贴合传 `0` |

### Emits

| 事件        | 载荷 | 语义                                                                   |
| ----------- | ---- | ---------------------------------------------------------------------- |
| `load-more` | 无   | 滚动到底（哨兵进入视口）且非 loading/loadingMore/error/finished 时触发 |
| `retry`     | 无   | 底部错误「点击重试」触发                                               |
| `refresh`   | 无   | 下拉刷新触发（仅 `pullRefresh` 开启时）                                |

### Slots

| 槽              | scope                                                   | 语义                                                                         |
| --------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `#item`         | `{ item: T, index: number }`                            | 单项渲染；缺省兜底 `JSON.stringify(item, null, 2)`（**仅调试用，生产必传**） |
| `#error`        | `{ error: Error \| string \| null, retry: () => void }` | 底部错误态（默认：errorText + 重试按钮）                                     |
| `#end`          | 无                                                      | 底部到底提示（默认：`endText`）                                              |
| `#loading-more` | 无                                                      | 加载中占位（默认：loading 文案 + 图标）                                      |
| `#empty`        | 无                                                      | 空数据（默认 `<el-empty />`）                                                |

### Expose

`scrollTo(index: number)`（滚动到第 index 项）、`reset()`（重置：清虚拟缓存 + 回顶）。

## 反模式 / 注意

- **受控组件不自持数据**：`data` / 状态均由外部传入，[MUST NOT] 期待组件内部取数；数据累加 / hasMore 判断是**数据容器**（如 DataGridView）的职责
- **`#item` 缺省 JSON 是调试兜底**：生产 [MUST] 传 `#item`；JSON 兜底 [MUST NOT] 当正经渲染
- **`pullRefresh` 默认关**：桌面 Web 无手势语境，[MUST NOT] 依赖下拉刷新手势；用刷新按钮/自动刷新
- **触发防抖**：`load-more` 在 loading/loadingMore/error/finished 任一态下不触发——外部 [MUST] 及时置 loading/loadingMore 防重复请求

## 面与面不叠（`itemCard`）

项自带卡片时，容器**只撤面色、不撤呼吸与圆角**：

```
容器面（--el-bg-color） + 卡片面（--el-bg-color） = 同一个色
⇒ gap 漏出的就是与卡片同色的容器面，视觉上「一整片白 + 若干 1px 细框」
```

- 判据 `itemCard`：`TableMain` 缺省跟随 **`customView`**（该态下内层 `DataListView` 的 `card`
  默认开）、`DataGridView` 缺省跟随 **`card`**、**`InfiniteListView` 自 v0.32.0 起也跟随 `card`**。
- ⚠️ **它此前缺省是 `false`**，理由是「本组件没有内置卡壳、core 无从判断」——
  `j8pwer` 把卡壳补上之后**那个理由消失了**，缺省 [MUST] 跟着改，
  否则出现「有卡壳 + 容器仍铺面」的面套面（正是 `p4wrtn` 刚修掉的那个）。
- 🔴 **撤色不撤呼吸**：呼吸计入高度账（`surfacePad` 与可用高扣减同源），
  一并撤会连带改 refine 的 reserve、整页溢出。
- 阴性：`card: false` / `itemCard: false` 时容器**照常出面**（别把非卡片态的面一起干掉）。

## 关联

- 数据容器：`DataGridView`（内部按 gridColumns chunk 行后喂本组件）
- 宿主容器：`TableMain`（分页容器，内部衍生品 `DataListView` 渲染当前页）
- 共享 hook：`useDataViewFieldMap`（列 → 稳定字段组件）
- 范式页：`apps/reference/src/pages/data/data-view/grid/`

> 目录迁移：实现与配套收纳到 `components/data/infinite-list-view`，包根 API 与演示能力保持。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-data`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。

## 无障碍语义（td1v4s）

根滚动区域默认 tabindex=0，键盘用户可进入区域滚动；原有 attrs 可覆盖，不改虚拟化/加载/重试契约。
