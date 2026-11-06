# 黑盒验收

站在真实用户的位置，只用 npm 上已发布的包和公开模板，验证 done-coding 各产品能装、能建、能用。不读取产品仓代码，不发布，不登录，不进 CI。

## 运行

```bash
pnpm acceptance                       # 完整矩阵，有失败时退出码为 1
pnpm acceptance --group=cli           # 只跑某组：template、forge、cli，可用逗号组合
pnpm acceptance --only=template-monorepo   # 只跑标题含该片段的用例
pnpm acceptance --out=<目录>           # 结果写到别处，调试用
pnpm acceptance:test                  # 运行器自身的单元测试
```

需要联网访问 npm registry 和模板仓库；需要 `python3`，用它的 pty 模块驱动交互式 CLI。完整矩阵在 8GB 内存的机器上约需一小时，用例串行执行。

## 做什么

| 组       | 用例                                                                                                                                                                                     |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| template | 在交互界面中列出全部模板和分支，对每个变体执行：创建 → 安装依赖 → 构建 → lint → 测试（有则跑）                                                                                           |
| forge    | 最小 Vite + Vue 3 项目，只依赖 `@done-coding/forge` 的 latest，按其 README 引入公开入口和样式；`vite build`，`vue-tsc` 在 `skipLibCheck` 为 true 和 false 时各跑一次，第三方库的诊断单列 |
| cli      | `done-coding --help` 列出的每个子命令：`--help` 加一条最小真实用法；需要账号或会对外发布的子命令只跑 `--help`，真实用法记为跳过并写明原因                                                |

## 隔离

- 每个用例一个系统临时目录，结束即删。
- 用例进程的 `HOME`、`TMPDIR`、git 全局配置都指向临时目录，不会读到本机 `~/.done-coding` 里的模板指针等配置；不读系统级 git 配置（避免钥匙串等凭据助手），git 不弹登录提示。
- 被测命令的环境去掉包管理器脚本注入的 `npm_*`、`pnpm_*` 变量、名字含 TOKEN/SECRET/PASSWORD 的变量和 PATH 中的 `node_modules/.bin`，所以 `pnpm acceptance` 与 `node acceptance/run.mjs` 结果相同。
- 被测 CLI 用 `npm install` 装在临时目录，不做全局安装。
- pnpm store 和 npm 缓存沿用本机，只为避免重复下载，项目目录与配置仍从零开始。

## 输出

写到 `docs/governance/audits/acceptance/<日期>/`，日期按北京时间：

- `results.json`：机器可读，含包名、版本、平台、Node/pnpm 版本，以及每步的状态、退出码、耗时、输出摘要。
- `report.md`：由同一份数据生成的人读摘要。
- `issues/<用例>--<步骤>.md`：每个失败一份草稿，只写现象、复现命令、期望、实际、环境。已存在的草稿不会被覆盖，因为协调者可能已经定稿；本次未复现的旧草稿会在运行结束时列出。

输出摘要会把临时路径替换为 `<tmp>`、耗时替换为 `<t>`，所以重复运行时，除耗时字段外结果一致。

步骤状态：`pass` 通过；`fail` 失败；`timeout` 超时；`skipped` 需要付费服务或账号而跳过（唯一允许的跳过）；`absent` 项目没有该脚本；`blocked` 前一步失败，本步未执行。

## 目录

- `run.mjs`：入口，安装被测 CLI、串行执行各组、写出结果。
- `cases/`：三组用例。
- `lib/`：步骤执行与超时回收、临时目录、伪终端驱动（`pty-drive.py`）、报告与草稿。
- `test/`：运行器单元测试。
