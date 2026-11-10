---
id: m7qcuj
title: 统计只在线上域名上报且不带查询参数
modules: [site-platform, portal]
created: 2026-11-10
source: 总协调转达（用户 2026-11-10 文档站统计，接 2zr2pz）
after: "2zr2pz"
---

# 统计只在线上域名上报且不带查询参数

统计脚本标签加 `data-domains`（只在 done-coding.github.io 上报，本机预览不上报）和 `data-exclude-search="true"`（不上报查询参数，向 showcase 的脱敏口径靠拢；不移植 showcase 的路径白名单）。共享骨架：本批不改根 `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`AGENTS.md`。与在途 0c1oo9（forge-site · product-acceptance）领域不相交。

## 任务

| 项 | 状态 | 交付 sha |
| --- | --- | --- |
| 门户与 VitePress 站的统计脚本带 `data-domains`、`data-exclude-search="true"`，测试覆盖；隐私说明同步 | 未开始 | |
| 本机预览不再发 `/api/send`；`pnpm lint`、`pnpm verify` 通过 | 未开始 | |
| 刷新 site-platform / portal 快照，归档本批，`done-coding harness lists` / `check` 通过 | 未开始 | |
| 收工 | | |

## 边界

- 分支 master，显式 pathspec 提交，不 push、不发布。实施交 Codex（沙箱内），浏览器验收由 Claude 在沙箱外执行。

## 进度

- 2026-11-10 属性核对：官方文档 https://docs.umami.is/docs/tracker-configuration —— `data-domains`（v2.0.0）为逗号分隔的域名列表，与 `window.location.hostname` 比对；`data-exclude-search`（v2.11.0）"Use this if you don't want to collect search parameters from the URL."。当前 `https://cloud.umami.is/script.js` 源码含 `k("domains")` 按逗号拆分去空格后 `includes(hostname)` 判定，`k("exclude-search")===true` 时上报 URL 清空 search，两者均可用。
- 2zr2pz 补记（总协调 2026-11-10 后台核对）：2zr2pz 实测的 6 条 127.0.0.1 记录未入库，Umami 按 UA 丢弃 HeadlessChrome；接口 200 不代表入库。真实入库待推送后用有头浏览器访问线上验证。
