---
id: 8j1b88
title: 已发布产物黑盒验收
modules: [product-acceptance]
created: 2026-11-06
source: 用户 2026-11-06 当轮下发
after: ""
---

# 已发布产物黑盒验收

共享骨架独占方：本批改动根 `package.json`（acceptance 脚本、lint 范围）、`.ls-lint.yml` 与 `AGENTS.md`（目录表与命令），未改锁文件；nfp6e3 在同一窗口串行接手。

## 任务

| 项 | 状态 | 交付 sha |
|---|---|---|
| 黑盒验收矩阵与问题草稿（a8yenh） | 已完成 | bfbebd7 |
| 刷新所涉模块快照和上层摘要，product-acceptance 改 active | 已更新 | c6f8e9b |
| 归档本批并跑治理闸 | 已完成 | db3a815 |
| 本批交付归档后立刻、必须、立即开始下一批 `nfp6e3` | 已接 nfp6e3（串序已改为先 tz5nrg，未及时拉取，补做经过见 tz5nrg 进度） | |

## 进度

- 2026-11-06 14:40 CST 承接。本机 mbp2017（MacBookPro14,2，8GB，无 Docker）。会话指引：~/2026-11-06-sessions.md 的 mbp2017 段与 B3；已读 blueprint 0021 与推进口径（从 origin/master 读，未改其工作树）。
- 执行分工：Claude 设计运行器、归因并定稿草稿；DeepSeek（cc-router）只接机械活。承接时处在 DeepSeek 高峰时段（14–18 点）。
- 探测结论：
  - 公开面：create-done-coding 0.18.1、done-coding 0.23.4、@done-coding/forge 0.100.1。
  - 模板列表只能在交互界面里看到，非交互模式缺少列出模板的入口，所以用伪终端驱动（python3 pty）。
  - 本机 `~/.done-coding/create/index.json` 指向本地 template-hub，验收必须用临时 HOME 隔离，否则用的不是公开模板。
- 候选问题（待运行器复现）：README 的 `create-done-coding <name>` 和 `-c` 被报“无法识别的选项”；`generator --help` 在单词中间断行。
- 运行器已写成，入口 `pnpm acceptance`，单测入口 `pnpm acceptance:test`。单测初稿由 DeepSeek（deepseek-flash）编写；它新增的 `index.js` 引导文件被 Claude 删除，改用通配符脚本。Claude 复核了进程组回收、草稿不覆盖等关键断言，并在 Node 22/24 下各重跑一次。
- 第一轮全量（15:18–15:47）：11 过 22 败，归因如下：
  - 16 个模板安装失败，同一原因：pnpm 12 拦截构建脚本 → 合并成一份草稿，按 pnpm 提示批准后继续验证构建、lint、测试；
  - forge 消费者安装失败：运行器自建项目的配置问题，不算 forge 的问题，改为批准后继续；
  - 3 个模板克隆时卡在 gitee 登录 → 合并成一份草稿；运行器关闭交互登录，改为立即失败；
  - CLI 3 条（template 默认配置、component 前置条件、README 位置参数）属实。
- 运行器自身的修正：样例项目改为典型结构（补 README、src），排除了 inject/extract 的误报；伪终端驱动修了“前缀问题被跳过”和“局部重绘读不到高亮项”两个 bug；未知选项的判定原先只认一种措辞，已修正。第一轮的未定稿草稿已删除，重跑第二轮。
- 第二轮起做可重复性校验（同一代码连跑两次，去掉耗时字段后比对 results.json），先后查出并修正以下不一致来源：
  - 伪终端步骤的命令里有驱动脚本的本机绝对路径和随机记录文件名 → 改为记录被驱动的命令本身（同时消除了提交文档里的家目录路径）；
  - 通过步骤的输出摘要随并行脚本顺序、依赖解析数量变化 → 通过的步骤不留摘要；
  - 克隆目录的 UUID、测试输出的时刻、被折行的临时目录 → 统一脱敏；
  - `pnpm acceptance` 启动时 pnpm 往环境里注入 `npm_*` 变量和仓库的 `node_modules/.bin`，使被测项目能用上本仓的 prettier，template-node-server（workspace）的首次安装结果因启动方式而异 → 被测命令的环境去掉这些注入、PATH 中的 `node_modules/.bin`，以及名字含 TOKEN/SECRET/PASSWORD 的变量（只按名字剔除，未读值）。修正后用 pnpm 启动单跑该用例，结果与 node 启动一致。
  - 复核三个无法匿名克隆的模板时发现，系统级 git 配置启用了钥匙串凭据助手，运行器只隔离了全局配置 → 隔离环境加 `GIT_CONFIG_NOSYSTEM=1`。已核对验收产物，没有带出任何账号信息；三个仓库在无凭据时都报 could not read Username。
- 17:23–18:26 两轮：结果除 template-node-server（workspace）外完全一致，差异即上面的 pnpm 环境注入问题。
- 草稿已由 Claude 逐份复核定稿：11 份（模板合并 4 份、模板单用例 2 份、forge 1 份、cli 4 份），只写现象、复现、期望、实际与环境。定稿时用 `git ls-remote` 复核了三个 gitee 仓库无法匿名访问；uni-mobile 的超时写明来自 vitest 监听模式不退出，不当作单纯“慢”。
- DeepSeek 用量：只用于单测初稿，一次调用；cc-router 静默模式不回显金额，未取得精确花费。
- 验收复核（Claude 独立重跑）：
  - 18:33–19:06 用最终代码经 `pnpm acceptance` 全量运行，写入本仓结果：11 过 22 败，无新草稿、无过期草稿；与 17:23 那轮（node 启动）比对 results.json，去掉耗时后只差 template-node-server（workspace）一条输出摘要，正是本轮新加的折行临时路径脱敏，可重复性达成。
  - `pnpm acceptance:test` 26 项通过；`pnpm verify` 通过（含 nfp6e3 在途改动的工作树，站点测试 134 项）；`pnpm lint` 通过。
  - 验收产物中无本机家目录路径、系统临时目录与账号信息（grep 核对）。
- 快照刷新：`product-acceptance` 由 not_implemented / 规划占位改为 active，新增模块快照；上层 SNAPSHOT 增加一行。旧事实“规划占位，不表示能力已实现”只存在于 MODULE.md 历史版本（见 git 历史），快照正文只留当前事实。
- 未验证项：问题草稿未转交产品仓（按 B3 只写本仓）；forge 的 7 条声明诊断未在产品仓源码层面核对（禁读实现代码）；pnpm 12 以外的包管理器版本未覆盖；Linux/Windows 未跑。
