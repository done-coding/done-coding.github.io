# MenuItemLeaf 内部 API

> 文档定位：说明 · MenuTree / MenuItemSub 的内部叶子件，不属于包根公开入口。

## API

接收 `menu: RouteMetaResolveRaw`。普通项交给 Element Plus select；`menuTarget: "_blank"` 不传 index，沿用 routerOpenInNewTab，当前路由与高亮保持。点击经族内私有 report 委托向 MenuTree 报一次 `menu-select {path}`，不额外 emit select，不独立声明另一套事件。失活/卸载不采集。委托键只供族内使用，不增加公开注入契约。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-nav`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
