# AppBreadcrumb（面包屑积木）

> 面包屑积木：menuFlatList 扁平菜单匹配 route.matched 出链，ElBreadcrumb 渲染；emit show 报有链/无链。
> 使用场景：内置 AppBody 已内嵌（ElAffix 顶部吸附）；自供 shell/自定义内容区可按需直引。

## 定位

- 链来源：route.matched 逐项在 menuFlatList 中按 path 命中 → 面包屑链（无链 = 空）
- 高度由 `height` 指定（px），链路渲染 ElBreadcrumbItem（to = item.path）
- `show` emit（immediate watch）：有链 true / 无链 false——宿主（AppBody）据此让出内容区高度（affix 高度）

## 快速上手（最小可用）

常规页面无需直引（见能力边界）；仅自供内容区直引时提供 `height` + `menuFlatList` 两必填 prop（形态同 AppBody 内嵌用法）：

```vue
<AppBreadcrumb :height="24" :menuFlatList="menuFlatList" @show="onAffixShow" />
```

**要点**：

- 有链才渲染（v-show + show emit）；无链时高度让位由宿主处理
- `show` emit 是 immediate watch——挂载即报当前状态
- 匹配是 path 精确命中（route.matched 逐项 find）

## 能力边界 / 按需使用

- **常规页面零配置——勿重复直引**：AppBody 已内嵌 affix 面包屑（显隐 `appStore.showBreadcrumb`、高度 `bridge.APP_LAYOUT_BREADCRUMB_CONFIG`），常规页面 [MUST NOT] 再叠一层直引。
- **仅自供内容区/自定义 shell 才直引**——判据：宿主不是 AppBody。直引时提供 `height` + `menuFlatList` 两必填 prop，并自行处理 `@show` 高度让位（内容区减去 height）。
- 链路 = route.matched ∩ menuFlatList——中间页未登记进 menuFlatList 则不出现（可预期，无需处理）。
- **完整能力演示**（NoBreadcrumb 变体）：`apps/reference/src/pages/layout/app-layout/layout/`

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name           | type                            | 默认 | 语义                          |
| -------------- | ------------------------------- | ---- | ----------------------------- |
| `height`       | `number`（必填）                | —    | 面包屑高度 px                 |
| `menuFlatList` | `RouteMetaResolveRaw[]`（必填） | —    | 匹配 route.matched 出面包屑链 |

### Emits

| 事件   | 载荷              | 语义                                      |
| ------ | ----------------- | ----------------------------------------- |
| `show` | `status: boolean` | 有链 true / 无链 false（immediate watch） |

### Slots

无

### Expose

无

## 反模式 / 注意

- 链路 = route.matched ∩ menuFlatList——未登记进 menuFlatList 的中间页不出现（可预期）
- 自身只报 show 状态，高度让位（内容区减去 height）由宿主（AppBody affix 逻辑）处理
- 内置 AppBody 已内嵌——常规页面 [MUST NOT] 再叠一层直引面包屑

## 关联

- 宿主：`AppBody`（ElAffix 内嵌 + contentViewHeight 让位）
- 配置：bridge.APP_LAYOUT_BREADCRUMB_CONFIG（高度，bridge.update 后跟随）
- 范式页：`apps/reference/src/pages/layout/app-layout/layout/`（NoBreadcrumb 变体）

> 目录迁移：实现与配套收纳到 `components/nav/app-breadcrumb`，包根 API 与演示能力保持。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-nav`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
