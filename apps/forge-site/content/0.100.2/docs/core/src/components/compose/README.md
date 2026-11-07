# pro 组件目录

> 文档定位：索引 · 源码实际归属forge-compose，文档仍按八组登记；应用由forge聚合转出。

Panel整族在拟发布0.100.0-alpha.0具名退役，迁移见包根migrations。layout 收外壳/页面布局，compose 收跨组组合。

| 组件                    | 文档组 | 源码 / 既有 API 文档                                                                                                                                          |
| ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AppAside                | 布局   | 源码 · [API](./layout/app-aside/docs/README-AppAside.md)                                                                   |
| AppBody                 | 布局   | 源码 · [API](./layout/app-body/docs/README-AppBody.md)                                                                       |
| AppFooter               | 布局   | 源码 · [API](./layout/app-footer/docs/README-AppFooter.md)                                                               |
| AppHeader               | 布局   | 源码 · [API](./layout/app-header/docs/README-AppHeader.md)                                                               |
| AppLayout               | 布局   | 源码 · [API](./layout/app-layout/docs/README-AppLayout.md)                                                               |
| AppPage                 | 布局   | 源码 · [API](./layout/app-page/docs/README-AppPage.md)                                                                       |
| AppShell                | 布局   | 源码                                                                                                                       |
| AppSidebar              | 布局   | 源码 · [API](./layout/app-sidebar/docs/README-AppSidebar.md)                                                           |
| ListLayout              | 布局   | 源码 · [API](./compose/list-layout/docs/README-ListLayout.md)                                                         |
| ModalDetail             | 反馈   | 源码 · [API](./compose/modal-detail/docs/README-ModalDetail.md)                                                     |
| ModalForm               | 反馈   | 源码 · [API](./compose/modal-form/docs/README-ModalForm.md)                                                             |
| AppPageDetail           | 布局   | 源码 · [API](./layout/app-page-detail/docs/README-AppPageDetail.md)                                             |
| AppPageListDetailLayout | 布局   | 源码 · [API](./layout/app-page-list-detail-layout/docs/README-AppPageListDetailLayout.md) |
| AppPageListDetailSheet  | 布局   | 源码                                                                                                                   |
| AppPageListDetailSplit  | 布局   | 源码                                                                                                                   |
| ViewLayout              | 布局   | 源码 · [API](./layout/view-layout/docs/README-ViewLayout.md)                                                           |
| ViewLayoutNavigation    | 布局   | 源码                                                                                                                     |
| ViewLayoutToolbar       | 布局   | 源码                                                                                                                        |

组件专属 hook/测试/类型与组件收纳；组内单文件组件直接留在组目录。职责桶按package.json exports提供包间组合，不等于扩增应用公开白名单。完整迁移映射见仓根 `scripts/core-component-path-map.json`。

AppLayout 的 `AppPageNavBarMoreOption` 仅兼容转出 nav 所有的菜单项协议，编排层不再作为 nav 的类型提供方。

## C 源码迁移

本组件及配套类型/hooks/测试/API迁至 `packages/forge-compose/src/components`，去掉 pro 重复层。应用消费 `@done-coding/forge`；组件 API、槽与事件不变，Panel已由pn1031退役（C拆包时曾保留）。
