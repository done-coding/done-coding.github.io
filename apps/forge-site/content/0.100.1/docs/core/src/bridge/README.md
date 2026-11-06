# bridge 模块（接线中枢）

`createCoreBridge(options)` 产出 `CoreBridge` 单例——认证 / 布局 / 主题 / 徽标 / 路由派生的总接线口，经 `app.use(bridge)` 全局注入（`CORE_BRIDGE_KEY`）。

> 详情见 [docs/README.md](./docs/README.md)（导出面 / 接线范式 / 认证与请求接线）

## 内部契约整理（30mf7k 第一批）

配置数据契约与 bridge/plugin 接口分别定义在 `contracts/config.ts`、`contracts/bridge.ts`，原 `bridge/index.ts` 保留全部公开转出；工厂只消费契约。实例状态与插件安装行为不变。

事件能力：按实例隔离的同步 onEvent/emitEvent，总线默认静默；API 与登记目录见 docs/README.md 的事件总线章节。

布局事件：`layout.setSidebarCollapse` / `setAsideCollapse` 实际改变后报告 `sidebar-toggle` / `aside-toggle`，载荷 `{collapsed}`。toggle、store、主题/agent、openMenuTo 共用 setter；持久化恢复与相同赋值不报。bridge 状态不依赖某个组件的激活态；无采集需求不求值载荷。

## forge 拆包 A 迁移说明

底座与 core 原语已整体迁入 `packages/forge-core`（单份实现），应用 `@done-coding/forge` 聚合六实现包并保留原公共导出。内部底座消费走 `@done-coding/forge-core` 的职责桶子路径；21 项注入键继续使用历史 namespace。组件行为/API 不变，panel 与 deprecated 保留。

## 持久化依赖边界

bridge.useState及主题/布局缓存使用现有storage与watch；不依赖pinia-plugin-persistedstate。应用继续createPinia并使用原store工厂，无需空注册插件；业务自定义persist store的插件由应用管理。dev.1仅清理未使用强制peer，不改cache key、存储或恢复行为。
