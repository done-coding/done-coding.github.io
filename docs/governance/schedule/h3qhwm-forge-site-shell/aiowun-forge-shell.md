---
id: aiowun
title: forge 站点外壳读取内容产物
modules: [forge-site]
created: 2026-11-06
parent: ""
---

## 需求

ⓐ `apps/forge-site` 以 `/forge/` 作 base，读取 `content/current.json` 指向版本的 `docs/`、`nav.json`，`demo/` 原样发布到 `/forge/demo/`。
ⓑ 内容产物还没到时，用仓内测试夹具验证契约，夹具内容明确标为样例，不发布到正式站；正式站显示「文档建设中」。
ⓒ 不读取 done-coding-forge 的实现代码；需要组件时装 npm 上已发布的 `@done-coding/forge`。

## 完成标准

夹具构建能生成文档页、导航和演示路径；缺 `current.json` 时站点仍能构建并显示建设中；格式错误的产物让构建失败并说明原因。
