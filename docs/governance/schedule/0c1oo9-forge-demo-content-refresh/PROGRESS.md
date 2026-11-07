---
id: 0c1oo9
title: forge 0.100.2 内容产物换用修复后的 demo
modules: [forge-site, product-acceptance]
created: 2026-11-07
source: 主协调下发（用户 2026-11-07 授权按部就班推进）
after: ""
---

# forge 0.100.2 内容产物换用修复后的 demo

本机 master 上未推送的 `cf59710` 写入的 forge 0.100.2 demo 为空（只剩首页），根因与修复见 forge rlkjn3。

## 任务

| 项 | 状态 | 交付 sha |
| --- | --- | --- |
| 在 forge 合入后的 HEAD 上 `pnpm -F @done-coding/showcase build` 与 `publish:content --site <本仓>`，替换 `cf59710` 中的 forge 内容（cf59710 未推送，可直接改写；cli 0.24.0 内容保留） | 未开始 | |
| 浏览器验收：`/forge/demo/` 左侧示例菜单齐全、抽查 3 个示例页可渲染；`pnpm verify` 通过 | 未开始 | |
| `acceptance/cases/templates.mjs` 中 DOCUMENTED_TEMPLATES 的来源说明从 0.23.3 更新为当前 cli 文档版本 0.24.0，并复核文档是否仍未选用具体模板 | 未开始 | |
| 刷新所涉模块快照与上层摘要；归档本批（只留 PROGRESS.md），`done-coding harness lists` / `check` 通过 | 未开始 | |
| 串末：报告各批交付 sha、验证结果与未完成项（压缩由用户另行指示，本串不做） | 未开始 | |
| 收工 | | |

## 边界（整串通用）

- 分支：`master（本仓一直直接推 master 部署 Pages，用户确认）`（主协调建），整串提交都在此分支；push、合并由用户执行。
- 开工先读根 AGENTS.md、docs/governance/AGENTS.md 与 DEVELOPMENT.md，并逐条核实条目里写的「现状」；与实际不符时以实测为准并在 PROGRESS 记录，不照搬。
- 允许：本机服务、本机数据库与对象存储、联网安装锁定依赖。禁止：付费 API、连接生产或非本机服务、读取或输出 .env 值与凭据、改其他仓（跨仓问题用 `done-coding harness issue` 提）、发布、git worktree、手改锁文件。显式 pathspec 提交。
- 测试按改动范围选择受影响门禁，不固定跑全量（用户口径）；完成声明附命令与退出码。
- 遇真实阻塞（权限、上游未交付、需用户裁决）写本文件「阻塞」并继续不受影响的部分；跨仓前置未满足的批次可先做不依赖部分，或在 PROGRESS 写明等待点后进入下一批。

## 进入条件

forge `fix/showcase-content-demo`（`205912e`，rlkjn3：demo 恢复完整示例）已推送并合入 forge master。未满足时本批只做第 3 项并写等待点。

## 进度

