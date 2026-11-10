# AppPageListDetailLayout（列表 / 详情同页范式 · master-detail）

> 把「列表 → 弹窗改 → 关闭 → 刷新」换成「列表选中 → 详情常驻」：一根 `activeId` / `activeData` 状态线打通列表与详情，宽屏并排 / 窄屏抽屉两形态按视口宽定档。
> 范式页：`apps/reference/src/pages/layout/app-layout/list-detail/`

## 定位

- **两种形态，由 `embedded` 定**：
  - **页面级**（默认 `embedded=false`）：内含 `AppPage`，**页面根即 `.app-page`**。业务页面根**二选一**——普通页用 `AppPage`，列表详情页用本组件；[MUST NOT] 再套一层 `AppPage`。
  - **组件级**（`embedded`）：不渲染 `AppPage`，放进宿主页面的一块区域（典型 = `TabsMain` 页签内容，一页多个 tab 各自一个列表详情）。契约见下「嵌入态」。
  - 两者都 [MUST NOT] 塞进弹窗 —— sheet 档自己就要开一层抽屉。
- **何时用**：单条记录是主角的场景（工单、会话、任务、审核队列）——用户要在列表与单条之间反复横跳。
- **何时不用**：纯批量操作（导入导出、批量改状态）——那里单条不是主角，常规 `AppPage` + `ListLayout` 更合适。

## 层级

```
AppPageListDetailLayout          【L1 门面】无 DOM 输出：持状态 + 形态定档 + provide 上下文
├─ split → AppPageListDetailSplit   【L2】AppPage：#left = 列表 · 默认槽 = 详情区
└─ sheet → AppPageListDetailSheet   【L2】AppPage：默认槽 = 列表 · 抽屉 = 详情区
                                     └─ AppPageDetail 【L3】有当前项 → 详情；无 → 空态
```

两个形态件（Split / Sheet）**不对外导出**，是门面的实现细节；L3 的 `AppPageDetail` **对外导出**（可独立成页，见 [README-AppPageDetail.md](../../app-page-detail/docs/README-AppPageDetail.md)）。

## 嵌入态（`embedded`）

```vue
<AppPage>
  <TabsMain v-model="tab" :tabs="tabs">
    <template #provider>
      <!-- [MUST] 是页签内容的**直系子节点**（中间不包 div），refine 上下文默认才可达 -->
      <AppPageListDetailLayout embedded :detail-api="providerDetailApi">
        <template #list="{ listProps }"><ListLayout v-bind="listProps" … /></template>
        <template #detail="{ data }">…</template>
      </AppPageListDetailLayout>
    </template>
    <template #instance>…第二个列表详情…</template>
  </TabsMain>
</AppPage>
```

| 问题                            | 结论                                                                                                                                                                                               | 依据                                                                                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ⓐ sheet 档抽屉归属              | **不变**：仍是同一个 `ModalConfirm` 抽屉，teleport 到 `body`、盖整个视口                                                                                                                           | 页面级时它本来就 teleport 到 `body`（不在 `AppPage` 里），嵌入与否对它无差别 ⇒ 交互零变化                                                                 |
| ⓑ `#top` / `#bottom` / `#right` | **嵌入态不渲染**，传了 dev 期告警                                                                                                                                                                  | 它们是 `AppPage` 的**页面级**悬浮槽，嵌入态没有自己的 `AppPage`；页面 chrome 归宿主页面，写在宿主 `AppPage` 上。`#detailBottom`（详情区内部底边）不受影响 |
| ⓒ `refine` / 可用高             | **承接宿主**：列表 / 详情直接吃宿主（如 `TabsMain` 页签）provide 的可用高；两栏各自的直系父挂与页面级形态**同档**的 `data-dc-slot`（列表 = `AppPage_Left`、详情 / sheet 列表 = `AppPage_Default`） | 页面级形态里列表在 `#left` 窄栏、详情在默认槽 —— 接力同一档标记 ⇒ `ListLayout` 分页窄栏化、`ViewLayout` 精细流等上下文默认**与页面级逐字一致**            |
| ⓓ `splitAt`                     | **仍按视口宽**                                                                                                                                                                                     | 按容器宽会形成「档位 → 布局 → 容器宽 → 档位」的自反馈；页签内容区与整页内容区同宽（差的只是页签头），判据成立                                             |

