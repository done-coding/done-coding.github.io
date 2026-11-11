---
id: hn4ihh
title: 产品站显示各包 npm 版本徽章
modules: [site-platform, forge-site, cli-site, portal]
created: 2026-11-11
source: 总协调下发（服务 M4：工具对外可用性，用户 2026-11-11 提出）
after: ""
---

# 产品站显示各包 npm 版本徽章

forge 站、cli 站给每个已发布包显示 npm 徽章（npm 标志 + 最新版本号），点击跳到该包 npm 页面。只改站点外壳，不要求产品仓改内容产物；私有包不加。共享骨架：本批不改根 `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`AGENTS.md`。

## 任务

| 项 | 状态 | 交付 sha |
| --- | --- | --- |
| site-kit 支持按站点配置的包清单渲染徽章：产品站首页「npm 包」列表；有对应文档页的包在页首显示徽章；测试覆盖 | 已完成 | 见收口 |
| forge 站登记 12 个包，cli 站登记各包；隐私说明补充徽章图片来自第三方 | 已完成 | 见收口 |
| `pnpm lint`、`pnpm verify` 通过；本地预览实测两站徽章显示与链接、手机宽度不溢出 | 已完成 | 见收口 |
| 刷新所涉快照，归档本批，`done-coding harness lists` / `check` 通过 | 已完成 | 见收口 |
| 收工 | | |

## 边界

- 分支 master，显式 pathspec 提交，不 push、不发布。实施交 Codex（沙箱内），npm 核对与浏览器验收由 Claude 在沙箱外执行。

## 决策

- 徽章服务：shields.io `https://img.shields.io/npm/v/<包名>?logo=npm`（动态取 npm latest，带 npm 标志）。替代方案：badge.fury.io（`https://badge.fury.io/js/<包名>.svg`，无 npm 标志，cli create 文档已在用）；或构建时查 registry 生成静态徽章（无第三方请求，但版本只在重新构建时更新，构建需联网）。选 shields.io 因满足“npm 标志 + 当前最新版本”且构建不联网。图片由访客浏览器从 img.shields.io 加载，故隐私说明补一句。
- 包清单在各站 `.vitepress/config.mjs` 显式登记，不从内容产物推断（forge 内容没有逐包文档页）；cli 各包文档页由登记的 `doc` 字段（相对 docs/ 的路径）关联，用主题 `doc-before` 插槽显示，不改内容产物。

## 进度

- 2026-11-11 实施交 Codex（gpt-6.1-sol medium，workspace-write，不提交、不联网），以下为其记录，Claude 已复核 diff。Codex 当轮范围：完成标准为配置校验、主题插槽输出、正式首页 12/16 个徽章与 cli 逐包文档徽章，以及串行 `pnpm verify` → `pnpm lint` 退出 0。
- 已核对现有 product/content 工厂、主题、测试、cli 0.24.0 导航与四个领域快照。来源仅为仓内代码与产物，复用已安装的 VitePress/Vue（MIT），无新增依赖与外部代码片段。
- 已添加 packages 参数校验、主题徽章组件及两个插槽、两站显式包清单和统计开关外的隐私说明；测试覆盖徽章输出、历史页面排除、无配置、错误配置与正式站逐包输出。定向反例已确认旧实现对 missing.md 不报错（AssertionError），验证新增校验的必要性。
- 快照替换说明：site-platform 原 UX 只有页脚，补充现有徽章配置与输出；forge 原 UX 未描述 npm 包，补充 12 包首页；cli 原“当前无内容产物、显示建设中”已由 current.json 与目录核实为过时，替换为 0.23.3/0.24.0、当前 0.24.0，并补充 16 包首页与文档徽章；portal 原隐私只描述统计，补充始终显示的第三方图片披露。旧事实与依据固定留在本节，快照正文仅写当前事实。
- 本轮未验证：图片在线加载、最新 npm 版本真实性和 375px 浏览器实测，留给批次已约定的沙箱外验收，本轮不联网。

