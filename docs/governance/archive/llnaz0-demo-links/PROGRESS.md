---
id: llnaz0
title: 文档指向演示的链接不被当作死链
modules: [forge-site, site-platform]
created: 2026-11-06
source: 用户 2026-11-06 当轮下发（总协调实测发现）
after: "tz5nrg"
---

# 文档指向演示的链接不被当作死链

## 任务

| 项 | 状态 | 交付 sha |
|---|---|---|
| docs→demo 链接改写与夹具用例（lnz6qr） | 死链已修复；验收 3「真实内容 verify 全绿」因下方阻塞未达成 | 21bb4ee |
| 刷新所涉模块快照 | 已更新 | 37bc299（forge-site、site-platform）、efa30ad（site-platform 预算句） |
| 阻塞 ⓑ：搜索索引单列预算 `searchIndexKB` 与测试 | 已完成 | efa30ad |
| 阻塞 ⓐ：forge 演示引用 `/forge/analytics.js` | 已消除：forge 修正后总协调发布真实内容（0.100.1、cli 0.23.3），最终验证通过，见下方「收口验证」 | f9a7fe7 |
| 归档本批 | 已完成，无未完成条目需回池 | 7d2cf00 |

## 进度

- 2026-11-06 承接，Claude 直接实现，未新增依赖。共享骨架独占方：本批改动根 `AGENTS.md`（内容产物契约 `demo/` 一行补“文档可用相对路径链接同版本 demo/”），未改 `package.json` 与锁文件。
- 根因：VitePress 1.6.4 的链接插件把无 `target` 的相对链接当作站内页面，`../demo/` 解析为 `demo/index` 页面不存在 → 死链；带 `target` 的链接它不改写、不校验。
- 实现（`packages/site-kit/product.mjs` 的 `rewriteDemoLinks`）：Markdown 解析阶段按 `env.relativePath` 判出版本根（当前版本 `""`、历史版本 `v/<版本>/`），把解析后落在该版本 `demo/` 下的相对链接改为 `<base>demo/…`（历史可迁移演示为 `<base>v/<版本>/demo/…`），保留查询与锚点，加 `target="_self"`。历史版本演示未发布（绑定 `<base>demo/`）时改指该版本首页（首页说明不提供的原因）；版本没有 `demo/` 时不改写，照常报死链。未全局关闭死链检查。
- 夹具：当前版本 `docs/overview.md` 加 `[样例演示](../demo/)`、`docs/guide/start.md` 加 `[演示表单](../../demo/#/form)`，历史版本 `docs/overview.md` 加 `[历史演示](../demo/)`。新增断言（两站各 5 条）：链接为演示首页地址且产物中 `index.html` 存在、带 `target="_self"`；深层链接保留锚点；历史版本指向本版本演示；绑定路径的历史演示改指版本首页；删掉 demo/ 后构建因 dead link 失败。原“文档内坏链接使构建失败”保留且通过。
- 修前红：只改夹具与测试时 `pnpm verify` 退出 1，站点测试 6 项失败，报错与总协调相同（`Found dead link ./../demo/index in file docs/overview.md` 等）。修后绿：148 项全部通过（原 138 + 新 10）。
- 真实内容实跑（~/acceptance-content 拷入 `apps/*-site/content/`，与源 `diff -rq` 一致）：dead link 全部消失，产物中 `docs/index.html` 为 `<a href="/forge/demo/" target="_self">在线演示</a>`，`docs/core/panel-retired.html` 为 `/forge/demo/#/form/guide` 等，`dist/forge/demo/index.html` 存在。但 `pnpm verify` 仍在站点检查失败，见“阻塞”；单独跑 `node scripts/test-site.mjs` 144/148 通过，4 项失败均由这两条站点检查错误引起（正式站断言“有内容产物时渲染文档、不显示建设中”通过）。
- 移除真实内容后：`pnpm lint` 通过，`pnpm verify` 通过（148/148），工作区只剩本批改动。
- 快照刷新：site-platform 补“docs→demo 链接改写”规则与夹具说明；forge-site 补“文档里指向演示的链接直接打开演示”。替换的旧事实只有夹具清单一句，无需移出历史。

## 阻塞（真实内容下 `pnpm verify` 仍失败的两条站点检查错误，与死链无关）

ⓐ **forge 演示引用站点未提供的 `/forge/analytics.js`**：`demo/index.html` 含 `<script defer src="/forge/analytics.js" data-section="demo">`。本仓与内容产物契约都没有定义 `<base>analytics.js`（`git grep` 无结果），站点检查报 `forge/demo/index.html 的链接不存在：/forge/analytics.js`。要么站点新增这个脚本，要么产品仓去掉引用，都属于改契约；脚本行为（是否加载 Umami、`data-section` 的含义）还影响隐私说明，本仓不能凭猜测定义。
  - 继续所需最小条件：总协调裁定其一并通知对应仓——（甲）forge 导出的演示去掉该引用或改为不依赖站点文件；或（乙）给出 `<base>analytics.js` 的契约（行为、`data-section` 语义、`websiteId` 为 null 时的表现），由本仓实现并同步隐私说明。
