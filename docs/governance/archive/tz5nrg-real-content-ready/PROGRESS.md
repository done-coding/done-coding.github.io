---
id: tz5nrg
title: 产品站接入真实内容产物前的两处修正
modules: [forge-site, cli-site, site-platform]
created: 2026-11-06
source: 用户 2026-11-06 当轮下发（总协调实测发现）
after: "8j1b88"
---

# 产品站接入真实内容产物前的两处修正

## 任务

| 项 | 状态 | 交付 sha |
|---|---|---|
| Markdown 原始 HTML 关闭与“建设中”判定（whdu9d） | 已完成 | 3b0750c |
| 刷新所涉模块快照和上层摘要 | 已更新 | b7be805 |
| 归档本批并跑治理闸 | 已完成 | 本归档提交 |
| 本批交付归档后立刻、必须、立即开始下一批 `nfp6e3` | nfp6e3 已先行完成并归档（a5aa323），本批之后重跑 verify 覆盖 | |

## 进度

- 2026-11-06 承接（晚于 nfp6e3：本会话 14:40 拉取后未再拉取，没看到总协调 14:47 的串序调整，先做完 nfp6e3；推送前拉取发现后变基到最新 origin/master 并补做本批）。由 Claude 直接实现，未新增依赖。
- 修正 1：site-kit 的产品站配置设 `markdown.html: false`，并在 Markdown 渲染时把正文与行内代码里的 `{{`、`}}` 换成实体——只关 html 时 `{{ value }}` 仍会被 Vue 当作插值吃掉（实测为空），与「纯 Markdown」不符。根 AGENTS.md「内容产物契约」补一句按纯 Markdown 渲染。
- 修正 2：test-site 的正式站断言按是否存在 `content/current.json` 分两种：有则断言渲染文档、不显示建设中；无则显示建设中。夹具另有“有内容不显示建设中”“缺 current.json 显示建设中”两条。
- 夹具新增 `docs/guide/generic.md`：标题 `createBridge<C extends object>(options)`，正文含 `<T>`、`<div class="x">`、`<MyWidget />`、`{{ value }}` 与行内代码 `{{ code }}`，断言均按文本原样显示。
- 验证（Claude 实跑）：`pnpm verify` 通过，站点测试 138 项全部通过（含 nfp6e3 的全部用例）；`pnpm lint` 通过（拆分 testProductSite 以满足复杂度上限）。
- 未验证项：未用总协调那批 forge 0.100.1（445 个文件）与 cli 0.23.3 的真实内容产物实跑——按条目，由总协调重新写入并提交后验证；本仓不改 `apps/*-site/content/`。
- 快照刷新：forge-site、cli-site 补「内容按纯 Markdown 渲染」；site-platform 补渲染规则与夹具说明。上层 SNAPSHOT 无需改动。
- 共享骨架独占方：本批改动 `AGENTS.md`（内容产物契约加一句），未改根 `package.json` 与锁文件。
- 归档时一并把 8j1b88、nfp6e3 归档记录中的交付 sha 更新为变基后的新值（旧 sha 已不在分支上）。
