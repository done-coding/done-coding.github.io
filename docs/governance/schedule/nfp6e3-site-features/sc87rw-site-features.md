---
id: sc87rw
title: 版本切换、搜索、SEO、无障碍与性能、兼容性矩阵页
modules: [portal, forge-site, cli-site, site-platform]
created: 2026-11-06
parent: ""
---

# 版本切换、搜索、SEO、无障碍与性能、兼容性矩阵页

先读本仓根 AGENTS.md（含「内容产物契约」）。不改 `apps/*-site/content/`（由产品仓写入）。优先用 VitePress 自带能力，不引入新的重依赖；新增依赖写明许可证。

1. **内容版本切换**：产品站按 `content/` 下的版本目录与 `current.json` 生成版本选择，默认显示 current；切换后链接与 demo base 正确。只有一个版本时不显示切换。
2. **站内搜索**：用 VitePress 本地搜索；只索引当前版本文档，不索引夹具。
3. **SEO 与分享**：生成 sitemap.xml、robots.txt；每页 title、description、canonical 与 Open Graph 元信息；站点根路径为 `https://done-coding.github.io/`。
4. **无障碍与性能**：在站点检查脚本中加入可机械判断的检查（如图片缺 alt、标题层级跳级、主要产物体积预算超限即失败）；不跑浏览器全量。
5. **兼容性矩阵页**：门户新增一页，读取 `docs/governance/audits/acceptance/` 下最新一次的 results.json（构建时读取，不运行验收），按产品与模板展示通过/失败与版本；没有结果时显示“暂无验收结果”。
6. 统计仍按现有开关：未提供真实 websiteId 时保持关闭。

验收：每项在 `scripts/test-site.mjs` 中至少一个正例与一个反例；`pnpm verify`、`pnpm lint`、治理闸通过；构建产物不含源码与 source map。