ⓑ **forge 搜索索引超出脚本体积预算**：`forge/assets/chunks/@localSearchIndexroot.*.js` 1191 KB，超过 `site.config.json` `budgets.assetKB` 1024 KB。这是本仓的预算策略问题，不涉及产品仓，但调预算或改检查口径属于策略取舍，本批未擅自改。
  - 继续所需最小条件：总协调确认处理口径。建议：本地搜索索引只在打开搜索时按需加载，给它单列预算（如 `searchIndexKB`）或从脚本预算中豁免；不建议整体调高 `assetKB`。

## 总协调裁决（2026-11-06）与执行

- ⓐ 裁决：统计归站点，不归演示产物——由 forge 在导出内容产物时不再注入 `/forge/analytics.js`。本仓不实现 analytics.js、不改内容契约。forge 修正后总协调重新发布真实内容并另行派发最终验证；本次不处理 ⓐ。
- ⓑ 裁决：采纳单列预算建议，不提高整体 `assetKB`。
  - 实现（efa30ad）：`site.config.json` `budgets` 增 `searchIndexKB: 1536`；`check-site.mjs` 把路径匹配 `@localSearchIndex*.js` 的文件按该预算判，其余脚本样式仍按 `assetKB` 1024；检查输出“搜索索引体积”一段列出每个索引的实际大小与预算；`searchIndexKB` 缺失或非正数时报错。根 `AGENTS.md` 站点检查一句与 site-platform 快照同步补上（快照只改预算描述这一句，旧事实“脚本样式 1024 KB”保留，无需移出历史）。
  - 取值依据：Node 22.23.3 下用 ~/acceptance-content 真实内容构建，forge 索引 1,219,200 B（1191 KB），cli 85,229 B（84 KB）。1536 KB = 1.5 × assetKB，比当前最大值多约 345 KB（约 29%），容得下文档正常增长；再超出说明索引该拆分或裁剪，届时重新评估而不是继续放宽。
  - 测试（`test-site.mjs`，+2 条）：1100 KB 搜索索引在单列预算内放行且输出含“1100 KB，预算 1536 KB”；1600 KB 搜索索引失败并报“超过搜索索引预算”；原“脚本超出体积预算”用例 1100 KB（> assetKB、< searchIndexKB）仍失败，证明普通脚本不借用搜索索引预算。先写测试时两条新用例为红，实现后转绿。
- 验证：
  - 真实内容拷入 `apps/*-site/content/`，`pnpm verify` 退出 1，站点检查输出仅剩 ⓐ：
    ```
    搜索索引体积：
    cli/assets/chunks/@localSearchIndexroot.CRYTJrCq.js 84 KB，预算 1536 KB
    forge/assets/chunks/@localSearchIndexroot.CcXmOcxq.js 1191 KB，预算 1536 KB
    forge/demo/index.html 的链接不存在：/forge/analytics.js
    ```
    同状态下单跑 `node scripts/test-site.mjs`：146 通过、4 失败，4 项失败的错误输出均只有 analytics.js 这一条（复制正式产物的用例继承了它）。
  - 删除真实内容后：`pnpm lint` 通过；`pnpm verify` 退出 0（站点检查通过，站点测试 150 项全部通过）；`done-coding harness check --dir docs/governance` 全过（元闸 / 并行闸 / 收口形态 / 清单），`harness lists` 重生成零 diff。
  - 本机 shell 默认 PATH 无 node，本轮用 `~/.nvm/versions/node/v22.23.3/bin`（与 CI 主版本一致）运行。

## 收口验证（2026-11-07，mbp2017 执行会话）

- 依据：HEAD f9a7fe7 已含真实内容（forge 0.100.1 源 903475…、cli 0.23.3 源 32d223…）；`git grep analytics.js apps/*/content` 无结果（ⓐ 的引用已由 forge 移除）。
- 命令：Node v22.23.3 下 `pnpm verify`，退出 0，站点检查通过，站点测试全部通过，其中含 cli-site 与 forge-site 的 docs→demo 链接用例。验收 3（真实内容下 `pnpm verify` 全绿）达成；真实内容本就在库，无需拷入拷出。
- 所涉模块快照（forge-site、site-platform）已在 37bc299、efa30ad 更新，早于归档 commit；本次收口不改变系统事实，快照无需再改（核对：快照中 docs→demo 改写与 searchIndexKB 描述与代码一致）。
- 未完成条目：无，lnz6qr 的三条验收全部满足，条目正文删除后整目录归档。
