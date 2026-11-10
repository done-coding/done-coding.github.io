---
id: 2zr2pz
title: 文档站启用 Umami 访问统计
modules: [site-platform, portal]
created: 2026-11-10
source: 总协调转达（用户 2026-11-10 要求文档站统计 PV）
after: ""
---

# 文档站启用 Umami 访问统计

复用 done-coding-showcase 已在用的 Umami Cloud 站点，同域 done-coding.github.io 按路径区分 `/`、`/forge/`、`/cli/`、`/done-coding-showcase/`。共享骨架：本批不改根 `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`AGENTS.md`。与在途 0c1oo9（forge-site · product-acceptance）领域不相交。

## 任务

| 项 | 状态 | 交付 sha |
| --- | --- | --- |
| `site.config.json` 的 `analytics.websiteId` 填 `113f1baf-0830-4993-a686-e6a17a04bdcf`；`pnpm lint`、`pnpm verify` 通过 | 未开始 | |
| 核对隐私说明与实际统计行为一致、门户点击事件名 `portal-to-forge` / `portal-to-cli` 不变 | 未开始 | |
| 本机预览打开门户、forge、cli 各一页，浏览器网络层确认请求发往 Umami 且带该 websiteId | 未开始 | |
| 刷新 site-platform / portal 快照，归档本批，`done-coding harness lists` / `check` 通过 | 未开始 | |
| 收工 | | |

## 边界

- 分支 master，显式 pathspec 提交，不 push、不发布。
- Umami 后台是否收到数据由用户登录查看，本批不需要也不持有账号。
- 实施可交 Codex（沙箱内），浏览器验收由 Claude 在沙箱外执行。

## 进度

- 2026-11-10 开工核实：`curl https://done-coding.github.io/done-coding-showcase/analytics.js` 含 `websiteId:"113f1baf-0830-4993-a686-e6a17a04bdcf"`，与下发一致。
