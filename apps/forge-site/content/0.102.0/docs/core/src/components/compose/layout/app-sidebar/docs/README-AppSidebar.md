# AppSidebar（侧边栏积木）

> 左侧栏积木：折叠把手 + MenuTree 菜单渲染（树形 / 分组双形态）+ #top/#bottom 高度自撑插槽；可 aboveHeader 悬浮盖顶。
> 范式页：`apps/reference/src/pages/layout/app-layout/shell/`（DemoCustomShell 自供 shell 积木直引）、`apps/reference/src/pages/layout/app-layout/layout/`（NoSidebar 显隐变体）

## 定位

- **何时用**：内置 AppShell 经典布局已直引；自供 shell 时按需复用（菜单/折叠把手/品牌位自由组合）
- `show` 控制显隐（含折叠把手渲染开关）——false 即不渲染整栏
- `aboveHeader` 时 z-index 2 盖 header（AppLayout 另有 `sidebarAboveHeader` prop 同源传递）
- #top/#bottom 高度自撑（WatchSize 反推 shim 边界）——品牌区/挂件放 #top，底部操作放 #bottom
- 菜单形态由 **bridge 配置**驱动（非 prop）：`bridge.APP_LAYOUT_SIDEBAR_CONFIG.menuGroupMode`（缺省 `false`）

## 菜单形态：树形（默认）/ 分组

`menuGroupMode` 落在 `APP_LAYOUT_SIDEBAR_CONFIG`（`createCoreBridge` 初始化传入，缺省 `false`；因在 `UpdatableConfigKey` 联合内，亦可 `bridge.update("APP_LAYOUT_SIDEBAR_CONFIG", { menuGroupMode: true })` 运行时切换）。AppSidebar 内部读它，**不开放同名 prop**——与 `collapse` 读 `appStore.sidebarIsCollapse` 同范式，业务侧统一在 bridge 一处配置。

|                                  | `menuGroupMode: false`（默认）              | `menuGroupMode: true`                                      |
| -------------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| 菜单渲染                         | MenuTree 树形（父级手风琴，默认收起）       | MenuTree 分组（父级 = 小字号弱色分组标题，子项常驻全展开） |
| 折叠把手 `AppCollapseToggle`     | 渲染                                        | **不渲染**（`show=false`）                                 |
| 侧栏宽度                         | 随折叠态在 `width` / `collapseWidth` 间切换 | 恒取 `width`（展开态）                                     |
| `bridge.layout.sidebarCollapsed` | 生效                                        | **读取被屏蔽**，但持久化值原样保留                         |

**为什么分组形态没有折叠把手**：分组形态的前提是「全展开常驻」，与折叠成图标栏语义互斥；且 EP 的 `--collapse` 规则对 `el-menu-item-group` 支持不全（标题不隐藏、组内叶子不居中），窄栏必然错乱。故直接关掉该形态下的折叠能力，而非去打 EP 补丁。

**⚠️ 折叠持久化的锁死风险与规避**（实现约束，[MUST] 守）：`bridge.layout` 把 `sidebarCollapsed` 持久化进 localStorage。若用户上次折叠过（落盘 `true`），开发者随后打开 `menuGroupMode`，侧栏会以 `collapseWidth` 窄条渲染却**没有把手可展开 → 永久锁死**。规避方式：`menuGroupMode` 为真时在 `store/app.ts` 单点把折叠态**读取**强制为 `false`（`sidebarWidth` 与 `sidebarIsCollapse` 两处共用同一 computed），**[MUST NOT] 写回** `bridge.layout.setSidebarCollapse`——用户的折叠偏好原样留在存储里，关掉分组形态后照常恢复。

## 快速上手（最小可用）

内置 AppShell 经典布局已直引——自供 shell 需要菜单侧栏时最小直引（三必填 prop）：

```vue
<AppSidebar
  :show="showSidebar"
  :menus="sidebarMenus"
  :menuFlatList="menuFlatList"
/>
```

**要点**：

- `show` / `menus`（MenuTree 渲染）/ `menuFlatList`（内部匹配）三必填
- 折叠把手状态由族内共享（`AppCollapseToggle` 内部积木），折叠后仅把手占位——零配置

## 能力边界 / 按需使用

- **`#top` / `#bottom` 高度自撑插槽按需**：默认零配置即菜单栏可用；仅当需要品牌区/挂件（`#top`）或底部操作区（`#bottom`）才填——高度自撑（WatchSize 反推 shim 边界），放多少内容撑多高。
- **`aboveHeader` 默认关**：仅当 sidebar 需要 z-index 2 盖住 header 悬浮时开（与 AppLayout `sidebarAboveHeader` 同源传递，自供 shell 时对齐）。
- **`menuGroupMode` 默认关（树形）即够用**：仅当菜单量小（经验值 ≤ 25 叶子）/ 层级浅、要求零点击看见全部导航才开；量大或层级深仍用树形，否则全展开会变成长滚动条。开启后自动失去折叠能力（见上表）。
- `show=false` 整栏不渲染（含折叠把手）——「收起但保留把手」场景走折叠态而非 `show=false`。
- **完整能力演示**（DemoCustomShell 槽转发范式 + NoSidebar 变体）：`apps/reference/src/pages/layout/app-layout/shell/`、`apps/reference/src/pages/layout/app-layout/layout/`

