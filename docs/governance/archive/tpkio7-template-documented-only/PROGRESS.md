---
id: tpkio7
title: 模板验收只覆盖文档选用的模板
modules: [product-acceptance]
created: 2026-11-07
source: 用户 2026-11-07 口径，总协调经 SSH 派发给 mbp2017 执行会话
after: ""
---

# 模板验收只覆盖文档选用的模板

共享骨架独占方：无（未改根 `package.json`、锁文件、`AGENTS.md`）。

## 任务

| 项 | 状态 | 交付 sha |
|---|---|---|
| 第 0 步：收口并归档 llnaz0（真实内容下 `pnpm verify` 通过，无未完成条目） | 已完成 | 7d2cf00 |
| `templates.mjs`：待验集合来自 `DOCUMENTED_TEMPLATES` 一处声明；发现用例只列模板；运行器单测更新 | 已完成 | 2a58574 |
| `npm create done-coding` 用法写进验收用例与报告的复现步骤（templates、run、cli 的 create README 用例） | 已完成 | 2a58574 |
| `acceptance/README.md` template 行改写 | 已完成 | 2a58574 |
| 只跑模板组实测并记录结果（2026-11-07） | 已完成 | 2a58574 |
| 刷新 product-acceptance 快照；归档本批 | 已完成 | 2a58574 |

## 阻塞

ⓐ **文档没有选用任何具体模板**：`apps/cli-site/content/0.23.3/docs/packages/create.md` 及 `apps/*-site/content` 其余文档只写 `npm create done-coding [projectName]`、`template-config` 与 MCP 的示例（`我的本地模板`、`远端模板` 是占位示例），没有一处选用清单里的具体模板。按口径不自行挑选：`DOCUMENTED_TEMPLATES` 留空，模板组只验证「交互界面能列出模板」。
  - 继续所需最小条件：文档写出选用的、不需要登录的模板后，在 `acceptance/cases/templates.mjs` 的 `DOCUMENTED_TEMPLATES` 登记 `{ name, branch, source: "<文件>:<行>" }`，运行器会对其执行创建 → 安装 → 构建 → lint → 测试。声明项若不在交互列表里，发现用例会失败。需总协调转告 cli 文档作者。

## 进度

- 实现：`discoverTemplates` 只读「请选择模板」列表，不再枚举各模板分支；`selectDocumented(labels, documented)` 按名字从列表取出声明的模板，列表里找不到的声明记为失败步骤；`templateCase` 与创建/安装/构建/lint/测试逻辑保持不变，用例 meta 带 `source`。发现用例改名「交互界面能列出模板」。
- 用法说明：模板用例、发现用例、cli 的 create README 用例的复现步骤由 `npx -y create-done-coding@…` 改为 `npm create done-coding@<版本> <项目名>`（带参数的 `-c` 写 `-- -c`，与 create.md 一致）。运行器内部仍用已装包的 bin（`node_modules/.bin/create-done-coding`）定位，未改。
- 单测：新增 `acceptance/test/templates.test.mjs`（4 项：只取声明模板、缺失单列、空声明不回落枚举、声明项的来源文件与行真实存在并含模板名）。`pnpm acceptance:test` 30 项全过；eslint 与 prettier 通过。
- 实测：Node v22.23.3，`pnpm acceptance --group=template`，约 44 秒，结果 1 个用例通过，交互界面列出 11 个模板，写入 `docs/governance/audits/acceptance/2026-11-07/`。因此「最近一次 results.json」现在是这份只含模板组的结果，门户兼容性矩阵页会按筛选结果标注；要恢复完整矩阵需另行跑完整验收（约一小时，本批按要求不跑）。
- 历史结果标注（不改 2026-11-06 的数据文件）：2026-11-06 结果里因「枚举全部模板」得出的模板类结论，那 5 条模板问题出自 gitee 清单指向的老 template-* 仓，template-hub 已判不在本仓；需登录的 3 个模板不在验收范围。该口径已写入 product-acceptance 快照。2026-11-06 的 `templates-*`、`template-*` 草稿不再作为转交产品仓的依据。
- gitee 模板清单未提议改动、未提 issue。
- 快照刷新（product-acceptance）：替换的旧事实：「项目模板组交互枚举全部模板与分支、逐个验证」→「只验文档选用的模板，当前声明为空，只验列出模板」；「最近一次结果 33 用例 11 通过 22 失败」→ 保留为最近一次完整矩阵并标注模板类结论口径作废，另记 2026-11-07 的模板组实测。移出的历史内容的固定落点：`docs/governance/audits/acceptance/2026-11-06/`（报告、数据与草稿原样保留）。
- 验证：`pnpm lint`、`done-coding harness lists/check` 见收口提交。
