# AppAside（右侧补充区积木）

> 右侧补充区积木（对称 AppSidebar）：默认 slot 承载右侧面板内容；核内默认宽 0，app/preset 加宽启用。
> 范式页：`apps/reference/src/App.vue`（AppLayout #aside 锚经 shell 落位到 AppAside 默认槽）、`apps/reference/src/pages/layout/app-layout/shell/`

## 定位

- **何时用**：右侧补充区（对话面板/属性栏等）——AppLayout `#aside` 内容锚的落位目标
- 始终渲染（对称 sidebar）；核内默认宽 0 → 经典布局 1:1 无右间隙；app/preset 加宽即启用
- 无内置内容——内容完全由默认 slot 提供
- `show=false` 整列不渲染

## 快速上手（最小可用）

业务侧只填 AppLayout `#aside` 锚（App.vue 范式——内容经 shell 中转喂进 AppAside 默认槽）：

```vue
<AppLayout :bridge="appCoreBridge" :appStore="appStore" :userStore="userStore">
  <template #brand><AppBrand /></template>
  <template #userEntry><UserHeaderAction /></template>
  <template #aside><ChatAsidePanel /></template>
</AppLayout>
```

**要点**：

- `#aside` 内容锚单实例（同 #brand/#userEntry 范式），落位权归 shell

## 能力边界 / 按需使用

- **宽度不在组件自身**：核内默认宽 0（经典布局 1:1 无右间隙）——加宽由 app/preset 配置（`bridge.APP_LAYOUT_ASIDE_CONFIG.width`）启用，[MUST NOT] 在 AppAside 自身调宽度。
- **无 `#aside` 内容即空渲染**：始终渲染（对称 sidebar）但无内置内容——不填即零右间隙，填了才出现右侧补充区。
- `show` 显隐基线来自路由 `meta.layout.aside`（store showAside），false 整列不渲染。
- **完整能力演示**（#aside 锚 + 自供 shell）：`apps/reference/src/App.vue`、`apps/reference/src/pages/layout/app-layout/shell/`

## 面貌（背景 / 圆角 / 无横向内呼吸）

与 `AppSidebar` **同口径**（对称积木，[MUST] 一起改）：背景 `APP_LAYOUT_ASIDE_CONFIG.background ?? 主题 bodyColor`、
圆角 `var(--dc-core-radius, var(--el-border-radius-base))`，两者同在 `appStore.asideStyle` 这一份 inline style 里，
默认值写在 `...cfg.style` 展开之前 ⇒ `APP_LAYOUT_ASIDE_CONFIG.style.borderRadius` 可整体覆盖。

- **不给横向内呼吸**：内容由消费方经默认插槽自填，呼吸归内容自己——core 代为让白会与内容自带的 padding 叠成双份。
- 圆角由既有的 `.app-aside-clip`（`inset: 0` + `overflow: hidden`）承接裁切（已补 `border-radius: inherit`）；
  根盒 `overflow: visible` 是折叠把手悬挂所需，[MUST NOT] 改。
- 折叠 / 隐藏态宽收 0 ⇒ 零面积、不留圆角残影。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name   | type              | 默认 | 语义                     |
| ------ | ----------------- | ---- | ------------------------ |
| `show` | `boolean`（必填） | —    | 显隐（false 整列不渲染） |

### Emits

无

### Slots

| 槽        | scope | 语义                         |
| --------- | ----- | ---------------------------- |
| `default` | 无    | 右侧补充区内容（无内置内容） |

### Expose

无

## 反模式 / 注意

- **别给 AppAside 塞「布局默认内容」**：内容全部来自默认 slot（经 `#aside` 锚），无内置内容
- **别在 AppAside 自身调宽度**：核内默认宽 0，加宽由 app/preset 决定
- 无填 `#aside` 则空渲染——经典布局无右间隙（1:1 镜像）

## 关联

- 对称积木：`AppSidebar`
- 内容锚：`#aside`（AppLayout 5 锚之一，`AppShellContentAnchor`）
- 范式页：`apps/reference/src/App.vue`、`apps/reference/src/pages/layout/app-layout/shell/`

> 目录迁移：实现与配套归入 `components/compose/layout/app-aside`；公开契约、兼容别名与 panel 废弃时间点不变。

## bridge 事件

`aside-toggle {collapsed}` 由 bridge.layout.setAsideCollapse 在状态实际改变后单发。组件把手、store、toggleAside 与主题/agent 共用该入口；重复赋值和持久化恢复不报，组件不二次发射。它表示 bridge 状态变化，非可见性变化。

无订阅且 signal 镜像关闭时不求值载荷；事件不代替原业务回调。

## C 源码迁移

本组件及配套类型/hooks/测试/API迁至 `packages/forge-compose/src/components`，去掉 pro 重复层。应用消费 `@done-coding/forge`；组件 API、槽与事件不变，Panel已由pn1031退役（C拆包时曾保留）。
