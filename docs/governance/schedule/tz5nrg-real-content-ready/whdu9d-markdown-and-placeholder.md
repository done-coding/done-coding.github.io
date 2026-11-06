---
id: whdu9d
title: Markdown 原始 HTML 关闭与“建设中”判定
modules: [forge-site, cli-site, site-platform]
created: 2026-11-06
parent: ""
---

# Markdown 原始 HTML 关闭与“建设中”判定

总协调 2026-11-06 用产品仓新的发布命令，把 forge 0.100.1（445 个文件）与 cli 0.23.3（19 个文件）的真实内容产物写入本仓 `apps/*-site/content/` 后实跑 `pnpm verify`，发现两处站点问题（内容未提交，修好后由总协调重新写入并提交）：

1. **forge-site 构建失败**：`docs/flow/src/bridge/docs/README.md` 的标题含 `createBridge<C extends object>(options)`，VitePress 把 Markdown 当作 Vue 模板编译，报 “Element is missing end tag”。forge 自己的文档站用 `markdown: { html: false }` 渲染同一批文档。
   - 修正：产品站（forge-site、cli-site，宜在 site-kit 共用配置）对内容产物关闭 Markdown 原始 HTML 解析，正文中的尖括号按文本显示。
   - 同步在根 `AGENTS.md`「内容产物契约」补一句：内容产物按纯 Markdown 渲染，不解析原始 HTML 或 Vue 组件。
2. **有真实内容时站点测试失败**：`scripts/test-site.mjs` 断言 “cli-site 正式站显示建设中”，只在没有内容产物时成立。
   - 修正：没有内容产物（无 `current.json`）时显示建设中；有合法内容产物时渲染文档并且不显示建设中。两种情况各一个测试。

验收：用夹具覆盖“标题与正文含 `<T>` 尖括号的文档能构建并原样显示”“有内容不显示建设中”“无内容显示建设中”；`pnpm verify`、`pnpm lint`、治理闸通过。不改 `apps/*-site/content/`。