- split 档两栏：`display:flex`，列宽 `listWidth`（百分比以嵌入容器宽为基数），栏间距 = 模块档 gap。
- 嵌入态根类：`dc-app-page-list-detail` + 形态修饰符 + `dc-app-page-list-detail_embedded`。
- 🔴 同页多个嵌入实例且都开 `queryKey` 时，[MUST] 各用不同的 key（URL query 只有一份）。
- `AppPage` 的 props（`gap` / `leftWidth` 等经 `$attrs` 穿透的）在嵌入态**无落点**。

## 快速上手

```vue
<AppPageListDetailLayout
  v-model:active-id="activeId"
  v-model:active-data="activeData"
  :detail-api="detailApi"
>
  <template #list="{ listProps }">
    <!-- ⚠️ listProps [MUST] 整体 v-bind，少接一条对应能力即静默失效 -->
    <ListLayout v-bind="listProps" :api="listApi" :columns="columns" row-key="id" />
  </template>

  <template #detail="{ data, record, refreshList }">
    <MyDetail :detail="data" :record="record" @changed="refreshList" />
  </template>

  <template #empty="{ listEmpty }">
    <ElEmpty :description="listEmpty ? '没有符合条件的数据' : '请从列表选择一条'" />
  </template>
</AppPageListDetailLayout>
```

## 核心不变式：先有列表，才有详情

> **`activeId` 只能从列表内选择产生，[MUST NOT] 直接从链接取。** > `activeData` 是**列表数据 item**（不是详情数据），两者**同生同灭**。

由此推出的行为（由列表族的 `useActiveRecord` 统一守，门面不重复接管）：

| 触发                                     | 行为                                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| 用户点某项                               | 两个 model 同时写                                                                |
| 列表刷新                                 | 按 id 在新数据内重查刷新 `activeData`；**查不到 → 两者一并清空**（详情自动关闭） |
| 外部写不在列表内的 id                    | 忽略 + `console.warn`，**不清空既有选中**                                        |
| 写 `activeData`（导航切上/下一条走此路） | 按行反查键同步 `activeId`；行不在列表内同样忽略 + warn                           |

**深链形态随之改变（[MUST] 照做）**：链接 [MUST NOT] 携带「详情 id」直达详情，而是把 id 带进**搜索条件** → 列表搜出结果 → 激活该条。两个代价需知情：ⓐ 搜索表单 [MUST] 有按 id 精确筛的**可见**字段；ⓑ 深链进入时列表通常只剩一条 → 上下条导航两端皆 false，点「重置」即恢复全量。

### 深链定位（`useListDetailDeepLink`）

内置实现，把「选中」（`queryKey`）与「定位」（id 一次性叠加进搜索）串起来：

```ts
const deepLink = useListDetailDeepLink({
  queryKey: "videoNoteId",
  idKey: "id",
});
```

```vue
<AppPageListDetailLayout :query-key="deepLink.queryKey" …>
  <template #list="{ listProps }">
    <!-- list 里 [MUST] 有 key === deepLink.idKey 的可见字段（初值为空） -->
    <ListLayout v-bind="listProps" :list="searchFields" :search-overlay="deepLink.searchOverlay.value" … />
  </template>
</AppPageListDetailLayout>
```

| 成员            | 给谁                             | 语义                                                                                                   |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `queryKey`      | 门面 `query-key`                 | 路由 query 键：进入时挂起选中 + `activeId` 以 `replace` 镜像回 URL                                     |
| `idKey`         | 搜索表单 id 字段的 `key`         | 列表**接口**按它精确筛选（请求侧）。可选，缺省取字符串形态的 `rowKey`；`rowKey` 是函数时 [MUST] 显式传 |
| `searchOverlay` | `ListLayout` 的 `search-overlay` | `{ [idKey]: query 值 }`，只在「进入」时产生 —— 见下                                                    |

