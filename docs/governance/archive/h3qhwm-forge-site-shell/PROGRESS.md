---
id: h3qhwm
title: forge 站点外壳
modules: [forge-site, portal, site-platform]
created: 2026-11-06
source: 用户 2026-11-06 当轮下发
after: "2fne7b"
---

# forge 站点外壳

共享骨架独占方：本批（`package.json`、`pnpm-lock.yaml`、`AGENTS.md`）。本仓同一时间只跑这一条批次串。

实际改动超出单下的 forge-site：共用逻辑落在 site-platform 的 `packages/site-kit`，隐私说明归 portal，已补进 modules。

## 任务

| 项 | 状态 | 交付 sha |
|---|---|---|
| forge 站点外壳读取内容产物（aiowun） | 已完成 | ae764be |
| 刷新所涉模块快照和上层摘要 | 已完成 | 615a455 |
| 归档本批并跑治理闸 | 已完成 | 见本文件所在归档提交 |
| 交付归档后立刻、必须、立即开始下一批 `igtqwx` | 已转入下一批 | 不产生提交 |

## 决策

- URL 结构：站点首页 `/forge/`，文档 `/forge/docs/`，演示 `/forge/demo/`。首页归站点外壳，所以文档放在 `docs/` 下，避免与产品的 `index.md` 冲突。
- 契约原本未定义 `nav.json` 的结构，本批定义并写入 AGENTS.md，需通知产品仓。
- 夹具在 `packages/site-kit/fixtures/`，只经 `SITE_CONTENT_DIR` 读取，正式构建读不到。
- 未安装 `@done-coding/forge`：外壳本身不用组件。
- 演示页原样发布，不注入统计，隐私说明已写明。

## 验证

- `pnpm verify`（53 项断言）、`pnpm lint`、`pnpm install --frozen-lockfile` 退出 0。
- 夹具：生成文档页、目录页、侧栏导航、演示路径，演示文件与夹具逐字一致，组装后通过 check-site。
- 缺 `current.json`：可构建，显示「文档建设中」，无文档目录。
- 格式错误 10 种（坏 JSON、version 越界、缺 source、版本目录不存在、缺 docs、缺 nav、nav 非数组、nav 指向不存在、nav 越界、demo 缺首页）均构建失败并说明原因；文档内坏链接也使构建失败。
- 正式站不含夹具标记文字。
- 夹具文档页和正式站首页截图人工查看。

## 未验证

- 未用真实产品仓产物构建：产物尚未导出。产品 Markdown 里若有 Vue 模板语法，可能在构建时才暴露问题。
- `pages.yml` 未真实运行，本批未 push。

## 快照刷新

替换的旧事实：forge-site“占位页面，尚未选定文档工具，无样式”。旧事实留在 git 历史和 archive/2fne7b-site-foundation/PROGRESS.md。
