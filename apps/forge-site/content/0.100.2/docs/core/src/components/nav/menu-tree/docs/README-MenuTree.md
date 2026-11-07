# MenuTree（树形菜单）

> 基于 ElMenu 的配置化菜单：menus 树形数据递归渲染，含**树形（手风琴）/ 分组（section heading）**双形态；routerMode 路由联动、autoClose 选中收合、collapse 折叠透传。
> 范式页：真实消费方为 `AppSidebar`（packages/core/src/components/compose/layout/app-sidebar/AppSidebar.vue）；菜单数据契约范式见 `apps/reference/src/router/modules/test.ts`

## 定位

- **何时用**：侧栏 / 导航需要配置驱动的菜单（递归子菜单、路由联动、折叠态、分组标题）
- **何时不用**：单层 / 少量菜单直接用 ElMenu；菜单数据不来自路由配置时自行组装数据再接入
- 数据驱动：`menus` 树形节点含 `children` 递归出父级容器，叶子渲染 `ElMenuItem`；`menuFlatList` 拍平列表供 autoClose 沿 `parentPath` 递归算父链
- **双形态**：`groupMode=false`（默认）父级 → `ElSubMenu` 手风琴；`groupMode=true` 父级 → `ElMenuItemGroup` 分组标题（详见下节）
- 增强点：routerMode（defaultActive 取 route.path + ElMenu :router）、autoClose（选中一项收合其它展开子菜单）、collapse 透传、ElMenu 其余 attrs 整包透传、open / close expose

## 树形 / 分组双形态（`groupMode`）

|                 | `groupMode=false`（默认，树形）              | `groupMode=true`（分组）                                            |
| --------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| L1 有子项       | `ElSubMenu`，可点击展开 / 收起，**默认收起** | `ElMenuItemGroup :title`，小字号 + 弱色，**不可点、不导航、不折叠** |
| L1 叶子         | `ElMenuItem`                                 | `ElMenuItem`（同左）                                                |
| L2 及更深有子项 | `MenuItemSub` 递归 `ElSubMenu`               | **仍是** `MenuItemSub` 递归 `ElSubMenu`（分组只吃掉一层，见下）     |
| 子项可见性      | 需点击父级才展开                             | 常驻全展开                                                          |

**分组只吃掉一层——三级菜单是混合渲染。** 分组标题是「视觉聚类」而非「层级实体」，一层标题下不能再嵌一层标题（EP / AntD / shadcn 皆如此）。因此 L1 降格为分组标题后，L2 若仍有 `children`，只能继续用 `ElSubMenu` 手风琴。`apps/reference/src/router/modules/test.ts` 实测存在三级嵌套，分组形态下就会呈现「分组标题 + 组内手风琴」的混合形态，这是设计内行为，非缺陷。

**选型判据**：叶子总量小（经验值 ≤ 25）且层级浅 → 分组（零点击可见全部导航，无手风琴的「东西藏哪了」认知负担）；量大或层级深 → 树形（否则全展开变成长滚动条）。

**视觉不自造**：分组标题吃 EP 原生皮肤（`el-menu-item-group__title` = `font-size:12px` + `--el-text-color-secondary`）；需微调只走主题 var（规则 14），[MUST NOT] 写死颜色。

## 徽标（badge）

每个渲染出 `menu.path` 的位置——L1 叶子、L1 分组标题（分组形态）、递归下去的 ElSubMenu 标题与叶子（经 MenuItemSub）——都以 **`path` 为 key** 查 `bridge.badge`，命中即渲染绝对定位角标（不改变宿主尺寸）。

- **零配置**：菜单数据不用加任何字段；未命中不渲染，对既有菜单零影响。
- **不压字、不改尺寸**：角标绝对定位（内部包 ElBadge），跟在标题右侧、不覆盖任何字，且**角标的出现不改变菜单项尺寸**（实测有标/无标逐项宽度差 0）。
- **不聚合**：MenuTree [MUST NOT] 把子项的标上卷到父级，父级只显示注册表里挂在它自己 path 上的 entry。

契约（标记类型 / `expireAt` 失效 / 已知限制）见 [bridge 文档 · 徽标注册表](../../../../bridge/docs/README.md)。

## 快速上手（最小可用）

必填只有 `menus` + `menuFlatList`——默认 ElMenu 主题、无路由联动、无选中收合：

```html
<MenuTree :menus="menus" :menuFlatList="menuFlatList" />
```

**要点**：

- `menus` 必填：树形菜单数据；含 `children` 的节点递归出 `ElSubMenu`
- `menuFlatList` 必填：拍平列表，autoClose 时沿 `parentPath` 算父链
- 菜单数据契约（范式 `apps/reference/src/router/modules/test.ts`）：`meta.menu` 的 `show` / `icon` / `sort` 驱动渲染与排序；`/nav/menu/showcase/page1|page3|page2` 三级嵌套演示递归子菜单，`sort` 1/2/3 演示排序

## 能力边界 / 按需使用

