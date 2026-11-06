---
id: nfp6e3
title: 组织站功能补齐
modules: [portal, forge-site, cli-site, site-platform]
created: 2026-11-06
source: 用户 2026-11-06 当轮下发
after: "tz5nrg"
---

# 组织站功能补齐

> 开始前先确认 `tz5nrg`（真实内容产物前的站点修正）已归档；未归档就先执行 `tz5nrg`，再回到本批。（总协调 2026-11-06 调整串序：8j1b88 → tz5nrg → nfp6e3）

## 任务

| 项 | 状态 | 交付 sha |
|---|---|---|
| [版本切换、搜索、SEO、无障碍与性能、兼容性矩阵页](sc87rw-site-features.md) | 待开始 | |
| 刷新所涉模块快照和上层摘要 | 待开始 | |
| 归档本批并跑治理闸 | 待开始 | |
| 收工，向用户报告站点地址、新增功能与未验证项 | | |

## 进度

- 2026-11-06 承接（8j1b88 全量矩阵运行期间先行编码，8j1b88 归档后再提交本批）。Codex 未登录、DeepSeek 时段处于高峰，由 Claude 直接实现；未新增依赖（本地搜索用 VitePress 自带的 minisearch）。
- 设计：
  - 版本切换：`content/` 下每个版本目录都发布，当前版本在原路径，其余在 `v/<版本>/`（各有首页、文档、侧栏）；导航的版本下拉只在多于一个版本时出现。产品仓演示按 `/<产品>/demo/` 构建，历史版本的演示若引用这个绝对路径会加载到当前版本资源，所以只发布不引用它的演示，版本首页写明原因。
  - 搜索：VitePress 本地搜索，`_render` 对 `v/` 下页面返回空，只索引当前版本；无内容（建设中）时不启用。中文按标点分句、词首匹配，已实测并写进 site-kit README。
  - SEO：产品站 canonical/OG 由 `transformHead` 生成；门户由 build-static 注入（缺 description 构建失败，noindex 的 404 不加）；拼装时生成全站 sitemap.xml 与 robots.txt。
  - 检查：check-site 增加 SEO 与 sitemap 收录、图片 alt、标题跳级、html lang、体积预算（site.config.json `budgets`）。演示目录只查链接与 source map。
  - 兼容性矩阵：门户 `compatibility.html` 占位，`render-compatibility.mjs` 构建时读最新日期目录的 results.json，转义输出；无结果显示「暂无验收结果」。
- 夹具构建实测（forge-site，含历史版本 0.0.0-older）：历史文档、首页、可迁移演示均在 `/forge/v/0.0.0-older/`；搜索索引含「样例入门」、不含历史版本标记词；canonical/OG 正确。
- 验证（Claude 实跑）：`pnpm verify` 构建与站点检查通过；`scripts/test-site.mjs` 134 项全部通过（首次跑出 2 项失败：单版本用例用「版本 x」判断下拉，与首页标语「当前文档版本 x」撞字，改为判断下拉特有的「x（当前）」项后通过）；`pnpm lint` 通过。正式产物 `dist/compatibility.html` 已填入 2026-11-06 结果（模板 1/19、forge 0/1、cli 10/13 通过），`sitemap.xml` 5 个地址，`robots.txt` 指向它；产物无 source map（站点检查覆盖）。
- 正反例对照：版本切换（多版本显示／单版本不显示、历史演示可迁移发布／绑定当前路径不发布、历史版本目录名非法或缺 nav 构建失败）；搜索（索引含当前版本／不含历史版本、无内容不生成索引、正式站不含夹具）；SEO（sitemap、robots、canonical、OG 正例／缺 canonical、canonical 指向别处、缺 description、未列入 sitemap、缺 sitemap、缺 robots、门户缺 description 构建失败）；无障碍与体积（合规页面与演示内问题放行／缺 alt、标题跳级、缺 lang、脚本与页面超预算）；兼容性矩阵（取最新结果、按产品列版本与通过数、标出失败步骤、转义 HTML／无结果显示「暂无验收结果」、非日期目录忽略）；统计开关覆盖新增的矩阵页。
