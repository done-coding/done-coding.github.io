# SlotLayoutFlowAside（主区 + 侧栏流式布局）

> 「主区 + 侧栏」双槽流式布局：默认槽为主区、`#aside` 为侧栏；`v-model:separate` 切换分离态（侧栏 absolute 定位 + 主区 padding 让位）。
> 范式页：`apps/reference/src/pages/basic/slot-layout/showcase/Index.vue`

## 定位

- **何时用**：页面 / 卡片内部需要「主区 + 侧栏」双区布局，且要求侧栏在分离态下绝对定位、主区自动让位
- **何时不用**：整页级左右布局交给 app-layout 族（AppSidebar / AppAside）；只差一个静态侧栏时直接写两列 flex
- 内部组合：基于 `SlotLayoutTemplate` 组合（两侧各一个实例），非分离态下不做 absolute、不占位让位
- 分离态行为：`type` 决定侧栏贴左 / 贴右；`asideWidth` 控制侧栏宽；`asideMaxHeight` 限高、超出滚动；主区 padding 为侧栏让位（含 -1px 亚像素补偿）
- 消费方：ListLayout `separateSearch`（搜索 / header / 操作区整体移入侧栏）即基于本组件

## 快速上手（最小可用）

默认值即够用——侧栏贴右、240px 宽、常规文档流：

```html
<SlotLayoutFlowAside>
  <template #aside>侧栏</template>
  主区
</SlotLayoutFlowAside>
```

需要分离态时 `v-model:separate` 切换：

```html
<SlotLayoutFlowAside v-model:separate="separate">
  <template #aside>侧栏（absolute 定位）</template>
  主区（padding 让位）
</SlotLayoutFlowAside>
```

**要点**：

- `v-model:separate`：true = 分离态（侧栏 absolute 定位 + 主区 padding 让位）；false = 常规文档流，无 absolute、无让位
- `type` 决定侧栏贴左 / 贴右；侧栏宽由 `asideWidth` 控制

## 能力边界 / 按需使用

- **`v-model:separate`：默认 `false`（常规文档流）即够用。** 仅当侧栏需要「绝对定位脱离文档流 + 主区自动让位」才开分离态——判据：侧栏内容超高需独立滚动、且不挤占主区布局（ListLayout `separateSearch` 把搜索 / header / 操作区整体移入侧栏即此场景）。
- **`type` / `gap` / `asideWidth`：默认贴右 / `12px` / `240px` 即够用。** 仅当侧栏要贴左、间距或宽度与默认不同才显式传。
- **`asideMaxHeight`：默认 `100vh` 即够用（容器内实际取 `min(100%, 100vh)`）。** 仅当容器超高、需要限高承接侧栏滚动才显式限高——判据：侧栏内容比容器高且要独立滚动（超高滚动依赖分离态 + `asideMaxHeight`，两者缺一不可）。
- **完整能力演示**（全 props 分离态互动面板）：`apps/reference/src/pages/basic/slot-layout/showcase/Index.vue`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（`SlotLayoutFlowAsideProps`，types.ts 导出）

| name             | type                | 默认      | 语义                     |
| ---------------- | ------------------- | --------- | ------------------------ |
| `type`           | `"left" \| "right"` | `"right"` | 侧栏所在侧               |
| `gap`            | `string`            | `"12px"`  | 主区与侧栏间距           |
| `asideWidth`     | `string`            | `"240px"` | 侧栏宽度                 |
| `asideMaxHeight` | `string`            | `"100vh"` | 侧栏最大高度（超出滚动） |

### Emits

无（`v-model:separate` 走 defineModel）

### Slots

| 槽        | 语义 |
| --------- | ---- |
| `default` | 主区 |
| `#aside`  | 侧栏 |

### Expose

无

## 反模式 / 注意

- **非分离态下期待 absolute 行为**：`v-model:separate=false` 时侧栏与主区走常规文档流（垂直排布、无让位），绝对定位只在分离态生效
- **容器级忘给 asideMaxHeight**：默认 `100vh` 在容器内实际取 `min(100%, 100vh)`，容器超高场景记得显式限高（如上例 `320px`）
- **侧栏超高溢出**：超高滚动依赖分离态 + `asideMaxHeight`，两者缺一不可

## 关联

- 内部基石：`SlotLayoutTemplate`（slot-layout 族）
- 消费方：`ListLayout` `separateSearch`（list-layout 族）
- 范式页：`apps/reference/src/pages/basic/slot-layout/showcase/Index.vue`

> 目录迁移：本组件及配套归入 `components/basic/slot-layout-flow-aside`；仅源码位置变化，包根导入、props、slots 与实例契约保持。
