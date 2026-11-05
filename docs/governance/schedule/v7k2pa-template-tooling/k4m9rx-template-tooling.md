---
id: k4m9rx
title: 按 monorepo 模板补齐站点工程配置
modules: [site-platform]
created: 2026-11-06
parent: ""
---

## 需求与授权边界

ⓐ 只读参照 `~/Documents/code/done-coding/done-coding-template-hub/templates/monorepo/monorepo-standalone`，补齐工程配置和模板版本的开发依赖，保留现有构建、应用、发布与治理结构。
ⓑ 工作区使用 `apps/*`；lint 覆盖 apps、scripts，排除 dist 和 `apps/*-site/content`。不关闭规则取绿。
ⓒ 不引入 Lerna、发包工作流、changelog 等发包专用脚本和依赖。
ⓓ 在 master 原地操作，不用 worktree、不安装依赖、不修改锁文件、不启动服务、不暂存、不提交、不 push。
ⓔ 新批次 modules 为 `[site-platform]`，after 留空；下一条串 `2fne7b → h3qhwm → igtqwx` 不动。批次留在 schedule，待主协调提交后归档。

## 验收

配置对比说明逐文件可查；运行脚本语法、JSON/YAML 解析、清单检查和治理闸，记录实跑退出码；依赖缺失的 lint 和锁文件同步明确交主协调执行。更新模块快照和上层摘要。