- 🔴 **`idKey` ≠ `rowKey`，[MUST NOT] 合并**：`rowKey` 是**列表行数据**的唯一键（响应侧，可为函数）；`idKey` 是**查询参数**里按 id 筛选的字段名（请求侧）。多数时候同名，但不保证（行上 `id`、筛选参数 `ids`）。
- **「进入」的判定**：首次挂载，或 KeepAlive 重激活时 URL 上的值与**离开时**不同（从别处带新 id 跳进来）。
  用户在页内点选只会让 URL 镜像 `activeId`，**不**产生新的叠加（否则点一下列表就被筛成一条）。

**门面侧的挂起 id 规则**（有无 `useListDetailDeepLink` 都成立）：

- 挂起的 id **只消费一次**（进入后首次出数）：在本页 → 选中；**不在 → 回落默认**（`autoActiveFirst`）—— 与不带 id 进入一致，右侧不会空着。
- KeepAlive 重激活时 URL 上的 id 与当前 `activeId` 不同 ⇒ 视为新的深链进入：先按现有列表试选，
  不在则保持挂起、等下一次出数（通常就是叠加搜索触发的那一次）再按上一条消费。
- 不在本页的 id 会带一条列表族的 warn（「不在当前列表数据内，已忽略」）—— 这正是「该把它带进搜索」的信号。
- 🔴 **详情区 / URL 镜像只跟「已确认」的当前项**（行对象已就位），不跟待裁决的 `activeId`：深链 id 在列表族裁决前
  不会让详情区挂载、也不写进 URL。裁决按写入后本轮渲染落定时的**终态**判（接受 = 键仍是它且行已就位；拒绝 = 键被回滚走），
  [MUST NOT] 改回 watch `activeId` 的变化 —— 起点无选中时「写入 → 被拒」常在同一轮里走完、净变化为零。

## 详情 ↔ 列表：单向 `refreshList`，无回写

**唯一机制**：详情侧判断「与列表 item 是否同步」，不同步则触发**列表刷新**，由列表接口出新数据。[MUST NOT] 由详情去写 `activeData`。

```ts
// 推荐用法（业务侧详情组件内）
const isOutOfSync = computed(() => {
  const d = props.detail,
    r = props.record;
  if (!d || !r) return false;
  // ⚠️ [MUST] 先确认「详情与当前 item 是同一条」再比字段 —— 切换当前项时详情尚未重拉回来，
  // 旧详情 × 新 item 会被判成不同步，每切一次就误刷一次列表（实测踩坑）。
  if (String(d.id) !== String(r.id)) return false;
  return d.status !== r.status;
});

watch(isOutOfSync, (v) => v && refreshList());
```

- **判定 [MUST] 由业务自己写**（比业务关键字段）：组件不可能知道哪些字段算关键；全字段比对会被 `updatedAt` 一类字段搞成每次都触发。
- **[MUST] 用 `watch` 的值变化语义**，[MUST NOT] 用 `watchEffect` 或在渲染期直接调 `refreshList()` —— 值变化语义正是止损点：刷新后对上了 `true→false` 收敛；仍对不上 `true→true` **值未变 → 不再触发**（「刷新了还是不同步就是接口的问题」，组件不重试）。
- 新建 / 删除等结构性变更同样走 `refreshList`，机制统一。
- ⚠️ 刷新后该记录可能因状态变化换了排序、跑出当前页 → 按不变式两值清空 → **详情自动关闭**。语义正确，但使用方需知情。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### v-model

| 名           | type                            | 语义                                                                         |
| ------------ | ------------------------------- | ---------------------------------------------------------------------------- |
| `activeId`   | `string \| number \| undefined` | 当前项唯一键。`string` / `number` 两种都是一等公民，出口值保业务数据原始类型 |
| `activeData` | `T \| undefined`                | 当前项对应的**列表 item**（恒为列表接口原样）                                |

