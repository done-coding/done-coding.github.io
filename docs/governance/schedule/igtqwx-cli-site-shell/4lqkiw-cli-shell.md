---
id: 4lqkiw
title: cli 站点外壳读取内容产物
modules: [cli-site]
created: 2026-11-06
parent: ""
---

## 需求

`apps/cli-site` 以 `/cli/` 作 base，按同一内容产物契约读取，复用共用站点基础，不复制 forge 站的代码。不读取 done-coding-cli 的实现代码。

## 完成标准

与 forge 站相同的三种情况都验证通过：有夹具、缺产物、产物格式错误。
