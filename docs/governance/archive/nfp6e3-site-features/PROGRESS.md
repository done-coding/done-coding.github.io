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

共享骨架独占方：本批改动 `AGENTS.md`（契约补充多版本发布规则、新增「站点检查」一节），未改根 `package.json` 与锁文件；未新增依赖。

## 任务

| 项 | 状态 | 交付 sha |
|---|---|---|
| 版本切换、搜索、SEO、无障碍与性能、兼容性矩阵页（sc87rw） | 已完成 | 36293cc |
| 刷新所涉模块快照和上层摘要 | 已更新 | 2aa35bd |
| 归档本批并跑治理闸 | 已完成 | a5aa323 |
| 收工，向用户报告站点地址、新增功能与未验证项 | 已报告 | |

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
- 快照刷新：portal 由「首页、404、隐私说明」扩为含兼容性矩阵页与 SEO 注入；site-platform 增加 sitemap/robots、SEO/无障碍/体积检查、多版本与搜索；forge-site、cli-site 由「读 current.json 指向的版本」改为「读全部版本目录」并加版本切换与搜索。旧表述只留在 git 历史，快照正文只写当前事实。
- 未验证项：未在真实浏览器里点按版本下拉与搜索框（只核对了 SSR 产物与索引内容）；正式站尚无内容产物，版本切换与搜索只在夹具上验证；未提交到 GitHub Pages（push 待用户授权），线上 sitemap 与 canonical 未实测；中文搜索按标点分句词首匹配的局限已写入 site-kit README。
- 契约说明：AGENTS.md 只补充了站点如何发布多个版本，内容产物格式未变，因此没有向产品仓提 issue；历史版本演示需要相对 base 才能随版本发布，可由用户决定是否转告产品仓。
- 串序偏差：总协调 14:47（北京时间）把串序改为 8j1b88 → tz5nrg → nfp6e3，本会话 14:40 拉取后未再拉取，没有看到这一调整，先执行并归档了本批。推送前拉取时发现，已变基到最新 origin/master，并在本批之后补做 tz5nrg；tz5nrg 改动 site-kit 与站点测试，归档前重跑 `pnpm verify`，同时覆盖本批功能。
