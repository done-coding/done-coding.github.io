# 领域模块目录

> 文档定位：规范 · 本仓领域划分；设计视图。

## 领域模块

| 领域模块 | 一句能力 | status | paths |
|---|---|---|---|
| `portal` | 对外介绍 done-coding 并分发到各产品站；隐私说明 | active | `apps/portal/**` |
| `forge-site` | 呈现 forge 的文档和演示 | active | `apps/forge-site/**` |
| `cli-site` | 呈现 cli 的文档 | active | `apps/cli-site/**` |
| `site-platform` | 拼装、发布、站点检查和统计接入，不含业务内容 | active | `scripts/**`、`packages/site-kit/**`、`.github/workflows/**`、`site.config.json` |
| `product-acceptance` | 只用已发布产物（npm 包、公开模板）对 done-coding 各产品做黑盒验收，产出可复跑的结果与问题草稿 | not_implemented | `acceptance/**`、`docs/governance/audits/acceptance/**` |

**数据归属：** 门户文案和隐私说明归 `portal`；产品站的导航和外壳归对应站点；统计配置归 `site-platform`。`apps/*-site/content/` 的内容由产品仓决定和导出，本仓只读取，归属对应站点目录。

**共享骨架：** 根 `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`AGENTS.md` 不属于任何领域，批次改动时在 PROGRESS 声明独占。
