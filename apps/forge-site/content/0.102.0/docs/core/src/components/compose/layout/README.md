# pro/layout 组件目录

> 文档定位：索引 · 源码实际归属forge-compose，文档仍按八组登记；应用由forge聚合转出。

panel 保留但已废弃，计划在 1.0-alpha 删除；本轮不删除、不改变公开 API。layout 收外壳/页面布局，compose 收跨组组合。

| 组件                    | 文档组 | 源码 / 既有 API 文档                                                                                                                            |
| ----------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| AppAside                | 布局   | 源码 · [API](./app-aside/docs/README-AppAside.md)                                                                   |
| AppBody                 | 布局   | 源码 · [API](./app-body/docs/README-AppBody.md)                                                                       |
| AppFooter               | 布局   | 源码 · [API](./app-footer/docs/README-AppFooter.md)                                                               |
| AppHeader               | 布局   | 源码 · [API](./app-header/docs/README-AppHeader.md)                                                               |
| AppLayout               | 布局   | 源码 · [API](./app-layout/docs/README-AppLayout.md)                                                               |
| AppPage                 | 布局   | 源码 · [API](./app-page/docs/README-AppPage.md)                                                                       |
| AppShell                | 布局   | 源码                                                                                                                |
| AppSidebar              | 布局   | 源码 · [API](./app-sidebar/docs/README-AppSidebar.md)                                                           |
| AppPageDetail           | 布局   | 源码 · [API](./app-page-detail/docs/README-AppPageDetail.md)                                             |
| AppPageListDetailLayout | 布局   | 源码 · [API](./app-page-list-detail-layout/docs/README-AppPageListDetailLayout.md) |
| AppPageListDetailSheet  | 布局   | 源码                                                                                                            |
| AppPageListDetailSplit  | 布局   | 源码                                                                                                            |
| ViewLayout              | 布局   | 源码 · [API](./view-layout/docs/README-ViewLayout.md)                                                           |
| ViewLayoutNavigation    | 布局   | 源码                                                                                                              |
| ViewLayoutToolbar       | 布局   | 源码                                                                                                                 |

## 页面根三选一

业务页面根只用下面三者之一，[MUST NOT] 互相嵌套（它们各自已以 `.app-page` 为根）。

| 页面形态                               | 页面根                    | 要点                                                                                                                                              |
| -------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 以一批记录为中心（列表 / 列表 + 详情） | `AppPageListDetailLayout` | 只要列表时：`mode="sheet"`、不写 `#detail`、`#list` 里**不** `v-bind="listProps"`。                                                               |
| 路由带 id 的单条详情                   | `AppPageDetail`           | 只有 `detailApi` 与 id 都有时才内置 `ViewLayout`；有 id 无 `detailApi` 只渲染 `#detail`；无 id 落 `#empty`。不适合当自定义页根。                  |
| 其余一切                               | `AppPage`                 | 需要高度精细（refine）时在默认槽**直接**放 `ViewLayout` / `ListLayout` / `TabsMain`：可用高由 AppPage 提供、refine 上下文默认自动生效，无需手算。 |

`AppPageListDetailLayout` 只要列表时的两个坑：

- 不固定 `mode`（默认 `auto`）时视口宽 ≥ `splitAt` 会切成并排形态，右侧详情区空白。
- `#list` 绑了 `listProps` 时，点击行会写入当前项并弹出空详情抽屉。

sheet 档列表的直系父就是 AppPage 默认槽 `.app-page-shim`，与「`AppPage` + 列表」结构相同。以上由 `app-page-list-detail-layout/__tests__/sheet-list-only.test.ts` 锁定。

AppPage 默认槽 [MUST NOT] 再包一层容器：`useContextDefaults` 读直系父 DOM，中间插层会让 refine 上下文默认静默失效。

组件专属 hook/测试/类型与组件收纳；组内单文件组件直接留在组目录。职责桶按package.json exports提供包间组合，不等于扩增应用公开白名单。完整迁移映射见仓根 `scripts/core-component-path-map.json`。

## 本批事件

AppBody 按需采集 body-scroll；sidebar/aside 由 bridge setter 单发折叠事件，组件不重复发。

## 新增组件指引

**新增组件必须补埋点**：按统一要求更新矩阵、事件文档和 reference，运行 `pnpm core:instrumentation`；无事件写明原因。AppBody 负责文档滚动，sidebar/aside 由 bridge setter 单发；组合布局不重复报。

## C 源码迁移

本组件及配套类型/hooks/测试/API迁至 `packages/forge-compose/src/components`，去掉 pro 重复层。应用消费 `@done-coding/forge`；组件 API、槽与事件不变，Panel已由pn1031退役（C拆包时曾保留）。

## 无障碍 API（td1v4s）

内部 ViewLayoutNavigation 的上下条图标按钮默认名称为“上一条”“下一条”，不新增 prop。

AppSidebar 内部菜单引用只需要 open/close，不把子组件自动推导实例带入公开声明。

AppBody 在自身 `.app-body` 元素声明 `box-sizing: border-box`，使 min-height 包含 chrome padding，自身尺寸不依赖宿主全局 reset；宿主仍按 forge README 设置 border-box 约定。不对后代或业务插槽强加盒模型。
