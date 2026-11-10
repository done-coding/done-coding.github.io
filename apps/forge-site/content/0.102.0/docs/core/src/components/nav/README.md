# nav 组件目录

> 文档定位：索引 · 本批整体迁至 packages/forge-nav/src/components；实际实现只保留一份，旧 admin-core 根保留原契约。

| 组件            | 文档组 | 源码 / 既有 API 文档                                                                              |
| --------------- | ------ | ------------------------------------------------------------------------------------------------- |
| AppBreadcrumb   | 导航   | 源码 · [API](./app-breadcrumb/docs/README-AppBreadcrumb.md) |
| AppPageNavBar   | 导航   | 源码                                                      |
| TabsHeader      | 导航   | 源码                                                              |
| TabsMain        | 导航   | 源码 · [API](./tabs-main/docs/README-TabsMain.md)                     |
| TabsNaturalFlow | 导航   | 源码                                                                     |
| TabsRefineFlow  | 导航   | 源码                                                     |
| TabsTile        | 导航   | 源码                                                                  |
| MenuItemLeaf    | 导航   | 源码 · [内部 API](./docs/README-MenuItemLeaf.md)                            |
| MenuItemSub     | 导航   | 源码 · [API](./menu-item-sub/docs/README-MenuItemSub.md)       |
| MenuTree        | 导航   | 源码 · [API](./menu-tree/docs/README-MenuTree.md)                     |

组件专属 hook/测试/类型与组件收纳；组内单文件组件直接留在组目录。职责桶作为包间实现契约由新包 exports 声明，应用根只转出白名单。完整迁移映射见仓根 `scripts/core-component-path-map.json`。

AppPageNavBar 的菜单项协议由 nav 自身定义，pro 的 AppLayout 类型入口兼容转出同一类型，nav 不再引用 pro。内部 API 见 [AppPageNavBar](./docs/README-AppPageNavBar.md)。

## 本批事件

TabsMain 统一 tab-change，MenuTree 统一 menu-select（含 \_blank）；详情见对应组件文档。

## 新增组件指引

**新增组件必须补埋点**：按统一要求（根 docs/component-development.md 规则27）更新矩阵、事件文档和 reference，运行 `pnpm core:instrumentation`；无事件写明原因。TabsMain / MenuTree 统一报告；header、tile 和菜单叶子只委托。

## B 包迁移

`@done-coding/forge-nav` 提供本族根入口与职责桶子路径，组件行为/API不变。应用聚合 `@done-coding/forge` 保留原名字、别名及类型；本族只依赖 forge-core 的公共桶，21共享键由底座单一定义。组件、专属 hook、类型、样式、测试与API文档一起迁移；panel已迁forge-compose且仍保留。CSS通过本包style.css显式消费。

## 无障碍语义（td1v4s）

AppPageNavBar 更多菜单/回调触发区默认名称“更多操作”，键盘触发保持。
