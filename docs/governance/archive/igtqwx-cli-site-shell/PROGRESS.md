---
id: igtqwx
title: cli 站点外壳
modules: [cli-site]
created: 2026-11-06
source: 用户 2026-11-06 当轮下发
after: "h3qhwm"
---

# cli 站点外壳

共享骨架独占方：本批（`package.json`、`pnpm-lock.yaml`、`AGENTS.md`）。本仓同一时间只跑这一条批次串。

## 任务

| 项 | 状态 | 交付 sha |
|---|---|---|
| cli 站点外壳读取内容产物（4lqkiw） | 已完成 |  |
| 刷新所涉模块快照和上层摘要 | 已完成 |  |
| 归档本批并跑治理闸 | 已完成 | 见本文件所在归档提交 |
| 收工，向用户报告站点地址、未验证项和需要产品仓提供的内容产物 | 已完成 | 不产生提交 |

## 决策

- 只新增配置和主题入口，逻辑全部复用 `packages/site-kit`，没有复制 forge 站代码。
- 按仓根 AGENTS.md“修改契约时同时通知产品仓”，向两个产品仓提 issue：done-coding-forge 2589f2（目标仓提交 9d7fe86）、done-coding-cli 63f7dw（目标仓提交 2cdea12）。未 push。

## 验证

- `pnpm verify`（76 项断言，cli-site 23 项）、`pnpm lint`、`pnpm install --frozen-lockfile` 退出 0。
- 有夹具、缺产物、产物格式错误（10 种）三种情况，cli 站与 forge 站跑同一组测试。
- Node 22.23.3 下 `pnpm verify` 同样通过，与 CI 主版本一致。

## 未验证

- 未用真实产品仓产物构建，产物尚未导出。
- `pages.yml` 未真实运行，线上地址未生效，本批未 push。
- 未提供真实 `websiteId`，未验证 Umami 后台实际收到数据。

## 快照刷新

替换的旧事实：cli-site“占位页面，尚未选定文档工具，无样式”。旧事实留在 git 历史和 archive/2fne7b-site-foundation/PROGRESS.md。
