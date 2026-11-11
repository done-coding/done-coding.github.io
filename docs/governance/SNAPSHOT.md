# 现状快照

> 文档定位：快照 · 覆盖更新。

- `portal`：首页、404、隐私说明和兼容性矩阵页（构建时读最新验收结果），每页 canonical 与 Open Graph，已启用 Umami Cloud 统计，详见 [模块快照](modules/portal/SNAPSHOT.md)。
- `forge-site`：VitePress 外壳，读内容产物，支持多版本切换与只搜当前版本的站内搜索；当前版本 0.102.0，含完整演示，另有 0.100.1、0.100.2 两个历史版本；首页列出 12 个包的 npm 徽章，详见 [模块快照](modules/forge-site/SNAPSHOT.md)。
- `cli-site`：VitePress 外壳，与 forge 站共用基础（版本切换、搜索同 forge 站）；当前版本 0.24.0，另有 0.23.3 历史版本；首页列出 16 个包的 npm 徽章，各包文档页页首显示徽章，详见 [模块快照](modules/cli-site/SNAPSHOT.md)。
- `site-platform`：拼装（含 sitemap、robots）、站点检查（链接、source map、SEO、无障碍、体积预算）与正反例测试、Pages 工作流、共用 VitePress 基础 `packages/site-kit`；使用本站独立的 Umami 站点 ID（与 showcase 分开统计），门户与文档页加载统计，脚本只在 `done-coding.github.io` 线上域名上报且不带查询参数，产品演示页不加载，详见 [模块快照](modules/site-platform/SNAPSHOT.md)。
- `product-acceptance`：只用已发布产物的黑盒验收运行器，本机 `pnpm acceptance`；最近一次 2026-11-06，33 个用例 11 通过 22 失败，问题草稿 11 份待转交产品仓，详见 [模块快照](modules/product-acceptance/SNAPSHOT.md)。

**跨模块依赖：** 产品站依赖产品仓导出的内容产物，契约见仓根 AGENTS.md。
