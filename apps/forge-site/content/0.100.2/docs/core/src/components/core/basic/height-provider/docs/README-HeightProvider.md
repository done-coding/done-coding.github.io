# HeightProvider（视口高度供给）

> 视口高度供给：传入 viewportHeight，按 #header + #footer 两个固定区的实际高度（各自 WatchSize 测高）累加成 reserve 扣减，向 #default 插槽提供 available 高度——页面容器高度链的源头。
> 范式页：无独立范式页（内嵌于 TabsMain refine 精细流等容器；核心实证：`packages/forge-core/src/components/basic/height-provider/__tests__/HeightProvider.test.ts`）

## 定位

- **何时用**：需要「视口高 − 页头高 → 内容可用高」计算的容器源头
- **何时不用**：页签容器直接用 `TabsMain`（内部已接 HeightProvider，无需手动组合）
- 不 inject/provide；Fragment **多根**（header + default + footer 并行渲染，未传的槽不渲染）

## 快速上手（最小可用）

核心实证（`__tests__/HeightProvider.test.ts`）：

```html
<HeightProvider :viewportHeight="480">
  <template #header>...</template>
  <template #default="{ viewportHeight }">...</template>
  <template #footer>...</template>
</HeightProvider>
```

**要点**：

- `#default` scope `{ viewportHeight: available }`，available = max(viewportHeight - reserve, minHeight ?? 0)
- **`reserve = #header 高 + #footer 高`**，两槽各经一个 `WatchSize` 测高——任一区高度变化自动回算
- 两个槽都是**按需渲染**（`v-if="$slots.x"`）：不传即不渲染、也不占 reserve，[MUST NOT] 传一个空 `<template>` 进来占位
- 渲染顺序 = `header → default → footer`（DOM 序即视觉序；本组件不做定位，"固定在底部"由父级的 flex 列方向给出）
- [MUST NOT] 给 WatchSize 设 min-height: available（reserve↔available 反馈环 → 首帧震荡）

## 能力边界 / 按需使用

- **默认场景：被容器组件内嵌消费，业务 [MUST NOT] 手动组合。** `TabsMain` refine 精细流内部即包 HeightProvider、`ListLayout` 已接管高度链——常规页签 / 列表页无需直用本组件。
- **业务直用判据**：自定义容器需要「视口高 − 固定区高 → 内容可用高」计算，且现有容器组件（TabsMain / ListLayout）接不上时才直用——形态：有固定 `#header` / `#footer` 区 + `#default` 需精确撑满到视口底；两区经 WatchSize 量高，高度变化自动回算。
- **`#footer`：仅当需要「不随内容滚的底部固定区」才传。** 只想把内容排在后面（自然流）就别用本组件，直接写在 `#default` 之后——传进 `#footer` 意味着它要从可用高里扣掉。
- **`minHeight`：默认 `0` 即够用。** 仅当内容需要保底高度才设；⚠️ 超 viewportHeight 会撑破父容器——有意设计，[MUST NOT] 当 bug 修。
- **`viewportHeight` 必填**：由父级传入（AppBody 高度链 / 显式值），本组件不 inject/provide。
- **完整能力演示**：无独立范式页——核心实证 `packages/forge-core/src/components/basic/height-provider/__tests__/HeightProvider.test.ts` + `TabsMain` refine 精细流消费（`apps/reference/src/pages/nav/tabs/`）。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name             | type             | 默认 | 语义                                               |
| ---------------- | ---------------- | ---- | -------------------------------------------------- |
| `viewportHeight` | `number`（必填） | —    | 视口可用高度（父级传入）                           |
| `minHeight`      | `number?`        | `0`  | 兜底下限；超 viewportHeight 会撑破父容器——有意设计 |

### Emits

| 事件                        | 载荷            | 语义                           |
| --------------------------- | --------------- | ------------------------------ |
| `childViewportHeightChange` | `value: number` | 可用高度变化（immediate 首发） |

### Slots

| 槽         | scope                           | 语义                                                                |
| ---------- | ------------------------------- | ------------------------------------------------------------------- |
| `#default` | `{ viewportHeight: available }` | 内容区（available = max(viewportHeight - reserve, minHeight ?? 0)） |
| `#header`  | 无                              | 页头固定区（经 WatchSize 测高，计入 reserve）；不传不渲染           |
| `#footer`  | 无                              | 页脚固定区（经 WatchSize 测高，计入 reserve）；不传不渲染           |

### Expose

无

## 反模式 / 注意

- **WatchSize min-height: available 反馈环**：[MUST NOT]——reserve↔available 互算 → 首帧震荡
- **minHeight 超 viewportHeight**：会撑破父容器——有意设计，[MUST NOT] 当 bug 修
- **Fragment 多根**：不能直接作为单根子组件传 class/style 到外部（`TabsRefineFlow` 为此包了一层透明 div）
- **把不该扣的东西塞进 `#footer`**：[MUST NOT]——凡进这个槽的都会从 `#default` 的可用高里扣掉。随内容滚的尾部内容属于内容，写在 `#default` 里

## 关联

- 内部：`WatchSize`（#header / #footer 各一个，量高得 reserve）
- 下游：`TabsMain`（refine 精细流内部包 HeightProvider）/ `ViewLayout`（toolbar 进 #header、`#bottom` 插槽进 #footer）
- 核心实证：`packages/forge-core/src/components/basic/height-provider/__tests__/HeightProvider.test.ts`

> 目录迁移：本组件及配套归入 `components/basic/height-provider`；仅源码位置变化，包根导入、props、slots 与实例契约保持。
