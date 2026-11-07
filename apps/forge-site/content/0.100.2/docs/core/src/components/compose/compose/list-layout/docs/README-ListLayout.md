# ListLayout（列表页）

> 「FormSearch + TableMain」组合页：一个组件承接搜索、列表、分页、工具栏、粘性吸附全链路。
> 范式页：`apps/reference/src/pages/layout/list-layout/guide/`（最佳实践）、`pages/layout/list-layout/sticky/`（粘性）、`pages/layout/list-layout/module-demo/`（keepAlive 模块组合）

## 定位

- **空间一等公民**：列表空间首选（搜索 + 表格 + 分页 + 粘性全链路），常规列表页 [MUST] 用它
- **何时用**：标准列表页（搜索 + 表格 + 分页 + 操作列），是最常用页面骨架
- **何时不用**：纯表格（无搜索）用 `TableMain`；纯搜索表单用 `FormSearch`
- 内部组合：`FormSearch`（搜索区）+ `TableMain`（表格区），props 按「表单侧 / 表格侧」双子配置扁平化，常用项提升为直属 prop
- ⚠️ 换名兼容：`ListPage` → `ListLayout`（v0.20.0 breaking）。旧名 `ListPage` / `ListPageProps` / `ListPageInstance` 保留为 deprecated 兼容别名，根容器旧类 `list-page` / `dc-list-page` 继续保留——新代码一律用新名（详见 `migrations/v0.20.0.md`）

## 快速上手（最小可用）

配置面（`guide/config.tsx` 范式 A 摘要——标准列表页最低配置，默认行为即够用）：

```tsx
const listPageConfig = {
  api: userListApi, // 列表取数（TableApiParams / TableApiResult 契约）
  list: userSearchFormList, // 搜索表单配置（FormItemConfigList）
  columns, // 列配置（ElTableColumnProps 超集，render 三态）
  rowKey: "id",
  injectInfo, // 自定义只读上下文，列 render 里 scope.injectInfo 消费
};
```

挂载 + 注入触发（`module-demo/list/Index.vue` 最小闭环）：

```ts
import { ListLayout } from "@done-coding/forge";
import type { ListLayoutInstance } from "@done-coding/forge";
const listPage = ref<ListLayoutInstance>();
const { listPageConfig } = useSpaceConfig({
  goDetail: (id?: number) =>
    router.push({
      path: "/layout/list-layout/module-demo/detail",
      query: id === undefined ? {} : { id: String(id) },
    }),
  reloadList: () => listPage.value?.reload(), // 增删改成功后触发
});
```

```html
<AppPage>
  <ListLayout ref="listPage" v-bind="listPageConfig" />
</AppPage>
```

**要点**：

- `staticQuery` 是扁平 prop，**禁放 `formSearchProps` 内**（类型已 Omit）
- keepAlive 返回刷新由 core 内置承担（TableMain onActivated 自动 refresh 留页码）——**[MUST NOT]** app 侧再手写刷新信号补偿（双重请求反模式）

## 能力边界 / 按需使用

- **`toolbar`（工具栏）：默认无即够用。** 仅当需要新增 / 批量删除等操作按钮才配 `leftExtraButtons`（ActionBtnGroup 配置形态）；操作依赖选中行时经 `ctx.selectedList` 联动 disabled。
- **`separateSearch`（分离侧栏）：默认关（搜索在表格上方一体布局）。** 仅当搜索项多、需「搜索独立侧栏 + 主区纯表格」才开——开启后 header/搜索/操作区整体入侧栏，aside 与表格 maxHeight 同源；⚠️ 分离态下 `searchSticky` 被无视。
- **`searchSticky` / `toolbarSticky` / `pagerSticky`（三件套粘性）：默认全关。** 仅当页面长滚时需搜索 / 工具栏 / 分页吸附才按需开（toolbarSticky 叠钉搜索区下方）。
- **`showSwitchView`（双视图切换）：默认关（表格单一视图）。** 仅当需要「列表 / 卡片」双视图切换才开（配 `#custom-view-item` 卡片渲染）。
- **`isAutoRefresh` / `refreshInterval`：默认关（不自动刷新）。** 仅当列表需轮询刷新（任务态实时变化等）才开。
- **高度链 prop（`refine` / `viewportHeight` / `parentChannel`）：默认 ListLayout 内部已接管**（refine 默认 true）——常规无需干预，仅特殊高度场景覆写。
- **两卡模型：默认已分配好，不用配。** 灰底上**两块白卡**：
  ① **搜索 + 操作**（合并为一块，中间只有分段档，无缝）② **数据区**（toolbar + 表体 + 分页同属一块）。
  **header 槽恒透明**（页面标题带，与正文一样露底）。
  - 🔴 面**只有底色 + 呼吸 + 圆角，没有描边、没有投影** —— 层级由面/底一档色差表达。
    [MUST NOT] 补描边或投影，也 [MUST NOT] 改用 `ElCard` 包（见下方反模式）。
  - **为什么数据区也成面**：EP 表体自带白底（`--el-table-bg-color` = `--el-fill-color-blank`，
    core 未接管）。壳不成面时，白表体浮在灰底上、而它上方的 toolbar 与下方的分页悬空在灰底
    ⇒ 视觉断层。给壳上面色后三者收进同一块白面。
