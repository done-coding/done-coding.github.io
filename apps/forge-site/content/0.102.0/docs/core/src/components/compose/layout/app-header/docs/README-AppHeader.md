# AppHeader（顶栏积木）

> 顶栏布局积木：#left 品牌/业务入口 + 路由大模块菜单 + #right 操作区（userEntry/settings/themeSwitcher 落位）。
> 范式页：`apps/reference/src/pages/layout/app-layout/shell/`（自供 shell 积木直引）、`apps/reference/src/pages/layout/app-layout/layout/`（NoHeader 显隐变体）

## 定位

- **何时用**：内置 AppShell 经典布局已直引；自供 shell 时按需复用
- #left = 品牌/业务入口（AppLayout `#brand` 锚落位）；#right = userEntry/settings/themeSwitcher 操作区
- 中间区 = 路由大模块菜单（menus 渲染，点击高亮 activeModulePath）
- 整体显隐由 AppLayout 间接控制（store headerStyle.height=0 视觉收起 + dom 保留）
- **面貌（背景 / 圆角 / 横向内呼吸）三项同源** —— 都在 `appStore.headerStyle` 这一份 inline style 里
  （[MUST NOT] 把其中任何一项挪回 scoped CSS：一半 inline 一半 CSS 会让消费方覆盖时只改得动一半）

## 模块条徽标（badge）

模块条的每一项以其路由 **`path` 为 key** 查 `bridge.badge` 注册表，命中则渲染绝对定位角标（数量 / 新 / 更新 / 内测 / 开发中 / 自定义），**不压字、不改变宿主尺寸**；未命中零影响、无需在菜单数据里加字段。

与 AppSidebar 菜单树同一份注册表、同一套 key 规则——同一个 `path` 在两处显示同一个标。

**挂标项留位**（ii3dzw）：角标不占位、向右逃逸，而模块条各项首尾相接 ⇒ 挂标项按实测逃逸量（角标右缘 − 被包内容右缘）
补同宽右内边距，角标不再压右邻项；无标项与此前逐字一致。实现收在同级 `use-header-module-badge-room.ts`
（MutationObserver 追角标出现 / 文案 / 隐藏态；量值与项 padding 无关，无自反馈）。

**新标签页打开**：模块项路由 `meta.menu.target: "_blank"` ⇒ 点击新标签页打开，不 `router.push`、激活模块不变（同 `MenuTree`，见 menu 族 README）。

> AppHeader 的模块条是**自建实现**（扁平一级 + 横向滚动 + `router.push` 切模块），不走 `MenuTree`；徽标是两处各自接入的，行为对齐。契约见 bridge 文档 · 徽标注册表。

## 快速上手（最小可用）

经 AppLayout 内容锚填充后由 shell 落位（App.vue 范式——#brand/#userEntry 即 Header #left/#right 的内容来源）：

```vue
<AppLayout :bridge="appCoreBridge" :appStore="appStore" :userStore="userStore">
  <template #brand><AppBrand /></template>
  <template #userEntry><UserHeaderAction /></template>
</AppLayout>
```

**要点**：

- 自供 shell 直引积木时，把 AppLayout 内容锚转发到对应槽（见 AppSidebar 文档的 DemoCustomShell 槽转发范式）
- `menus` 渲染路由大模块（带 menuIcon 时图标 + 标题）；`menuFlatList` 扁平菜单（必填）供内部匹配

## 能力边界 / 按需使用

- **`show` 勿用于显隐**：声明必填但模板未消费（仅预留未来定位子元素 v-if 接口）——整体显隐由 AppLayout 经 store 间接控制（`headerStyle.height=0` 视觉收起 + dom 保留），默认即够用，[MUST NOT] 自行传值。
- **中间区模块菜单按需**：`menus` / `activeMenu` / `activeModuleMenu` 仅当需要「路由大模块菜单」时才填（默认空数组即无中间菜单区）；`menuFlatList` 必填（内部匹配）。
- `#left` / `#right` 槽内容来自 AppLayout 内容锚转发（`#brand` → `#left`；`#userEntry` / `#settings` / `#themeSwitcher` → `#right`）——内置 shell 零配置；自供 shell 直引时按槽转发范式接住。
- **完整能力演示**（自供 shell 积木直引 + NoHeader 变体）：`apps/reference/src/pages/layout/app-layout/shell/`、`apps/reference/src/pages/layout/app-layout/layout/`

