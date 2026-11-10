# DragFloat — 可拖拽悬浮容器

> 通用悬浮触点原语（批次 trsf36）：把任意内容（默认插槽）变成**宿主容器内可拖拽**的
> 悬浮块，自带呼吸光影。第一个消费者 = FormMain 的 AI 填充触发器。

## 定位

固定角落的悬浮入口都可能遮内容——本组件让用户自己拖开。机制（定位 / 容器内约束 /
点击拖拽消歧 / 呼吸光影 / 位置记忆）归组件，内容归插槽。

- 拖拽为**手搓 pointer events**（轮子阶梯记录：EP `useDraggable` 缺容器约束与触屏、
  fork 不算复用；`@vueuse/core` 功能满足但为一个 hook 给发布库引 runtime 依赖不值，
  几十行可替代——DNA #7）。

## 快速上手（最小可用）

```vue
<div
  style="position: relative"
><!-- 宿主 [MUST] 有定位（组件按 offsetParent 约束） -->
  <DragFloat placement="top-right">
    <ElButton circle :icon="MagicStick" />
  </DragFloat>
</div>
```

## 能力边界 / 按需使用

- **约束 = offsetParent 矩形**：拖不出宿主容器；宿主 [MUST] `position: relative/absolute`
  （aiFill 场景 `.dc-form-main` 已是）。
- **点击拖拽消歧**：位移超阈值（3px）的一次按压不触发 click（capture 期拦截）——
  插槽里的按钮 / popover 触发器不会被拖拽误触。
- **位置会话内记忆**（组件实例态，KeepAlive 存活即保留）；不持久化。
- **呼吸光影**：默认开（`breathing`），主色系缓慢明暗（~2.6s 周期），
  `prefers-reduced-motion` 下静止；拖拽中暂停。
- 初始位置只给四角 + offset（YAGNI：自由初始坐标等真实需求出现再加）。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name        | type                                                           | 默认          | 语义                                     |
| ----------- | -------------------------------------------------------------- | ------------- | ---------------------------------------- |
| `placement` | `"top-right" \| "top-left" \| "bottom-right" \| "bottom-left"` | `"top-right"` | 初始停靠角（拖动后失效，以拖后位置为准） |
| `offset`    | `number`                                                       | `0`           | 初始角内缩偏移 px（负值 = 微溢出宿主角） |
| `breathing` | `boolean`                                                      | `true`        | 呼吸光影开关                             |

### Slots

| 槽      | scope | 语义                           |
| ------- | ----- | ------------------------------ |
| default | —     | 悬浮内容（按钮 / 图标 / 任意） |

### Emits

无（拖拽是纯视图态；需要感知位置的场景出现再加）。

## 反模式 / 注意

- [MUST NOT] 把它当 fixed 全局悬浮球用——约束是 offsetParent，不是视口；
  全局悬浮球是另一个需求。
- 宿主无定位时 offsetParent 会逃逸到更外层容器（拖拽范围变大而非报错）——
  消费方自查宿主定位。
- 插槽内容自己的 click 逻辑无需感知拖拽（消歧在组件内做完）。

## 关联

- 消费者：`FormMain` AI 填充触发器（`use-ai-fill.ts` + FormMain 模板挂点）。
- demo：`/basic/drag-float`（组件自身）+ `/form/ai-fill`（消费点）。

> 目录迁移：本组件及配套归入 `components/basic/drag-float`；仅源码位置变化，包根导入、props、slots 与实例契约保持。
