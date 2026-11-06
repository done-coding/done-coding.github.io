# WatchSize（尺寸观测组件）

> 通用尺寸观测：包一层即得自身 clientHeight / clientWidth 变化（激活首测 + window resize + onUpdated + 可选 ResizeObserver），按 mode 派发 heightChange / widthChange。
> 范式页：无独立范式页——组件级测量工具，被容器组件内嵌消费（核心实证：`packages/forge-core/src/components/display/__tests__/`）

## 定位

- **何时用**：需要拿到「自身盒子」尺寸变化的容器组件内部 / 消费方包装层
- **何时不用**：需要「视口高 − 页头高 → 内容可用高」计算的场景用 `HeightProvider`（本组件只报自身测量值，不算账）
- 测量时机：激活首测 + window resize + onUpdated（激活态）+（可选）RO；失活 cancel 在途防抖、卸载 flush 补发终值

## 快速上手（最小可用）

```html
<WatchSize mode="height" @height-change="onHeightChange">
  <div>...</div>
</WatchSize>
```

**要点**：

- `observeResize` 默认关；需要测「不触发自身重渲染的尺寸变化」（CSS 过渡折叠 / 异步撑开）时开启 RO
- `debounceTime` 只吃初始值，后续变化不更新
- 失活 cancel 在途防抖、卸载 flush 补发终值——终值不丢

## 能力边界 / 按需使用

- **`observeResize`（ResizeObserver）：默认关。** 默认测量链（激活首测 + window resize + onUpdated）已覆盖「渲染驱动的尺寸变化」（v-if/v-show / 样式响应式）——普通场景即够用；仅当测「不触发自身重渲染的尺寸变化」（CSS 过渡折叠 / 异步撑开）才开——判据：尺寸变化过程中组件自身不重渲染、onUpdated 读不到最终值。
- **`debounceTime`：默认 `16`ms 即够用。** 仅当变化频率极高（连续 resize / 连续折叠）需聚合事件流时才调大；⚠️ 只吃初始值，后续变化不更新。
- **`mode`：默认 `"height"`。** 仅需横向尺寸（侧栏宽 / 横向布局）才设 `"width"` / `"both"`。
- **优先复用容器内嵌，[MUST NOT] 重复造轮**：ListLayout（header / 操作槽量高）、HeightProvider（#header 量高得 reserve）等已内嵌消费本组件；仅自定义容器需要自身盒尺寸时才直用。
- **完整能力演示**：无独立范式页（组件级测量工具）——核心实证 `packages/forge-core/src/components/display/__tests__/`。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name            | type                             | 默认       | 语义                                                                                        |
| --------------- | -------------------------------- | ---------- | ------------------------------------------------------------------------------------------- |
| `mode`          | `"height" \| "width" \| "both"?` | `"height"` | 观测维度，按 mode 派发 heightChange / widthChange                                           |
| `observeResize` | `boolean?`                       | `false`    | 是否 ResizeObserver 观测自身盒，可测「不触发自身重渲染的尺寸变化」（CSS 过渡折叠/异步撑开） |
| `debounceTime`  | `number?`                        | `16`       | 防抖毫秒；⚠️ 只吃初始值，后续变化不更新                                                     |

### Emits

| 事件           | 载荷            | 语义                                   |
| -------------- | --------------- | -------------------------------------- |
| `heightChange` | `value: number` | 高度变化（clientHeight，按 mode 派发） |
| `widthChange`  | `value: number` | 宽度变化（clientWidth，按 mode 派发）  |

### Slots

| 槽         | scope | 语义       |
| ---------- | ----- | ---------- |
| `#default` | 无    | 被观测内容 |

### Expose

无

## 反模式 / 注意

- **过渡动画尺寸变化未开 observeResize**：onUpdated 读起点漏最终值（CSS transition 期间）——动画折叠场景 [MUST] 开 RO
- **动态改 debounceTime**：只吃初始值，后续变化不更新（无效）

## 关联

- 下游消费：`HeightProvider`（#header 槽经 WatchSize 测高得 reserve）
- 核心实证：`packages/forge-core/src/components/display/__tests__/`

> 目录迁移：本组件及配套归入 `components/basic/watch-size`；仅源码位置变化，包根导入、props、slots 与实例契约保持。