## 面貌与覆盖（背景 / 圆角 / 内呼吸）

| 项         | 默认                                                            | 覆盖法                                        |
| ---------- | --------------------------------------------------------------- | --------------------------------------------- |
| 背景       | `APP_LAYOUT_HEADER_CONFIG.background ?? 主题 bodyColor`         | 配 `background`（支持色 / 渐变 / 背景图）     |
| 圆角       | `var(--dc-core-radius, var(--el-border-radius-base))`（随主题） | `APP_LAYOUT_HEADER_CONFIG.style.borderRadius` |
| 横向内呼吸 | 间距阶梯**模块档**（`gap.size` × 密度 × 1，默认 **8px**）       | `APP_LAYOUT_HEADER_CONFIG.style.padding`      |

- 圆角 / padding 的默认值**在 `...cfg.style` 展开之前**写入 ⇒ `style` 逃生舱里的同名键恒赢，可整体覆盖。
  （`position` / `top` / `left` / `right` / `height` / `background` / `color` 是**引擎托管键**，写在展开之后，
  外部传了也压不过——这条不变。）
- `box-sizing: border-box` 由引擎托管：横向 padding 恒收在盒内，[MUST NOT] 指望消费方的全局 reset。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name                | type                            | 默认       | 语义                                                                |
| ------------------- | ------------------------------- | ---------- | ------------------------------------------------------------------- |
| `show`              | `boolean`（必填）               | —          | ⚠️ 模板内实际未消费（仅预留未来定位子元素 v-if 接口，源码注释口径） |
| `menus`             | `RouteMetaResolveRaw[]`         | `() => []` | 模块菜单                                                            |
| `activeMenu?`       | `RouteMetaResolveRaw`           | 无         | 聚焦的路由菜单                                                      |
| `activeModuleMenu?` | `RouteMetaResolveRaw`           | 无         | 聚焦的模块菜单                                                      |
| `menuFlatList`      | `RouteMetaResolveRaw[]`（必填） | —          | 扁平菜单                                                            |

### Emits

无

### Slots

| 槽       | scope | 语义                                    |
| -------- | ----- | --------------------------------------- |
| `#left`  | 无    | 品牌/业务入口（AppLayout #brand 落位）  |
| `#right` | 无    | userEntry/settings/themeSwitcher 操作区 |

### Expose

无

## 反模式 / 注意

- **`show` 勿用于显隐控制**：声明必填但模板未消费——整体显隐由 AppLayout 经 store 间接控制（headerStyle.height=0 视觉收起 + dom 保留）
- 主题切换器不属 Header 私有：已解耦为 `AppTheme`，经 shell #right 注入（默认内容仍是 AppTheme，经典布局 1:1 镜像）
- **[MUST NOT] 在 scoped CSS 里给 `.app-header-shim` 写死横向 padding**：那会与 inline 的一份打架，且消费方覆盖只改得动一半——横向内呼吸的唯一出处是 `headerStyle`

## 关联

- 内容锚：`#brand` → `#left`；`#userEntry` / `#settings` / `#themeSwitcher` → `#right`（落位见 AppLayout 文档）
- 主题切换：`AppTheme`（themeSwitcher 默认内容）
- 范式页：`apps/reference/src/pages/layout/app-layout/shell/`、`apps/reference/src/pages/layout/app-layout/layout/`

> 目录迁移：实现与配套归入 `components/compose/layout/app-header`；公开契约、兼容别名与 panel 废弃时间点不变。

## C 源码迁移

本组件及配套类型/hooks/测试/API迁至 `packages/forge-compose/src/components`，去掉 pro 重复层。应用消费 `@done-coding/forge`；组件 API、槽与事件不变，Panel已由pn1031退役（C拆包时曾保留）。