### Props

| name              | type                                                         | 默认                       | 语义                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------- | ------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `mode`            | `"auto" \| "split" \| "sheet"`                               | `"auto"`                   | 形态；`auto` 按视口宽 `splitAt` 定档                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `splitAt`         | `number`                                                     | `1200`                     | `auto` 档切档阈值（px，**视口宽**）。iPad 竖屏 768 / Air 横屏 1180 落 sheet；Pro 12.9″ 横屏 1366 落 split                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `listWidth`       | `string`                                                     | `clamp(280px, 28%, 420px)` | 分栏态列表列宽。**落在 `AppPage` 的 `#left` 槽上**（不是列表盒）⇒ 百分比按**视口**解析、基数稳定不循环。定值 / 百分比 / clamp 三种写法都不产生死白（实测死白恒 = shim padding）。[MUST NOT] 把它搬回列表盒 —— 槽是 shrink-to-fit，百分比在那一层没有基数（vr8kd2）                                                                                                                                                                                                                                                                                                             |
| `autoActiveFirst` | `boolean`                                                    | 跟随形态                   | 列表出数后自动激活第一条。**split 默认 `true`**（宽屏右半屏不该空着）、**sheet 默认 `false`**（窄屏自动弹抽屉是打扰）。⚠️ 详情若有副作用（如「打开即标记已读」）[MUST] 显式关掉                                                                                                                                                                                                                                                                                                                                                                                                |
| `queryKey`        | `string`                                                     | 无                         | 传了才把 `activeId` 同步进 URL query（**`replace` 不 `push`**）。复原仍走不变式校验                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `detailApi`       | `(params?: { id }) => Promise<R>`                            | 无                         | 传了则内置 `ViewLayout`（零配置拿到内置导航 + `refreshToken` 接线）；不传则 `#detail` 原样渲染、门面零请求                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `detailTitle`     | `string \| ((detailData, record) => string)`                 | 无                         | 详情区标题。字符串固定 / 函数按数据算：`detailData` = 详情接口数据（**未传 `detailApi` 时恒 `undefined`**）、`record` = 当前项的列表 item（「详情即列表数据」形态靠它出标题）。⚠️ **两形态落点不同**（v0.28.0 ⓤⓤ②：标题一律归「最外层容器的标题位」）：split 档渲染在**详情区顶部**；sheet 档渲染进**弹层自己的 header**（不再重复出现在正文里）。由此 sheet 档的函数形态**只拿得到 `record`、`detailData` 恒 `undefined`**（详情数据在 `ViewLayout` 内部，弹层壳那层拿不到）——需要详情数据驱动的标题，[MUST] 改在 `#detail` 内自绘。不传则不渲染，业务照旧可在 `#detail` 自绘 |
| `viewLayoutProps` | `Omit<ViewLayoutProps, "api" \| "params" \| "refreshToken">` | 无                         | 透传给内置 `ViewLayout` 的 props——**详情侧的业务操作按钮走这里**：`{ leftExtraButtons: [...] }` 落到 ViewLayout 工具条左侧、与右侧刷新按钮组同一行（`rightExtraButtons` 则置于 `AutoRefreshGroup` 之前）。🔴 `api` / `params` / `refreshToken` 三键被 `Omit`：它们分别由 `detailApi` / `{ id: activeId }` / `activeId` 占位，是「详情跟着当前项走」这条不变式的载体，放开任一个都能让主干**静默失效**（页面看着正常，详情停在上一条）。**未传 `detailApi` 时无内置 ViewLayout，本项无落点**                                                                                    |
| `sheetLayerType`  | `"drawer" \| "modal"`                                        | `"drawer"`                 | sheet 形态的弹层承载：抽屉 / 居中弹窗。透传 `ModalConfirm.layerType`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `embedded`        | `boolean`                                                    | `false`                    | 组件级嵌入：不渲染 `AppPage`，放进宿主页面一块区域（如 `TabsMain` 页签）；`#top` / `#bottom` / `#right` 不渲染。见「嵌入态」                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sheetSize`       | `string \| number`                                           | `"70%"`                    | sheet 弹层尺寸（透传 `ModalConfirm.width`）：drawer 下是抽屉尺寸、modal 下是弹窗宽度                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

> **为什么是一个 `viewLayoutProps` 对象、而不是逐个扁平 prop**：同 `ListLayout` 的
> `tableMainProps` 惯例。内层能力面会长（按钮 / 刷新开关 / `refine` / 视口高…），
> 逐个补 prop 等于同一个洞反复开；一个对象一次封住。

**AppPage 的 props 靠 `$attrs` 自动穿透**（`gap` / 各 `*Bg` / `fullViewport` / `nextViewportMaxHeight` 等原样可用），无需白名单。

### Slots

| 槽                            | scope                                                                                                                | 语义                                                                                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `#list`                       | `{ listProps, listLayoutRecommended, resolvedMode }`                                                                 | 列表。`listProps` [MUST] 整体 `v-bind` 到列表组件；`listLayoutRecommended` 是 `AppPage#left` 的窄栏推荐配置（split 档才有值，见下）                                |
| `#detail`                     | `{ id, record, index, total, hasPrev, hasNext, goPrev, goNext, refreshList, data, loading, fetchSeq, resolvedMode }` | 详情。`data` / `loading` / `fetchSeq` 仅在传了 `detailApi` 时有值                                                                                                  |
| `#empty`                      | `{ listEmpty, resolvedMode }`                                                                                        | 未选中占位。`listEmpty=true` 列表本身无数据 / `false` 有数据但未选中，**两种文案 [MUST] 分流**                                                                     |
| `#top` / `#bottom` / `#right` | 无                                                                                                                   | 直通 `AppPage` 同名悬浮槽（**两形态都支持，`auto` 自动挡切档后依旧在**）                                                                                           |
| `#detailBottom`               | 同 `#detail`                                                                                                         | **详情区内部底边**（透到 `ViewLayout` 的 `#bottom`）：split 档固定在详情区底、sheet 档固定在抽屉底，内容再长也不滚走。⚠️ 与上面那个 `#bottom` **同名不同物**，见下 |

