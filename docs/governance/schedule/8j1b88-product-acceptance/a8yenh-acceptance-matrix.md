---
id: a8yenh
title: 黑盒验收矩阵与问题草稿
modules: [product-acceptance]
created: 2026-11-06
parent: ""
---

# 黑盒验收矩阵与问题草稿

先读本仓根 AGENTS.md 与 `docs/governance/modules/product-acceptance/MODULE.md`。只用 npm 上已发布的包和公开模板，不读取任何产品仓实现代码。

## 范围

在 `acceptance/` 下做一个可复跑的验收运行器（本仓 package script 入口，如 `pnpm acceptance`），每个用例都在系统临时目录里从零开始：

1. **项目模板**：用已发布的 `create-done-coding`（或 `done-coding` CLI 的创建命令，以其 `--help` 与公开 README 为准）列出全部可用模板；对每个模板执行“创建 → 安装依赖 → 构建 → lint → 测试（有则跑）”，逐步记录退出码、耗时与报错摘要。
2. **forge 消费者**：新建一个最小 Vite + Vue 3 项目，只依赖 npm 上 `@done-coding/forge` 的最新正式版（以 dist-tag latest 为准，记录实际版本），引入其公开入口与样式，`vite build` 通过；分别以 `skipLibCheck: true` 与 `false` 跑 `vue-tsc --noEmit`，记录各自诊断条数与所属包（第三方库的诊断单列，不算 forge 问题）。
3. **cli 子工具**：对 `done-coding` 各公开子命令（generator、harness 等，以 `--help` 为准）在临时目录做冒烟：`--help`、一条最小真实用法（如 harness 在临时治理目录跑 `lists`/`check`）。
4. **结果**：机器可读结果写 `docs/governance/audits/acceptance/<YYYY-MM-DD>/results.json`（包名、版本、平台、Node/pnpm 版本、每步退出码与耗时）；人读摘要写同目录 `report.md`。
5. **问题草稿**：每个可复现的失败写成一份 `docs/governance/audits/acceptance/<日期>/issues/<短名>.md`，内容只有“现象 + 复现命令 + 期望 + 实际 + 环境”，不猜实现原因；由总协调转交产品仓。

## 约束

- 本机 8GB、无 Docker，不跑浏览器全量；用例串行执行，单用例设超时，临时目录用后清理。
- 需要联网访问 npm registry；不发布、不登录、不使用任何密钥；不安装全局包（用 npx 或临时目录本地安装）。
- 遇到需要付费服务或账号的用例，跳过并在报告中写明原因（这是唯一允许的跳过，不得静默）。

## 验收

- `pnpm acceptance` 在本机从零跑完整矩阵，退出码反映是否有失败；重复运行结果一致（除耗时）。
- results.json 字段齐全，report.md 与 results.json 一致；每个失败都有对应问题草稿。
- 运行器自身有单元测试（如结果汇总、超时处理、临时目录清理）；本仓 `pnpm verify`、`pnpm lint` 通过。
