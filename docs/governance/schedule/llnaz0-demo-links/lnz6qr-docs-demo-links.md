---
id: lnz6qr
title: 文档指向同版本演示的链接不被当作死链
modules: [forge-site, site-platform]
created: 2026-11-06
parent: ""
---

# 文档指向同版本演示的链接不被当作死链

总协调 2026-11-06 把真实内容产物（forge 0.100.1、cli 0.23.3）写入 `apps/*-site/content/` 后实跑 `pnpm verify`，forge-site 的 VitePress 构建报 4 个 dead link：

```
Found dead link ./../../demo/index in file docs/core/panel-retired.md
Found dead link ./../demo/index in file docs/index.md
```

原文是 `[...](../demo/)`、`(../../demo/#/form/guide)` 这类相对链接。按内容产物契约，docs 可链接同版本的 `demo/`：演示是产品仓独立构建的静态应用，当前版本发布在 `<base>demo/`，可迁移的历史版本在 `<base>v/<版本>/demo/`。VitePress 把它当作站内页面校验，所以报死链；现有夹具没有指向演示的文档链接，测试没抓到。

验收：

1. 指向同版本 `demo/`（含历史版本）的文档链接在产物里是可用的演示地址，点击不走 VitePress 路由；不全局关闭死链检查，“文档内坏链接使构建失败”仍生效。
2. 夹具补 docs→demo 链接用例，修前红、修后绿；断言产物 HTML 中链接指向实际存在的演示首页。
3. 放入真实内容后 `pnpm verify` 全绿；移除后仍全绿。真实内容不提交。