### 🔴 `#bottom` vs `#detailBottom`（同名不同物，[MUST] 分清）

| 槽              | 挂在哪                                      | 覆盖范围                                | 典型内容                                           |
| --------------- | ------------------------------------------- | --------------------------------------- | -------------------------------------------------- |
| `#bottom`       | `AppPage` 的**页面级四向悬浮槽**            | 整个页面的底边（列表 + 详情都在它上方） | 页面级状态条 / 全局提示                            |
| `#detailBottom` | `ViewLayout` 的 `#bottom`，在**详情区内部** | 只是详情那一块的底边                    | **提交 / 审核 / 保存这一条**的固定操作条、详情摘要 |

选择判据一句话：**这条按钮是对「当前这一条」的操作 → `#detailBottom`；是对整页的 → `#bottom`。**

`#detailBottom` 的 scope 与 `#detail` **完全一致**（含 `id` / `record` / 导航句柄 / `data` /
`loading` / `fetchSeq` / `resolvedMode`）—— 底部操作条要提交「这一条」，没有 `id` / `record`
就无处写回。两槽并存时它们拿到的是同一份数据，[MUST NOT] 在 `#detail` 里自己缓存一份再传给底边。

```vue
<template #detailBottom="{ id, record, loading, refreshList, hasNext, goNext }">
  <ActionBtn type="primary" :disabled="loading" :onClick="() => submit(id)"
    >提交</ActionBtn
  >
  <ActionBtn v-if="hasNext" @click="goNext">保存并下一条</ActionBtn>
</template>
```

- **sheet 档是本槽最大的受益场景**：抽屉里内容一长，写在 `#detail` 末尾的提交按钮会跟着滚走；
  放 `#detailBottom` 则钉在抽屉底边。