## 面貌（背景 / 圆角 / 无横向内呼吸）

| 项         | 默认                                                            | 覆盖法                                         |
| ---------- | --------------------------------------------------------------- | ---------------------------------------------- |
| 背景       | `APP_LAYOUT_SIDEBAR_CONFIG.background ?? 主题 bodyColor`        | 配 `background`                                |
| 圆角       | `var(--dc-core-radius, var(--el-border-radius-base))`（随主题） | `APP_LAYOUT_SIDEBAR_CONFIG.style.borderRadius` |
| 横向内呼吸 | **无，[MUST NOT] 补**                                           | ——                                             |

- 圆角与背景**同源**（都在 `appStore.sidebarStyle` 这一份 inline style 里），默认值写在
  `...cfg.style` 展开之前 ⇒ 逃生舱同名键恒赢。
- 🔴 **为什么不像 header / footer 那样补横向 padding**：侧栏里装的是菜单树，
  `.el-menu-item` 自带 `padding: 0 var(--el-menu-base-level-padding)`（默认 20px）——
  外层再让一份就是**双份**，且折叠成图标栏时会把图标挤离中线。
- 🔴 **圆角要看得见，靠的是内部那层裁切盒**（`.app-sidebar-clip`，`inset: 0` + `overflow: hidden`
  - `border-radius: inherit`）：根盒 [MUST] 保持 `overflow: visible`（折叠把手悬挂在外缘），
    故根盒自己裁不了——而 `el-menu` 自带背景色会直接盖住四角。[MUST NOT] 把 clip 层删掉当冗余。
- 收起态（`showSidebar=false` → 宽收 0）零面积、不留圆角残影。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name           | type                            | 默认    | 语义                            |
| -------------- | ------------------------------- | ------- | ------------------------------- |
| `show`         | `boolean`（必填）               | —       | 显隐（含折叠把手渲染开关）      |
| `aboveHeader`  | `boolean`                       | `false` | z-index 2 盖 header             |
| `menus`        | `RouteMetaResolveRaw[]`（必填） | —       | sidebar 区菜单（MenuTree 渲染） |
| `menuFlatList` | `RouteMetaResolveRaw[]`（必填） | —       | 扁平菜单                        |

### Emits

无

### Slots

| 槽                 | scope | 语义                                                           |
| ------------------ | ----- | -------------------------------------------------------------- |
| `#top` / `#bottom` | 无    | 高度自撑（WatchSize 反推 shim 边界）——品牌区/挂件 / 底部操作区 |

### Expose

无

## 反模式 / 注意

- `show=false` 时折叠把手也随整栏不渲染（把手渲染开关即 show）——「收起但保留把手」场景应走折叠态而非 show=false
- **`menuGroupMode` 下还想保留折叠把手**：两者语义互斥且 EP 折叠态不支持分组，[MUST NOT] 强开
- **`menuGroupMode` 下调 `bridge.layout.setSidebarCollapse` / `appStore.changeSidebarCollapseStatus`**：调用不报错但视觉无效（读取被屏蔽），属无效操作
- **给 AppSidebar 加同名 `menuGroupMode` prop 覆盖 bridge**：[MUST NOT]——形态是全 app 一致的布局配置，双真相源会让自供 shell 与内置 shell 表现分叉
- `aboveHeader` 与 AppLayout `sidebarAboveHeader` 语义一致，自供 shell 时两者对齐（DemoCustomShell 透传范式）
- 折叠/展开动画由族内积木承担，[MUST NOT] 自造折叠逻辑

## 关联

- 折叠积木：`AppCollapseToggle`（族内共享，AppSidebar/AppAside 内部使用，未导出）
- 菜单积木：`MenuTree`（menu 族，`groupMode` 双形态详见 [menu 族文档](../../../../nav/README.md)）
- 配置真源：`APP_LAYOUT_SIDEBAR_CONFIG`（bridge，见 bridge 文档）
- 右侧对称积木：`AppAside`
- 内容锚：`#brand` 等（落位见 AppLayout 文档）
- 范式页：`apps/reference/src/pages/layout/app-layout/shell/`、`apps/reference/src/pages/layout/app-layout/layout/`

> 目录迁移：实现与配套归入 `components/compose/layout/app-sidebar`；公开契约、兼容别名与 panel 废弃时间点不变。

## bridge 事件

`sidebar-toggle {collapsed}` 由 bridge.layout.setSidebarCollapse 在状态实际改变后单发。组件把手、store、toggleSidebar、主题/agent、openMenuTo 均汇入同一 setter；重复赋相同值和持久化恢复不报，组件不二次发射。它表示 bridge 状态变化，非可见性变化。

无订阅且 signal 镜像关闭时不求值载荷；事件不代替原业务回调。

## C 源码迁移

本组件及配套类型/hooks/测试/API迁至 `packages/forge-compose/src/components`，去掉 pro 重复层。应用消费 `@done-coding/forge`；组件 API、槽与事件不变，Panel已由pn1031退役（C拆包时曾保留）。

内部菜单引用使用 open/close 窄接口；不把 Vue GlobalComponents 的自动推导约束泄露给消费者，现有菜单控制与插槽行为保持。
