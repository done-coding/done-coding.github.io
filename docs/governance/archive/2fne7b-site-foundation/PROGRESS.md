---
id: 2fne7b
title: 组织站基础：文档工具、统计和门户
modules: [portal, site-platform]
created: 2026-11-06
source: 用户 2026-11-06 当轮下发
after: "v7k2pa"
---

# 组织站基础：文档工具、统计和门户

共享骨架独占方：本批（`package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`AGENTS.md`）。本仓同一时间只跑这一条批次串。

## 任务

| 项 | 状态 | 交付 sha |
|---|---|---|
| 门户、统计和共用站点基础（ayk2wf） | 已完成 | 277f8f6 |
| 刷新所涉模块快照和上层摘要 | 已完成 | 3b94348 |
| 归档本批并跑治理闸 | 已完成 | 见本文件所在归档提交 |
| 交付归档后立刻、必须、立即开始下一批 `h3qhwm` | 已转入下一批 | 不产生提交 |

## 决策

- 文档工具选 VitePress 1.6.4（MIT），依据见 `packages/site-kit/README.md`。
- 共用基础放 `packages/site-kit`，归 `site-platform`，`MODULES.md` 已补路径。
- `pnpm-workspace.yaml` 只批准 esbuild 构建脚本。不批准时 pnpm 12 的 `install --frozen-lockfile` 退出码为 1，CI 会失败。
- 隐私说明依据 Umami 官方文档（docs.umami.is/docs/metric-definitions、umami.is/privacy），不写“不收集任何个人数据”“完全匿名”。

## 验证

- `pnpm verify`、`pnpm lint` 退出 0；`pnpm install --frozen-lockfile` 通过。
- 反例：相对、根绝对、单引号、越界坏链接，source map 文件，sourceMappingURL 注释，缺首页，均使检查失败。
- `websiteId` 为 null 和有值两种构建，门户与冒烟 VitePress 站都验证了脚本有无；隐私说明随之切换；非法类型构建失败。
- 锁文件新增包，无包被移除。
- 门户首页在桌面宽度和 375px 宽度截图人工查看，无横向溢出。

## 未验证

- `pages.yml` 未真实运行，本批未 push。
- 未提供真实 `websiteId`，未验证 Umami 后台实际收到 PV 和点击事件。
- Node 22 未实测（CI 用 22，本机为 24）。

## 执行偏差

原计划委派 Codex，`codex login status` 为 Not logged in，请求返回 401，未产生任何改动，改由 Claude 实施。

## 快照刷新

替换的旧事实：门户“占位页面，无样式”“隐私说明尚未编写”；site-platform“依赖尚未安装，锁文件未更新，完整 lint 与 hooks 尚未验证生效”“只检查站内绝对链接”。旧事实留在 git 历史和 archive/v7k2pa-template-tooling/PROGRESS.md。