- **用了本槽即自动开 `ViewLayout.fillHeight`**（内容盒补 `min-height` 定高）——
  否则详情内容稀疏时底边只会跟在内容后面浮在半空、贴不到容器底。
  不想要这层定高（接受底边跟着内容走）时传 `viewLayoutProps: { fillHeight: false }` 关掉。
  🔴 没用本槽时**一个字都不传** ⇒ 其余 refine 页面零波及（这正是它做成 opt-in 的理由）。
- **前提：传了 `detailApi`**（本槽透到内置 `ViewLayout`，没有 `detailApi` 就没有那个容器 ⇒
  本槽无落点，与 `viewLayoutProps` 同一条边界）。详情数据业务自持时，底部条自己写在 `#detail` 里。
- **不传即零渲染**（逐层 `v-if` 守着），[MUST NOT] 传个空 `<template>` 占位 —— 精细流下它会被
  量高计入 reserve，详情内容区凭空少一截。

### `resolvedMode` —— 实际档位（三槽都有）

`mode` 是**入参**（"我要什么"），`auto` 档实际落在哪一档只有门面知道。三个插槽 scope 都下发只读的
`resolvedMode: "split" | "sheet"` ——**值是实际档位**，`mode="auto"` 下随视口跨过 `splitAt` 翻转，
强制档恒为对应值。

```vue
<template #list="{ listProps, resolvedMode }">
  <ListLayout
    v-bind="listProps"
    :api="api"
    :columns="resolvedMode === 'split' ? narrowCols : fullCols"
  />
</template>
```

- **[MUST NOT] 自己再判一次视口宽** —— 与门面的 `splitAt` 形成两个事实源，调用方改 `splitAt` 时静默不一致。
- **纯按宽度变现**（列数 / 间距）优先用 CSS `@container` 容器断点，不必经此值；`resolvedMode` 是给**行为分支**用的。

### `fetchSeq` —— 详情重拉计数（`#detail`）

传了 `detailApi` 时门面内置 `ViewLayout`，每次 `detailApi` **成功返回** `fetchSeq` +1（**失败不递增**）。
详情里的懒加载下游块（点开才拉的 tab 等）`watch` 它即可选择性重拉：

```vue
<template #detail="{ data, fetchSeq }">
  <ElTabs v-model="tab">
    <ElTabPane name="trace" label="执行步骤">
      <!-- tab 打开过才拉；详情整体刷新后跟着重拉 -->
      <TracePanel
        v-if="tab === 'trace'"
        :id="data?.id"
        :refresh-token="fetchSeq"
      />
    </ElTabPane>
  </ElTabs>
</template>
```

- **[MUST NOT] 用 `loading` 的 `true→false` 代替** —— 失败也会落回 `false`，下游会基于旧数据白拉一次。
- **[MUST NOT] watch `data` 的对象身份** —— 「每次返回新引用」从不是承诺，内部一旦做缓存 / 就地合并即静默失效。
- 未传 `detailApi` 时恒 `0`（无内置 `ViewLayout`、无拉取）。

### ⚠️ `#list` 里包一层 div 会打断上下文默认

`ListLayout` / `ViewLayout` / `TabsMain` 的上下文默认（`useContextDefaults`）读的是**直系父 DOM** 的槽位标记。
门面已在 split 档的列宽容器上挂了 `AppPage#left` 的标记，**但消费方在 `#list` 内自己包一层**
（做卡片网格几乎必然要包）就会把链打断 —— 表现是分页不窄栏化、搜索表单按 window 断点被挤爆，**且不报错**。

两条出路，按场景选：

- **ⓐ 不包裹**：直接把 `ListLayout` 作为 `#list` 的根，样式挂到 `ListLayout` 自己身上（`class` / `style` 原样透传）。
- **ⓑ 包裹了就显式传**：用 `listLayoutRecommended`（split 档下发的窄栏推荐配置）+ 显式 `formSearchProps`：

  ```vue
  <template #list="{ listProps, listLayoutRecommended }">
    <div class="card-grid">
      <ListLayout
        v-bind="{ ...listProps, ...listLayoutRecommended }"
        :form-search-props="{ layoutByContainer: true }"
        :api="api"
        :columns="columns"
      />
    </div>
  </template>
  ```

