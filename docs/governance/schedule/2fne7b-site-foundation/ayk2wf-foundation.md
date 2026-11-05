---
id: ayk2wf
title: 门户、统计和共用站点基础
modules: [portal, site-platform]
created: 2026-11-06
parent: ""
---

## 需求

ⓐ 选定产品站共用的文档工具，建议 VitePress（MIT），写明选择依据。多个站点共用的布局和配置放一处，不复制。
ⓑ 门户首页：一句话说明 done-coding，给出 forge、cli 入口。文案只写可核实的事实，不写未实现能力。
ⓒ 统计：`analytics.websiteId` 有值时才加载 Umami 脚本，为 null 时不加载；按路径统计 PV，门户到产品站的点击记录为事件。ID 由用户提供，没有就保持 null 继续做。
ⓓ 隐私说明与实际统计行为一致。
ⓔ 检查脚本覆盖相对链接，并在产物含 source map 时失败。

## 完成标准

`pnpm verify` 通过；反例（坏链接、带 source map）会失败；`websiteId` 为 null 和有值两种构建都验证脚本是否加载。
