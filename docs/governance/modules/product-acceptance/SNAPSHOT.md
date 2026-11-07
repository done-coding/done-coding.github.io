# product-acceptance 快照

## 技术快照

`acceptance/` 是 Node ESM 运行器，入口 `pnpm acceptance`，本机运行，不进 CI。每次把 `create-done-coding`、`done-coding` 的 latest 用 npm 装进临时目录；用例串行，各自在系统临时目录中从零开始，`HOME`、`TMPDIR`、git 全局配置指向临时目录，不读系统级 git 配置，不弹登录提示。被测命令的环境去掉包管理器脚本注入的变量、凭据类变量和 PATH 中的 `node_modules/.bin`，所以 `pnpm acceptance` 与直接用 node 启动结果相同。交互式 CLI 由 `lib/pty-drive.py`（python3 pty）驱动。pnpm store 与 npm 缓存沿用本机，只为避免重复下载。

输出写到 `docs/governance/audits/acceptance/<北京日期>/`：`results.json`、由它生成的 `report.md`，以及每个失败的问题草稿 `issues/*.md`。同类失败合并为一份草稿；已存在的草稿不覆盖，运行结束列出新草稿和本次未复现的旧草稿。路径、耗时、时刻、随机 ID 脱敏，通过的步骤不留摘要，重复运行时除耗时外结果一致（2026-11-06 两轮实测）。运行器单测在 `acceptance/test/`，入口 `pnpm acceptance:test`。

## 业务快照

三组用例：项目模板（交互界面能列出模板；只验 `acceptance/cases/templates.mjs` 的 `DOCUMENTED_TEMPLATES` 声明的、与已发布文档选用一致且不需登录的模板，逐个创建 → 安装 → 构建 → lint → 测试；截至 cli 0.24.0 文档没有选用具体模板，声明为空，只验列出模板）、forge 消费者（最小 Vite + Vue 3 项目按 README 引入，`vite build` 与 `vue-tsc` 在 `skipLibCheck` 开关两种情况下各跑一次，第三方诊断单列）、cli 子命令（每个子命令 `--help` 加一条最小真实用法，需要账号或会对外发布的只跑 `--help`）。

最近一次完整矩阵见 [2026-11-06 报告](../../audits/acceptance/2026-11-06/report.md)：create-done-coding 0.18.1、done-coding 0.23.4、@done-coding/forge 0.100.1，33 个用例 11 通过 22 失败；其中模板类结论出自当时枚举全部模板的口径，已不作为模板结论使用（见下），问题草稿同目录 `issues/`，尚未转交产品仓。最近一次运行是只跑模板组的 [2026-11-07 报告](../../audits/acceptance/2026-11-07/report.md)：交互界面列出 11 个模板，1 个用例通过。

模板类草稿的归属：2026-11-06 那 5 条模板问题出自 gitee 清单指向的老 template-* 仓，template-hub 已判不在本仓；需登录的 3 个模板不在验收范围。

门户兼容性矩阵页读取最近一次的 results.json；只跑部分组时页面按筛选结果标注。

## UX 快照

命令行输出逐个用例的完成或失败；报告按组列表，跳过项、未提供的脚本、失败与草稿链接、观察分节列出。
