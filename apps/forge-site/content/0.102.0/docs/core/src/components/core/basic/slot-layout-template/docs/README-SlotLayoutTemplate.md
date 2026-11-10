# SlotLayoutTemplate（透明转发包裹器）

> 以 tag 为宿主包裹内容并「透明转发全部插槽」（默认 + 具名 + 作用域）到宿主的布局槽位模板；disabled 时宿主消失、只渲染默认槽内容。
> 范式页：`apps/reference/src/pages/basic/slot-layout/showcase/`（ⓑ 节单槽包裹 / ⓒ 节具名 + 作用域槽全转发）

## 定位

- **何时用**：需要一个「可开关的包裹宿主」——宿主在时把默认 / 具名 / 作用域槽整体转交给 tag 渲染，宿主不在时退化为纯内容渲染
- **何时不用**：需要自定义插槽编排 / 命名转换时直接用普通 `<component :is>` + `<slot>`；需要「主区 + 侧栏」双区布局用 `SlotLayoutFlowAside`
- 实现：Options API `defineComponent` + render 函数（`h(tag, attrs, slots)`）——render 直接把 slots 对象整体喂给 `h()`，绕开模板 slot 类型推断，转发更彻底（含具名 / 作用域槽）
- 内部基石：`SlotLayoutFlowAside` 基于它组合（两侧各一个实例）

## 快速上手（最小可用）

默认 `tag="div"` 即够用——包裹 + 透明转发零配置：

```html
<SlotLayoutTemplate> 包裹内容 </SlotLayoutTemplate>
```

需要「宿主可开关」时（核心场景）加 `disabled`：

```html
<SlotLayoutTemplate :disabled="tplDisabled">
  宿主消失时这里的内容直接渲染
</SlotLayoutTemplate>
```

**要点**：

- 宿主 `tag` 可传原生标签名（`"div"`）/ 组件对象 / 函数式组件；懒加载组件 [MUST] 先经 `defineAsyncComponent` 包裹再传——裸异步工厂 `() => import("./X.vue")` 会被当函数式组件调用、不 resolve Promise
- `inheritAttrs: false`：attrs 整包转发宿主 tag，不落在本组件根上

## 能力边界 / 按需使用

- **透明转发全部插槽（默认 + 具名 + 作用域）：默认即全量生效，是本组件的核心能力，零配置。** 组件存在的全部意义就是把 slots 对象整体交给宿主 tag 渲染——常规包裹使用不需要任何开关。
- **`disabled`：默认 `false`（恒包裹）即够用。** 仅当「宿主存在与否需要运行时切换」（如工具栏按开关决定是否包布局根）才管理该值——判据：宿主在时套布局、宿主不在时退化为纯内容渲染，二者由同一个开关切换。注意 disabled 态只保默认槽（具名槽无落点，属透传语义固有边界）。
- **完整能力演示**（单槽包裹 + 具名 + 作用域槽全转发）：`apps/reference/src/pages/basic/slot-layout/showcase/`（ⓑ / ⓒ 节）——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name       | type                           | 默认    | 语义                                                                                         |
| ---------- | ------------------------------ | ------- | -------------------------------------------------------------------------------------------- |
| `tag`      | `String \| Object \| Function` | `"div"` | 包裹宿主：原生标签名 / 组件对象 / 函数式组件（懒加载组件须先经 `defineAsyncComponent` 包裹） |
| `disabled` | `boolean`                      | `false` | true = 透传态（宿主消失、只渲染默认槽内容）                                                  |

### Emits

无

### Slots

透明转发全部插槽（默认 + 具名 + 作用域）到宿主 tag；disabled 时仅默认槽。

### Expose

无（`inheritAttrs: false`，attrs 转发宿主）

## 反模式 / 注意

- **裸异步工厂直传 tag**：`() => import("./X.vue")` 会被当函数式组件调用、不 resolve Promise，[MUST] 先 `defineAsyncComponent`
- **disabled 态依赖具名槽**：宿主消失后具名槽无落点，disabled 态只保默认槽
- **用模板实现透明转发**：模板内 v-for `$slots` + `<slot :name>` 会触发 vue-tsc TS7022 自指推断，须走 render 函数整体转发

## 关联

- 内部组合方：`SlotLayoutFlowAside`（slot-layout 族，基于本组件组合两侧）
- 范式页：`apps/reference/src/pages/basic/slot-layout/showcase/`（ⓑ / ⓒ 节）

> 目录迁移：本组件及配套归入 `components/basic/slot-layout-template`；仅源码位置变化，包根导入、props、slots 与实例契约保持。
