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
| `site.config.json` 的 `analytics.websiteId` 填 `113f1baf-0830-4993-a686-e6a17a04bdcf`；`pnpm lint`、`pnpm verify` 通过 | 已完成 | 见收口 |
| 核对隐私说明与实际统计行为一致、门户点击事件名 `portal-to-forge` / `portal-to-cli` 不变 | 已完成 | 见收口 |
| 本机预览打开门户、forge、cli 各一页，浏览器网络层确认请求发往 Umami 且带该 websiteId | 已完成 | 见收口 |
| 刷新 site-platform / portal 快照，归档本批，`done-coding harness lists` / `check` 通过 | 已完成 | 见收口 |
| 收工 | | |

## 边界

- 分支 master，显式 pathspec 提交，不 push、不发布。
- Umami 后台是否收到数据由用户登录查看，本批不需要也不持有账号。
- 实施可交 Codex（沙箱内），浏览器验收由 Claude 在沙箱外执行。

## 进度

- 2026-11-10 开工核实：`curl https://done-coding.github.io/done-coding-showcase/analytics.js` 含 `websiteId:"113f1baf-0830-4993-a686-e6a17a04bdcf"`，与下发一致。

- 2026-11-10 第 1、2 项与快照刷新交 Codex（gpt-6.1-sol low，workspace-write，不提交）实施；以下四条为其记录，Claude 已复核 diff（仅 `site.config.json` 与三份快照）。
- 已设置 `analytics.websiteId`，其他配置字段不动。核对 `scripts/build-static.mjs`、`packages/site-kit/index.mjs`、`packages/site-kit/product.mjs`：门户与文档注入脚本，演示单独复制；现有 forge 演示 HTML 无 Umami。隐私启用块与该行为一致，两个门户点击事件名未改，故不改隐私源文件。
- 已检查 `scripts/test-site.mjs`：正式站断言不假设 websiteId 为 null；门户及 VitePress 的 null / 有值构建测试均保留，无需改测试。
- 快照刷新：site-platform 的“ID 为 null、不加载”与总快照的“统计 ID 未提供”替换为已配置复用 showcase 的 ID、门户与文档启用、演示不加载；portal 明确当前已启用和输出启用版隐私说明。旧事实固定保存在本批 `PROGRESS.md`，快照只保留当前事实。
- 验证完成：`pnpm verify` 退出码 0（站点测试全部通过，含门户与 VitePress 的 null / 有值构建及点击事件测试）；随后独立运行 `pnpm lint` 退出码 0。首轮 lint 与 verify 并行时，ls-lint 扫描正在重建的 forge dist，因文件暂不存在退出 1，串行重跑已通过。
- dist 定向检查：`dist/index.html`、`dist/forge/index.html`、`dist/cli/index.html` 均含 `https://cloud.umami.is/script.js` 与指定 `data-website-id`；`dist/forge/demo/index.html` 搜索 Umami 无匹配；`dist/privacy.html` 含启用版 Umami 文案与加载范围，不含未启用文案及内容块标记。`git diff --check` 通过。未执行浏览器网络验收，未提交、归档、push 或发布。
- 2026-11-10 浏览器实测（Claude，沙箱外）：`python3 -m http.server 4173 -d dist` 预览，cdp-ui 无头 Chrome 依次打开 `/`、`/forge/`、`/cli/`。三页均有 `<script defer src="https://cloud.umami.is/script.js" data-website-id="113f1baf-0830-4993-a686-e6a17a04bdcf">`，Resource Timing 均见自动 PV 请求 `https://gateway.umami.is/api/send` 状态 200。另拦截 `fetch` 调一次 `umami.track()`，请求体 `payload.website` 均为 `113f1baf-0830-4993-a686-e6a17a04bdcf`，响应 200。注：实测向 Umami 发了 6 条 hostname 为 `127.0.0.1` 的记录（3 条自动 PV、3 条手动 track），后台会看到。
- 未验证：Umami 后台是否实际入库（需用户登录查看）；Pages 线上部署后的统计（未 push）。

## 收口

交付 sha 见归档提交；`done-coding harness lists` / `check` 通过。