- **`gap`（间距基数）：默认跟随布局 gap 体系，不用配。** 缺省取
  `bridge.APP_LAYOUT_GAP_CONFIG.size`（核内默认 8）；取不到 bridge（脱离 AppLayout 挂载）退 8。
  它是**一个基数派生四档**（`utils/gap-scale.ts`）：

  | 档   | 倍率 | 默认值 | 用在哪                                                      |
  | ---- | ---- | ------ | ----------------------------------------------------------- |
  | 外圈 | ×2   | 16     | 内容 ↔ chrome / viewport 边（由 `AppBody` 给，不在本组件） |
  | 呼吸 | ×1.5 | 12     | 卡片内边距                                                  |
  | 模块 | ×1   | 8      | 卡 ↔ 卡                                                    |
  | 分段 | ×0.5 | 4      | 合并卡内「搜索段 ↔ 操作段」                                |

  **改基数 = 四档按比例同步缩放**（单旋钮）；基数还随密度档缩放（compact ×.75 / cozy ×1 /
  comfortable ×1.5），故**顺序在每个密度档都成立** —— 四档都是同一个数的倍数，不可能乱。
  🔴 [MUST NOT] 让卡内呼吸改回读 `--dc-core-content-gap`：那是第二个来源，与 gap 各自随
  不同轴变动，最松档实测会出现「卡内 ≥ 外圈」的乱序。

- **完整能力演示**（toolbar 全形态 + 粘性三件套 + keepAlive 组合）：`apps/reference/src/pages/layout/list-layout/guide/`（最佳实践）、`pages/layout/list-layout/sticky/`（粘性）、`pages/layout/list-layout/module-demo/`（keepAlive 模块组合）——能力展示，非推荐默认。

## 上下文默认值（直系父上下文）

置于特定父容器槽位时，`ListLayout` 自动获得上下文默认值（`useContextDefaults` 解析直系父 DOM 的 `data-dc-slot`），消费方零传参；显式传 prop 仍优先。

| 场景                            | prop                                | 自动默认                                                                                               |
| ------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| AppPage `#left` / `#right` 窄栏 | `tableMainProps`                    | 分页窄栏化：`{ pageLayout: "prev, pager, next", paginationBackground: false }`                         |
| AppPage `#left` / `#right` 窄栏 | `formSearchProps.layoutByContainer` | `true`（搜索表单按**容器**断点定档）——窄栏里 `el-col` 按 window 断点解析必然挤爆，是结构性的、不是口味 |
| 其他容器 / 独立使用             | 两者                                | 不处理（透传各自默认）                                                                                 |

> 两个透传袋的上下文默认都是**逐键合并**（显式键优先、未给的键回落上下文默认）：
>
> - 显式传 `tableMainProps`（如卡片视图只能经它传的 `tableProps.gridColumns` / `tableProps.card`）不会整袋覆盖掉分页窄栏化，
>   只有显式写 `pageLayout` / `paginationBackground` 才改掉对应那一键；
> - 显式传 `formSearchProps` 不会整袋覆盖掉 `layoutByContainer`，只有显式写 `formSearchProps: { layoutByContainer: false }` 才关掉它。
>   ⚠️ `maxRows` **不**参与上下文默认 —— 它是**内容量**的函数（收起态最多几行、且含操作区所在行），不是容器宽的函数；
>   窄栏下 `maxRows: 1` 会把整块搜索区折叠塌成 0。该值 [MUST] 由消费方按页面内容判。

