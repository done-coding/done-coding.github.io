---
id: m7qcuj
title: 统计只在线上域名上报且不带查询参数
modules: [site-platform, portal]
created: 2026-11-10
source: 总协调转达（用户 2026-11-10 文档站统计，接 2zr2pz）
after: "2zr2pz"
---

# 统计只在线上域名上报且不带查询参数

统计脚本标签加 `data-domains`（只在 done-coding.github.io 上报，本机预览不上报）和 `data-exclude-search="true"`（不上报查询参数，向 showcase 的脱敏口径靠拢；不移植 showcase 的路径白名单）。共享骨架：本批不改根 `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`AGENTS.md`。与在途 0c1oo9（forge-site · product-acceptance）领域不相交。

## 任务

| 项 | 状态 | 交付 sha |
| --- | --- | --- |
| 门户与 VitePress 站的统计脚本带 `data-domains`、`data-exclude-search="true"`，测试覆盖；隐私说明同步 | 已完成 | `920491b` |
| 本机预览不再发 `/api/send`；`pnpm lint`、`pnpm verify` 通过 | 已完成 | `920491b` |
| `site.config.json` 的 `websiteId` 换成用户在 Umami 新建的 done-coding.github.io 站点 ID（文档站与 showcase 分开统计，113f1baf… 不再用于本站），隐私说明不变 | 等待新 ID | |
| 刷新 site-platform / portal 快照，归档本批，`done-coding harness lists` / `check` 通过 | 快照已刷新；待新 websiteId 后一并更新再归档 | |
| 收工 | | |

## 边界

- 分支 master，显式 pathspec 提交，不 push、不发布。实施交 Codex（沙箱内），浏览器验收由 Claude 在沙箱外执行。

## 进度

- 2026-11-10 属性核对：官方文档 https://docs.umami.is/docs/tracker-configuration —— `data-domains`（v2.0.0）为逗号分隔的域名列表，与 `window.location.hostname` 比对；`data-exclude-search`（v2.11.0）"Use this if you don't want to collect search parameters from the URL."。当前 `https://cloud.umami.is/script.js` 源码含 `k("domains")` 按逗号拆分去空格后 `includes(hostname)` 判定，`k("exclude-search")===true` 时上报 URL 清空 search，两者均可用。
- 2zr2pz 补记（总协调 2026-11-10 后台核对）：2zr2pz 实测的 6 条 127.0.0.1 记录未入库，Umami 按 UA 丢弃 HeadlessChrome；接口 200 不代表入库。真实入库待推送后用有头浏览器访问线上验证。

- 2026-11-10 实施交 Codex（gpt-6.1-sol medium，workspace-write，不提交），以下五条为其记录，Claude 已复核 diff。
- 完成标准：共用 attrs 从 `origin` 解析 hostname，非法 URL 明确报错；门户渲染全部属性，VitePress 沿用 attrs；null / 有值 smoke 覆盖两项属性；仅同步启用版隐私文案；依次运行 `pnpm verify`、`pnpm lint` 且退出码均为 0，核对根 dist 三个首页的脚本标签。
- 属性依据沿用本批前述官方文档与源码核对记录，本轮未联网访问 Umami；实现使用既有共用入口、原生 `URL` 和门户 `escapeAttr`，未引入依赖。
- 已实施统计 attrs、门户通用属性渲染、smoke 断言（含非法 origin）、启用版隐私说明及快照更新。改动前单项断言确认 `data-domains` 为 undefined（退出码 1），验证新增断言可识别缺失属性。
- 快照替换说明：site-platform 原为“门户与文档页加载脚本，演示页不加载，null / 有值有测试”，portal 原为“启用版说明记录内容、IP 和加载范围”，根快照原为“门户与文档页加载统计，演示页不加载”；现补全仅线上域名上报且页面路径不含查询参数。隐私启用块旧文案为“页面路径及查询参数”。被替换事实固定保存在本文件“进度”，快照只保留当前事实。
- 验证结果：串行运行 `pnpm verify`（退出码 0，站点检查及全部测试通过）→ `pnpm lint`（退出码 0）。`rg -o` 提取 `dist/index.html`、`dist/forge/index.html`、`dist/cli/index.html` 的 Umami 标签，三者均含 `data-domains="done-coding.github.io"` 与 `data-exclude-search="true"`；门户 `defer=""` 与 VitePress 的 `defer` 为等效布尔属性。改动前 smoke 回归退出码 1，门户四页的新属性断言失败；改动后完整 verify 全部通过。未进行浏览器上报或真实入库验证；未提交、未 push、未发布、未访问 Umami。
- 2026-11-10 浏览器实测（Claude，沙箱外）：`python3 -m http.server 4173 -d dist` 预览，cdp-ui 无头 Chrome 打开 `/?utm_source=test`、`/forge/?utm_source=test`、`/cli/?utm_source=test`。三页脚本均带 `data-domains="done-coding.github.io"`、`data-exclude-search="true"`；`umami` 对象已加载，并手动调用 `umami.track()` 后再等 4 秒，Resource Timing 中 Umami 请求只有 `https://cloud.umami.is/script.js`，无 `/api/send`。查询参数排除只能在线上上报时观察，本机未验证，依据为上方官方文档与源码核对。
- 2026-11-10 变更（总协调转达）：用户要求文档站与 showcase 分开统计，将在 Umami 新建站点 done-coding.github.io，新 websiteId 转来后在本批更新 `site.config.json` 及快照中的 ID 描述，然后归档。等待点：新 websiteId。
