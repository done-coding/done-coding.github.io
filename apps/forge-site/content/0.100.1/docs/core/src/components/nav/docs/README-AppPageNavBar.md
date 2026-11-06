# AppPageNavBar API

> 文档定位：内部 API · 由 AppPage 使用，不从包根导出组件。

- props：`title?: string`、`back?: () => void`、`moreOptions?: AppPageNavBarMoreOption[]`、`onMoreSelect?: (item: AppPageNavBarMoreOption) => void`、`onMore?: () => void`、`keylinePx: string`、`flush?: { top: boolean; left: boolean; right: boolean }`。
- event：`titleBox(el: HTMLElement | undefined)`，供 AppPage 标题位回写。
- slots：`navTitle`（title）、`more`、`tabbar`，以组件模板为准。
- `AppPageNavBarMoreOption`：`label: string`、`value: string | number`。协议定义在 nav 的 `app-page-nav-bar/types.ts`；pro 只消费并兼容转出，包根类型名称与形状不变。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-nav`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。

## 无障碍语义（td1v4s）

更多触发区（菜单与直接回调）均带“更多操作”名称；菜单项与键盘协议不变。