- 徽章定向测试已通过（20 项，退出 0）：首页、关联文档页、非关联页与历史页排除、文档不存在/越界、包名非法/重复。夹具测试改用临时站点隔离 packages 配置，通过现有 site-kit/node_modules 的本地链接复用依赖；临时路径使用 realpath，避免 macOS `/var` 与 `/private/var` 导致的 VitePress 路径偏差。首轮完整测试的夹具主题导入与站点名断言问题已修正；lint 指出的辅助函数参数过多已改为站点选项对象，随后重新运行完整 verify → lint。

- 最终验证：串行 `pnpm verify`（退出 0，构建、站点检查及全部站点测试通过）→ `pnpm lint`（退出 0，ESLint、Prettier、文件命名检查通过）；`git diff --check` 退出 0。构建仍有 forge chunk 大于 500 kB 的提示，站点预算检查通过。
- `dist/forge/index.html` 含 12 个徽章，`dist/cli/index.html` 含 16 个；cli 全部 16 个包页的对应徽章断言通过。`dist/cli/docs/packages/cli.html` 包含 npm 链接 `https://www.npmjs.com/package/done-coding`、`target="_blank" rel="noopener"`，图片 `https://img.shields.io/npm/v/done-coding?logo=npm`、alt `done-coding 的 npm 版本`、height `20`。
- 交付状态：实现、必要离线验证和四领域快照已完成；按本轮明确指令未提交、未 push、未归档，未运行联网验收；未改根配置、锁文件、AGENTS.md 或产品内容产物。浏览器实测待沙箱外接手后收口原批次。

- 2026-11-11 npm 核对（Claude，沙箱外，registry.npmjs.org）：forge 12 包 latest 均为 0.102.0；cli 16 包 latest：cli-cc-switch 0.6.0、done-coding 0.24.0、cli-skills 0.7.0、cli-component 0.7.0、cli-config 0.3.0、create-done-coding 0.19.0、cli-dex 0.3.0、cli-extract 0.3.0、cli-generator 0.4.0、cli-git 0.8.0、cli-harness 0.4.0、cli-inject 0.7.0、cli-mcp 0.7.0、cli-publish 0.9.0、cli-template 0.13.0、cli-utils 0.14.0。28 个均为公开已发布包，无私有包。`https://img.shields.io/npm/v/@done-coding/forge-core?logo=npm` 返回 200 `image/svg+xml`。
- 2026-11-11 Claude 复核后的调整：徽章 img 加 `referrerpolicy="no-referrer"`，隐私说明相应改为「该服务会收到访客 IP 和浏览器信息；请求不携带来源页地址」（替换 Codex 稿「会收到访客 IP 与请求的页面地址（Referer 视浏览器策略）」），测试断言同步并要求 no-referrer；portal 快照同步。根快照 cli-site 行原「尚无产物，显示建设中」过时，本批涉及 cli-site，改为当前事实。补 `.gitignore` 忽略 `test-results/`（工作区截图约定，原未忽略，验收截图写入前未生效，已补并确认未入索引）。验证：`pnpm verify` 退出码 0（站点测试全部通过）、`pnpm lint` 退出码 0。
- 2026-11-11 浏览器实测（Claude，沙箱外，cdp-ui 无头 Chrome，`python3 -m http.server` 预览 dist）：`/forge/` 首页 12 个徽章、`/cli/` 首页 16 个徽章全部加载（naturalWidth>0），链接均为 `https://www.npmjs.com/package/<包名>`、`target="_blank"`；cli 16 个包页（`/cli/docs/packages/<名>.html`）各有且只有 1 个对应包的徽章，与页面 H1 包名一致，全部加载（cc-switch 首次加载慢，重测通过）。375px 宽度：forge 首页、cli 首页、cli create 包页 `scrollWidth` = 375，徽章区无元素越出视口；截图在本机 `test-results/hn4ihh/`（不入仓），显示徽章随宽度换行。
- 加了徽章的页面：forge 站首页 `/forge/`（12 包列表）；cli 站首页 `/cli/`（16 包列表）；cli 16 个包文档页 `/cli/docs/packages/<名>`（页首单个徽章）。历史版本页与其他文档页不加。

## 收口

交付 sha 见本表；`done-coding harness lists` / `check` 通过。未验证：线上部署后的显示（未 push）。
