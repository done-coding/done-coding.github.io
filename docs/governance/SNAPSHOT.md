# 现状快照

> 文档定位：快照 · 覆盖更新。

- `portal`：首页、404 和隐私说明，统计按配置开关，详见 [模块快照](modules/portal/SNAPSHOT.md)。
- `forge-site`：VitePress 外壳，读内容产物；尚无产物，显示建设中，详见 [模块快照](modules/forge-site/SNAPSHOT.md)。
- `cli-site`：VitePress 外壳，与 forge 站共用基础；尚无产物，显示建设中，详见 [模块快照](modules/cli-site/SNAPSHOT.md)。
- `site-platform`：拼装、站点检查与反例测试、Pages 工作流、共用 VitePress 基础 `packages/site-kit`；统计 ID 未提供，详见 [模块快照](modules/site-platform/SNAPSHOT.md)。
- `product-acceptance`：只用已发布产物的黑盒验收运行器，本机 `pnpm acceptance`；最近一次 2026-11-06，33 个用例 11 通过 22 失败，问题草稿 11 份待转交产品仓，详见 [模块快照](modules/product-acceptance/SNAPSHOT.md)。

**跨模块依赖：** 产品站依赖产品仓导出的内容产物，契约见仓根 AGENTS.md。
