# MenuItemSub（递归子菜单分组件）

> ElSubMenu 递归分组：含 children 的节点递归渲染子菜单、叶子渲染 ElMenuItem；由 MenuTree 递归自用。
> 范式页：`packages/core/src/components/nav/menu-tree/MenuTree.vue`（内部消费方）

## 定位

- 递归子菜单分组件：节点含 `children` → `ElSubMenu` + 递归子级；叶子 → `ElMenuItem`
- 组件自引用：`MenuItemSub` prop 传入组件自身，供 children 递归再实例化
- 一般由 `MenuTree` 内部使用，独立消费场景少见
- **两种形态下的角色**：
  - MenuTree `groupMode=false`（树形）→ 承接 **L1 及以下**全部有子项的节点
  - MenuTree `groupMode=true`（分组）→ L1 已被 `ElMenuItemGroup` 分组标题接管，本组件**只承接 L2 及更深**层级（即「分组标题内的手风琴」）。分组标题只吃掉一层，深层级仍归本组件——这是分组形态下三级菜单混合渲染的实现落点

## 徽标（badge）

本组件渲染的 ElSubMenu 标题与其下叶子项，同样以各自的 `path` 为 key 查 `bridge.badge` 渲染角标，规则与 MenuTree 一致（未命中零影响、不挤压文案、不聚合）。见 [README-MenuTree.md](../../menu-tree/docs/README-MenuTree.md#徽标badge)。

## 快速上手（最小可用）

MenuTree 内部驱动（menu/MenuTree.vue 片段）：

```html
<MenuItemSub :menu="menu!" :MenuItemSub="MenuItemSub" />
```

## 能力边界 / 按需使用

- **内部递归件，勿直用：MenuTree 递归自用的分组件，独立消费场景少见。** 业务侧 [MUST NOT] 直接 import 消费——children 递归靠 `MenuItemSub` prop 自引用再实例化，仅由 MenuTree 内部驱动。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name          | type                          | 默认 | 语义                                 |
| ------------- | ----------------------------- | ---- | ------------------------------------ |
| `menu`        | `RouteMetaResolveRaw`（必填） | —    | 当前分组节点                         |
| `MenuItemSub` | `any`（必填）                 | —    | 组件自引用，供 children 递归再实例化 |

### Emits

无

### Slots

无（ElSubMenu 标题与子项均由 menu 数据驱动）

### Expose

无

## 反模式 / 注意

- **缺自引用 prop**：children 递归靠 `MenuItemSub` prop 再实例化，缺它无法递归展开子级
- **想在分组形态下把本组件也换成分组标题**：分组标题是视觉聚类不是层级实体，[MUST NOT] 嵌套分组（EP / AntD / shadcn 皆不支持）；L2+ 保持 ElSubMenu 是设计内行为

## 关联

- 消费方：`MenuTree`（menu 族）
- 数据契约：`RouteMetaResolveRaw`（@/types）

> 目录迁移：实现与配套收纳到 `components/nav/menu-item-sub`，包根 API 与演示能力保持。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-nav`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