🔴 **[MUST NOT] 自己在包裹层挂 `data-dc-slot`** —— 那个 attr 的契约是「宿主在槽内容直系父上挂」，
消费方挂它等于冒充宿主；且上游一旦调整标记位置，这种写法**不报错、只是某天悄悄不生效**。

> **为什么 `#right` 可用、`#left` 不可用**：门面对 `AppPage` 槽的占用是——Split 用 `#left` 放列表、**默认槽**放详情；Sheet 用**默认槽**放列表、**抽屉**放详情。两形态都**没占 `#right`**，故它原样开放给业务；`#left` 则是 Split 自用，不开放。
>
> ⚠️ **Sheet 形态下详情打开时抽屉会盖住右栏**：抽屉是 EP 弹层（z-index 2000+ 档）且默认 70% 宽，而 AppPage 悬浮槽是 `APP_PAGE_SLOT_Z_INDEX`=1。这是形态固有结果、**不视为缺陷**——侧栏承载的本就是次要信息（说明 / 辅助入口一类），被临时遮住无妨；[MUST NOT] 为此加避让或降级逻辑。

## 反模式 / 注意

- **业务外层再套 `AppPage`** —— 页面根二选一，套了就成两层
- **`#list` 里只 `v-bind` 一部分 `listProps`** —— 少接 `onDataChange` 则序列 / 自动激活失效、少接 `ref` 则 `refreshList` 失效，且**都不报错**
- **自己给列表加 `:ref` 覆盖掉 `listProps.ref`** —— 需要自己也拿实例时 [MUST] 链式调用：`:ref="(el) => { myRef = el; listProps.ref(el) }"`
- **把整页级的东西塞进 `#detailBottom`（或反过来）** —— 两者同名不同物，见上表的选择判据
- **运行时增删 `#top` / `#bottom` / `#right` / `#list`** —— `AppPage` 的槽集判定不响应运行时增删（既有限制），插槽集 [MUST] 当静态结构
- **不传 `detailApi` 时期待内置上/下一条** —— 导航住在 `ViewLayout` 内；不内置 `ViewLayout` 就没有内置导航，用 `#detail` scope 的 `goPrev` / `goNext` 自绘
- **删除 / 筛掉当前项后期待自动跳到下一条** —— 按不变式两值清空落空态（不自动重激活，避免自动触发详情副作用）
- **sheet 态用 scoped `:deep` 调抽屉内样式** —— 抽屉 teleport 到 body，继承 class 但**不继承 scopeId**，`:deep` 恒失效；验收 [MUST] 量 computed style
- **`activeId` 只从链接取** —— 违反不变式，见上「深链形态」

## 关联

- 内部件（不导出）：`AppPageListDetailSplit` / `AppPageListDetailSheet` / `use-list-detail.ts`；L3 `AppPageDetail` 对外导出
- 不变式内核：`hooks/use-active-record.ts`（`useActiveRecord`，列表族三家共用）
- 上下文 key：`APP_PAGE_LIST_DETAIL_CONTEXT`（导航句柄 + `refreshList`，`ViewLayout` 可选 inject 探测）
- 详情容器：`ViewLayout`（`refreshToken` 外部重拉口 + 内置导航 `showNavigation`）
- spec：`docs/specs/2026-08-31-025041-moderate-列表详情同页范式AppPageListDetailLayout/spec.md`

> 目录迁移：实现与配套归入 `components/compose/layout/app-page-list-detail-layout`；公开契约、兼容别名与 panel 废弃时间点不变。

## C 源码迁移

本组件及配套类型/hooks/测试/API迁至 `packages/forge-compose/src/components`，去掉 pro 重复层。应用消费 `@done-coding/forge`；组件 API、槽与事件不变，Panel已由pn1031退役（C拆包时曾保留）。
