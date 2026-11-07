# hooks 模块

激活态 / 尺寸 / 断点 / 视口高度链 / 主题挂值 / 权限判定等 11 个组合函数，全部经顶层 barrel 导出。

> 详情见 [docs/README.md](./docs/README.md)（hook 清单表 + useActivated 使用范式 + 高度链消费范式）

新增 useBridgeReport：可选注入 core bridge，按事件名约束惰性载荷；没有 bridge 时为空操作。

## forge 拆包 A 迁移说明

底座与 core 原语已整体迁入 `packages/forge-core`（单份实现），应用 `@done-coding/forge` 聚合六实现包并保留原公共导出。内部底座消费走 `@done-coding/forge-core` 的职责桶子路径；21 项注入键继续使用历史 namespace。组件行为/API 不变，panel 与 deprecated 保留。