- **`routerMode`：默认关即够用。** 仅当菜单项与路由 path 联动高亮才开——开启后 `defaultActive` 自动取 `route.path`（useRoute）+ ElMenu `:router` 同步开启；注意依赖 vue-router 上下文。
- **`autoClose`：默认关即够用。** 仅当「选中一项后收合其它展开子菜单」才开——父链沿 `menuFlatList` 的 `parentPath` 递归计算，数据缺失时路径链断裂、收合不全。
- **`collapse`：默认不折叠即够用。** 仅当侧栏折叠态需要同步收起菜单才传（透传 ElMenu）。
- **`groupMode`：默认关（树形）即够用。** 仅当菜单量小 / 层级浅、要求全展开常驻导航才开。⚠️ **与 `collapse` 互斥**：分组形态的前提就是「常驻全展开」，两者同时为 true 无意义且 EP 折叠态对 `el-menu-item-group` 支持不全（EP 的 `--collapse` 规则既没隐藏 `el-menu-item-group__title`，也漏掉了 `> .el-menu-item-group > ul > .el-menu-item` 的「藏文字 + 图标居中」，会溢出窄栏）。消费方 [MUST NOT] 同开两者；`AppSidebar` 已在内部保证互斥（见其文档）。
- **颜色 attrs（`background-color` / `text-color` / `active-text-color` 等）：默认 ElMenu 主题即够用。** 仅当需贴合页面主题配色才显式传。
- **完整能力演示**（生产级驱动点 = AppSidebar 内部接线，含折叠 + 路由联动 + 主题配色）：`packages/core/src/components/compose/layout/app-sidebar/AppSidebar.vue`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name           | type                            | 默认    | 语义                                                                                                                            |
| -------------- | ------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `menus`        | `RouteMetaResolveRaw[]`（必填） | —       | 树形菜单数据；含 children 的节点递归出 ElSubMenu                                                                                |
| `menuFlatList` | `RouteMetaResolveRaw[]`（必填） | —       | 拍平列表，autoClose 时沿 parentPath 算父链                                                                                      |
| `routerMode?`  | `boolean`                       | 未设    | 路由模式：true 时 defaultActive 取 route.path（useRoute）+ ElMenu :router 开启                                                  |
| `collapse?`    | `boolean`                       | 未设    | 折叠态透传 ElMenu                                                                                                               |
| `autoClose?`   | `boolean`                       | 未设    | 选中一项后关闭其它展开的 ElSubMenu                                                                                              |
| `groupMode?`   | `boolean`                       | `false` | 分组形态：L1 有子项时渲染 `ElMenuItemGroup` 分组标题（不可点 / 不折叠）替代 `ElSubMenu`；L2+ 仍走 ElSubMenu。与 `collapse` 互斥 |

其余 attrs（`background-color` / `text-color` / `active-text-color` 等 ElMenu props）整包透传。

### Emits

无显式 defineEmits。模板 `v-bind="attrs"` 先展开、`@select` 后声明——外部 `onSelect` 无法覆盖内部 autoClose 逻辑（推断标注）。

### Slots

无（ElMenu default slot 被 menus v-for 占用）。

### Expose

| 方法    | 参数            | 语义                                 |
| ------- | --------------- | ------------------------------------ |
| `open`  | `index: string` | 打开指定菜单（代理 ElMenu 同名方法） |
| `close` | `index: string` | 关闭指定菜单（代理 ElMenu 同名方法） |

## 反模式 / 注意

- **`/nav/menu/showcase/Page1/2/3` 当用法示范**：它们是菜单渲染出的叶子路由页；MenuTree 的真实消费方是 AppSidebar
- **autoClose 缺 parentPath 数据**：父链沿 `parentPath` 递归计算，数据缺失时路径链断裂、收合不全
- **想覆盖内部 @select**：`v-bind="attrs"` 展开在前、`@select` 声明在后，外部 `onSelect` 无法覆盖内部 autoClose 逻辑（推断标注）
- **依赖 vue-router 上下文**：routerMode 使用 `useRoute`，组件须在安装 vue-router 的上下文中使用
- **`groupMode` + `collapse` 同开**：EP 折叠态不支持 `el-menu-item-group`（标题不隐藏 + 组内叶子不居中），窄栏会溢出错乱；两者语义本身也互斥
- **指望 `groupMode` 把整棵树拍平**：它只把 L1 降为分组标题，L2+ 仍是手风琴；要全平请先把菜单数据本身收敛到两层
- **`open` / `close` expose 在分组形态下对 L1 无效**：L1 已不是 `ElSubMenu`（无 index、无展开态），expose 仅对组内仍为 ElSubMenu 的 L2+ 节点有效

## 关联

- 内部递归：`MenuItemSub`（menu 族）
- 消费方：`AppSidebar`（app-layout 族）
- 数据契约：`RouteMetaResolveRaw`（@/types）、`apps/reference/src/router/modules/test.ts`（meta.menu show / icon / sort）

> 目录迁移：实现与配套收纳到 `components/nav/menu-tree`，包根 API 与演示能力保持。

## bridge 事件

`menu-select {path}`：普通菜单真实 select 或 `_blank` 叶子点击各一次。后者仍新开标签，当前路由/高亮不变，不额外触发业务 select；叶子经内部委托归属 MenuTree。失活/卸载不采集，autoClose 与原 onSelect 参数、次数保持。

无订阅且 signal 镜像关闭时不求值载荷；事件不代替原业务回调。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-nav`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