> ⚠️ 需上下文动态默认的 prop 不写 `withDefaults` 默认（详见 spec：`docs/specs/2026-08-14-080509-moderate-usecontextdefaults直系父上下文默认/spec.md`）。
> `ListLayout.refine` 默认恒 `true`（withDefaults），不参与上下文解析。

## 各块的面由谁给

- **搜索 + 操作合并卡**（`.list-layout-chrome`）：由 `ListLayout` 自己成面。
- **header 槽**：不成面，露底（甲方定调）。
- **数据区**（`TableMain` / `DataGridView` / `InfiniteListView`）：**由它们自己持有**，
  `ListLayout` [MUST NOT] 再经 `:deep()` 伸手刷 padding / 背景。
  要关掉数据区的面，走它们自己的 `:surface="false"`。

🔴 原因：面与**可用高账**必须在同一个组件里闭环。此前 padding 由本组件从外面刷、
可用高在 `TableMain` 里算，两边各管一半 ⇒ 每页恒漏一个 padding。

同理，`.list-layout-chrome` 的高度由挂在**卡本身**的 `WatchSize` 量得（含卡自身
padding 与内部分段档），[MUST NOT] 退回「量内部两段再拼」。

## 标题（`title` / `#header`）

**优先级：`#header` 插槽 > `title` prop > 不渲染**。常见场景传 `title` 即可，
复杂头部用插槽接管。与 `ViewLayout.title` 同口径 —— 列表页与详情页头部结构对齐。

标题行**露底不成面**（两卡模型里 header 不是卡），锚点类 `.dc-list-layout__header`。

**scope 带 `title`**（v0.32.0 补，与 `ViewLayout` 对齐）：插槽接管后仍拿得到原标题
⇒ 「加个徽标 / 加个副标题」这类小改不必把 `title` 再从外面透一遍。

```vue
<template #header="{ title }">{{ title }} <ElTag>草稿</ElTag></template>
```

⚠️ 它是**内容区的标题行**，不是页面 chrome。要页面级 navbar（返回 / ⋮ / tabbar）
[MUST] 走 `AppPage` 的 `showNavBar`，[MUST NOT] 拿本槽拼 —— 同名不同物。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（泛型 `T` 行 / `PO` 解析 / `SO` 格式化 / `SQ` 静态 / `F` 注入）

**表单侧（FormSearch 双子）**

| name              | type                                                                         | 默认 | 语义                                                                          |
| ----------------- | ---------------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------------- |
| `list`            | `FormItemConfigList<PO, SO>`                                                 | `[]` | 搜索表单配置（ListLayout 据此推 PO/SO，data 内部生成）                        |
| `staticQuery`     | `SQ`                                                                         | `{}` | 静态参数（扁平顶到 ListLayout，禁放 formSearchProps 内）                      |
| `formSearchProps` | `Partial<Omit<FormSearchProps<PO,SO,{}>, "staticQuery"\|"list"\|"compact">>` | 未设 | FormSearch 透传袋（compact 由内部 separateSearch 驱动，外部 [MUST NOT] 覆盖） |

**表格侧（TableMain 双子）**

| name                                                                                                | type                                                                                                         | 默认                                  | 语义                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columns`                                                                                           | `TableMainProps["columns"]`（必填）                                                                          | —                                     | 列配置（扁平等级）                                                                                                                                                                                                                                             |
| `rowKey`                                                                                            | `Extract<keyof T, string> \| ((row:T)=>string)`（必填）                                                      | —                                     | 行键                                                                                                                                                                                                                                                           |
| `api`                                                                                               | `(params: TableApiParams<ExtractFormStringifyFromObject<PO,SO> & SQ>) => Promise<TableApiResult<T>>`（必填） | —                                     | 列表取数                                                                                                                                                                                                                                                       |
| `refine` / `refineReduceHeight` / `viewportHeight` / `parentChannel` / `toolbar` / `showSwitchView` | 同 TableMain                                                                                                 | refine `true`、refineReduceHeight `0` | 常用配置提升为直属扁平 prop（内部自行消化视口高度链；TableMain 恒收 `:refine="false"`，高度计算由 ListLayout 接管）                                                                                                                                            |
| `tableMainProps`                                                                                    | `Partial<Omit<TableMainProps, 上述 6 键 \| "api" \| "query" \| "injectInfo">>`                               | 未设（上下文默认）                    | TableMain 透传袋；⚠️ 置于 AppPage `#left` / `#right` 窄栏时分页自动窄栏化（默认补 `{ pageLayout: "prev, pager, next", paginationBackground: false }`，经 `useContextDefaults` 直系父上下文解析，见下）；与显式传入的 `tableMainProps` **逐键合并**、显式键优先 |

