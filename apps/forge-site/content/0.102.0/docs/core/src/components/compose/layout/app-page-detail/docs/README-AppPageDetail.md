# AppPageDetail（详情区 · 可独立成页）

> 详情区组件：**默认自带 `AppPage`，可直接当一个详情路由页用**；`embedded` 开启后走透传态，供 `AppPageListDetailLayout` 内嵌。
> 范式页：`apps/reference/src/pages/layout/app-layout/list-detail/`

## 两种用法

**① 独立成页（默认 `embedded=false`）** —— 详情走独立路由时用：

```vue
<AppPageDetail
  :id="route.params.id"
  :detail-api="detailApi"
  :detail-title="(d) => d?.name ?? ''"
>
  <template #detail="{ data }"><MyDetail :data="data" /></template>
</AppPageDetail>
```

此时 `ctx` 不必传，**无序列导航**（`total=0`、上/下一条两端皆 false）——独立页本就没有「列表上下文」，这是正确语义而非缺失。

**② 被门面内嵌（`embedded=true`）** —— 由 `AppPageListDetailLayout` 内部使用，宿主已有一层 `AppPage`，故透传不再套；门面下发完整 `ctx`（含序列导航句柄）。业务一般不直接这么用。

## 标题渲染在哪（`detailTitle`）

- **传了 `detailApi`**（内置 `ViewLayout`）⇒ 标题走 **`ViewLayout` 的 `#header` 槽**，
  即「容器的标题位」，与 `ListLayout` 的 header 对齐、锚点 `.dc-view-layout__header`。
- **没传 `detailApi`**（详情数据业务自持、无 `ViewLayout` 容器）⇒ 由本组件自画，
  锚点 `.dc-app-page-detail__title`，排版与前者同口径。

🔴 [MUST NOT] 退回「在 `#default` 里自画一个 div」：那样标题成了「内容的第一行」，
位置与 `ListLayout` 对不齐、主题 persona 无从定向（原实现即如此，已归位）。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name              | type                                                         | 默认    | 语义                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embedded`        | `boolean`                                                    | `false` | `true` = 不套 `AppPage`（宿主已有一层）。⚠️ 内嵌态下本组件无宿主元素，`dc-app-page-detail` 根类与 `$attrs` 随之无落点                                                                                                                                                                                                                                                                                                                                                                       |
| `ctx`             | `Omit<AppPageListDetailDetailScope, "data" \| "loading">`    | 无      | 完整详情上下文（含序列导航）。**门面内嵌时下发**；独立使用不传                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `id`              | `string \| number`                                           | 无      | 独立使用时的当前项键（`ctx` 未传时生效；与 `ctx` 都无 → 落空态）                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `record`          | `T`                                                          | 无      | 独立使用时的当前项数据（`ctx` 未传时生效），供 `detailTitle` / `#detail` 消费                                                                                                                                                                                                                                                                                                                                                                                                               |
| `detailApi`       | `(params?: { id }) => Promise<R>`                            | 无      | 传了则内置 `ViewLayout`（零配置拿到 `refreshToken` 接线 + 内置上/下一条导航）；不传则 `#detail` 原样渲染、本组件零请求                                                                                                                                                                                                                                                                                                                                                                      |
| `detailTitle`     | `string \| ((detailData, record) => string)`                 | 无      | 详情区标题，渲染在详情区顶部                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `viewLayoutProps` | `Omit<ViewLayoutProps, "api" \| "params" \| "refreshToken">` | 无      | 透传给内置 `ViewLayout` 的 props——**详情侧的业务操作按钮走这里**：`{ leftExtraButtons: [...] }` 落到 ViewLayout 工具条左侧、与右侧刷新按钮组同一行（`rightExtraButtons` 则置于 `AutoRefreshGroup` 之前）。🔴 `api` / `params` / `refreshToken` 三键被 `Omit`：它们分别由 `detailApi` / `{ id: activeId }` / `activeId` 占位，是「详情跟着当前项走」这条不变式的载体，放开任一个都能让主干**静默失效**（页面看着正常，详情停在上一条）。**未传 `detailApi` 时无内置 ViewLayout，本项无落点** |
| `listEmpty`       | `boolean`                                                    | `false` | 分流两种空态文案；独立使用时通常不关心                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

### Slots

| 槽              | scope                                                                                                  | 语义                                                                                                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#detail`       | `{ id, record, index, total, hasPrev, hasNext, goPrev, goNext, refreshList, data, loading, fetchSeq }` | 详情内容。`data` / `loading` / `fetchSeq` 仅在传了 `detailApi` 时有值（`fetchSeq` = 成功拉取次数，失败不递增，未传 `detailApi` 恒 0）；独立使用时序列字段为零值。⚠️ `resolvedMode` 只有门面下发，独立成页时无此键（没有形态概念）                                                                                    |
| `#detailBottom` | 同 `#detail`                                                                                           | **详情区内部底边**（透到内置 `ViewLayout` 的 `#bottom`）：`refine` 开时固定在底、不随内容滚，且**自动开 `ViewLayout.fillHeight`** 让它贴住容器底（可经 `viewLayoutProps.fillHeight` 关）。**前提是传了 `detailApi`** —— 没有它就没有内置 `ViewLayout`、本槽无落点（同 `viewLayoutProps` 那条边界）。不传本槽即零渲染 |
| `#empty`        | `{ listEmpty }`                                                                                        | 无当前项时的占位                                                                                                                                                                                                                                                                                                     |

## 反模式 / 注意

- **独立使用时期待上/下一条** —— 没有列表就没有序列，导航句柄是空操作、两端恒 false。要导航就用门面 `AppPageListDetailLayout`
- **业务外层再套 `AppPage`** —— 默认态它自己就是 `AppPage`，套了成两层
- **`embedded=true` 还指望 `dc-app-page-detail` 根类 / `$attrs` 落地** —— 透传态无宿主元素
- **照抄 `SlotLayoutTemplate :disabled` 的写法去做需要具名槽的组件** —— 透传态只渲染默认槽，具名槽会被整个丢掉
- **没传 `detailApi` 却指望 `#detailBottom` 渲染** —— 它透到的是内置 `ViewLayout` 的 `#bottom`，容器都不存在时无落点；此形态下底部条自己写在 `#detail` 末尾
- **把随内容滚的尾部内容放 `#detailBottom`** —— 它是固定区，高度从详情内容可用高里扣；要跟着滚就写在 `#detail` 里

## 关联

- 族系标准与清单：[../README.md](../../README.md)
- 门面：[README-AppPageListDetailLayout.md](../../app-page-list-detail-layout/docs/README-AppPageListDetailLayout.md)

> 目录迁移：实现与配套归入 `components/compose/layout/app-page-detail`；公开契约、兼容别名与 panel 废弃时间点不变。

## C 源码迁移

本组件及配套类型/hooks/测试/API迁至 `packages/forge-compose/src/components`，去掉 pro 重复层。应用消费 `@done-coding/forge`；组件 API、槽与事件不变，Panel已由pn1031退役（C拆包时曾保留）。