**直属行为 props**

| name                                             | type                                                          | 默认                                          | 语义                                                                                                                                                                                                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `query`                                          | `SQ`                                                          | —                                             | ⚠️ types 声明但组件内未消费（疑似历史残留），勿依赖                                                                                                                                                                                                                              |
| `injectInfo`                                     | `F`                                                           | 未设                                          | 自定义只读上下文，合并进列插槽 scope.injectInfo（只读消费通道）                                                                                                                                                                                                                  |
| `beforeSearch`                                   | `(data, type) => data`                                        | 未设                                          | 搜索前同步回调（可改写参数）                                                                                                                                                                                                                                                     |
| `clearTableFilterOnReset`                        | `boolean`                                                     | 未设                                          | 重置时同时清空表头过滤                                                                                                                                                                                                                                                           |
| `separateSearch`                                 | `boolean`                                                     | `false`                                       | 搜索/header/操作区整体移入侧栏                                                                                                                                                                                                                                                   |
| `separateSearchConfig`                           | `Pick<SlotLayoutFlowAsideProps, "type"\|"gap"\|"asideWidth">` | 未设                                          | 分离侧栏布局                                                                                                                                                                                                                                                                     |
| `searchSticky` / `toolbarSticky` / `pagerSticky` | `boolean`                                                     | 均 `false`                                    | 三件套粘性（分离态下 searchSticky 被无视）                                                                                                                                                                                                                                       |
| `headerObserveResize` / `operationObserveResize` | `boolean`                                                     | 均 `false`                                    | header/操作槽量高 ResizeObserver                                                                                                                                                                                                                                                 |
| `gap`                                            | `number`                                                      | `bridge.APP_LAYOUT_GAP_CONFIG.size`（核内 8） | **模块间距**（header / 搜索 / 操作区各自的下间距 px）。缺省跟随布局 gap 体系，改布局 gap 即同步；脱离 AppLayout 挂载时退 8                                                                                                                                                       |
| ~~`moduleBg`~~                                   | `boolean \| string`                                           | `false`                                       | 🚫 **已废弃**（`akw76r`）。它是**全开关**：一开四块全上色（**含数据区**），与「数据区恒透」直接冲突。它原本要解决的「让模块间距显出来」现已是**默认行为**（三块 chrome 默认成面）⇒ 无需再开。仍可用、行为不变（零 breaking），但 [MUST NOT] 用于新代码；移除走后续 breaking 窗口 |
| `searchOverlay`                                  | `Partial<PO>`                                                 | 未设                                          | **一次性叠加**的搜索值（典型 = 深链 id，见 `useListDetailDeepLink`）：界面**可见**、参与本次查询、**不进重置基线**（「重置」能真正清空）。挂载时应用一次；之后值变化（新的一次「进入」）再应用并查询一次。key [MUST] 在 `list` 里有对应字段                                      |
| `initialSearch`                                  | `boolean`                                                     | `true`                                        | 挂载后是否立即触发初始化查询（默认查）；关闭后表格空态显示「欢迎触发查询」、KeepAlive 激活不自动刷新（TableMain 经「已发生过查询」自判，见 table docs）                                                                                                                          |

**v-model**：`isAutoRefresh`、`refreshInterval`、`customView`（配合 `#custom-view-item` 卡片渲染）、`activeId`（`string | number | undefined`）/ `activeData`（行对象 | undefined）—— **「当前项」双 model**（= 用户点击/激活的那一条，[MUST NOT] 与勾选 selection 混同）。两者**同生同灭**：`activeId` 有值 ⇒ `activeData` 必有值且恒为**列表数据原样**；列表刷新后当前项不在新数据内 → 两者一并清空；外部写入不在列表内的 id → 忽略 + `console.warn`（不清空既有选中）。⚠️ `activeId` 的 `string` / `number` **两种都是一等公民**：出口值**保业务数据里的原始类型**（`rowKey` 为字段名时即 `row[rowKey]`，数字 id 出数字）；外部用另一种类型写入（如 `"1"` 对数字 id）同样命中——比对时内部统一 `String()` 归一，且**保留调用方写入的原值**不回写覆盖。本组件是**纯透传层**，状态机在下游（table 态 → TableMain / DataListView；grid 态 → DataGridView）；⚠️ `viewMode` 切换会换载下游组件 → 当前项随之丢失（既有换载语义）

### Emits

| 事件             | 载荷            | 语义                                   |
| ---------------- | --------------- | -------------------------------------- |
| `dataChange`     | `T[]`           | 数据变更                               |
| `pageInfoChange` | `TablePageInfo` | 分页信息（pageSize/currentPage/total） |

### Slots

| 槽                     | scope                                                                         | 语义                                                                  |
| ---------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `#header`              | `{ title }`                                                                   | 标题行（插槽 > `title` > 不渲染）。**scope 带 `title`**（v0.32.0 补） |
| `#operation`           | 无                                                                            | 搜索区下方扩展（操作条）                                              |
| `#custom-view-item`    | `DataListViewItemScope<T>`                                                    | customView 模式单项卡片渲染                                           |
| `#form-<key>`          | `FormScope`                                                                   | 覆盖搜索表单单项                                                      |
| `#table-<prop>`        | `TableColumnDefaultScope<T, ListLayoutInnerInjectInfo<PO,F>>`                 | 覆盖列单元格                                                          |
| `#table-header-<prop>` | `TableColumnHeaderScope & { searchFormData: PO; triggerSearch?: () => void }` | 覆盖列表头（可联动搜索）                                              |

### Expose（`ListLayoutInstance` = FormSearchInstance + TableMainInstance + update）

`refresh(silent?)` / `reload(silent?)` / `getTableInstance()` / `validate()` / `resetFields()` / `clearValidate(key?)` / `triggerReset()` / `triggerSearch()` / `toggleCollapse(next?)` / `isCollapsed` / `update(key, value)`（改内部表单数据）

**注入机制**：`injectInfoAdjust` 把 `triggerReset` / `triggerSearch` / `update` 合并进 TableMain `:injectInfo` —— 列插槽 `scope.injectInfo` 可直接 `triggerSearch()` / `triggerReset()` / `update(key, value)`（类型 `ListLayoutInnerInjectInfo<PO,F>`）。

## 反模式 / 注意

- **搜索表单用 FormSearch 的 `#default`**：被内置按钮盒占用，消费方默认插槽不渲染
- **`query` prop 勿用**：声明未消费（疑似历史残留）
- **keepAlive 页返回刷新**：core 内置（onActivated refresh 留页码），app 侧 [MUST NOT] 补偿
- **formSearchProps 塞 staticQuery/compact**：类型已 Omit，编译即拦
- 搜索/表格的双子 props 与 TableMain 直属 prop 重复时，**以 ListLayout 直属为准**（TableMain 恒收 refine=false）
- 🔴 **[MUST NOT] 给数据区与 header 槽上背景色**（`.dc-table-main` / 网格视图 / `.list-layout-header`）。
  数据区是**主内容区**、header 是**页面标题带**，两者都该让底透上来——成面是为了把
  「要读的辅助块」（搜索 / 操作）从底上分出来，标题与正文不需要这件事，
  给它们上色会让「哪块是辅助、哪块是正文」的视觉层级塌掉。已废弃的 `moduleBg` 正因此被废。
- 🔴 **[MUST NOT] 用 `ElCard` 包这两块**（即便它看着正好是"卡片"）。三条实证理由：
  ⓐ 它的底读 `--el-card-bg-color: var(--el-fill-color-blank)`，**是第四个色来源**，
  绕开刚统一的底/面/浮层三档；ⓑ 自带 shadow / border / header 结构，逐条覆盖的成本
  高于直接写两条 CSS；ⓒ 多一层 DOM，而本族已有 `dc-` 锚点类可直接定向。

## 关联

- 内部组件：`FormSearch`（form 族）、`TableMain`（table 族）
- 列表接口模型：`APP_API_LIST_MODEL_KEY_CONFIG`（core config 单源，api 参数/结果类型由它推导）
- 高度链：`refine` + `viewportHeight`/`parentChannel`（见 TableMain 文档）
- 范式页：`apps/reference/src/pages/layout/list-layout/guide/`、`pages/layout/list-layout/sticky/`、`pages/layout/list-layout/module-demo/`

> 目录迁移：实现与配套归入 `components/compose/compose/list-layout`；公开契约、兼容别名与 panel 废弃时间点不变。

## C 源码迁移

本组件及配套类型/hooks/测试/API迁至 `packages/forge-compose/src/components`，去掉 pro 重复层。应用消费 `@done-coding/forge`；组件 API、槽与事件不变，Panel已由pn1031退役（C拆包时曾保留）。
