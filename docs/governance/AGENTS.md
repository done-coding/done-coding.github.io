# 治理文件维护规则

> 文档定位：规范 · 仅在维护 docs/governance/ 文件时适用；只读 DEVELOPMENT.md 不表示启动治理维护。

全项目流程见 [DEVELOPMENT.md](DEVELOPMENT.md)。

- [MUST] 需求正文单态存放；流转用 `git mv`。条目名为 `<6位base36>-<slug>.md`，批次目录同格式，不用自增号或日期前缀。
- [MUST] backlog 及批次条目 frontmatter 有 `id`、`title`、`modules`、`created`、`parent`；modules 非空且来自 MODULES.md 垂直领域表。
- [MUST] 批次 PROGRESS frontmatter 有 `id`、`title`、`modules`、`created`、`source`、`after`；记录共享骨架独占方、进度、验证与逐项交付 sha。
- [MUST] dropped 条目写 `dropped` 理由和 `dropped_at`，合并另写 `merged_into`。
- [MUST] schedule/、archive/ 根下只放一级批次目录；交付前未完成条目回池，更新所涉快照后归档，每个 archive 批次只留带交付 sha 的 PROGRESS.md。
- [MUST NOT] 手写 BACKLOG.md、SCHEDULE.md、ARCHIVE-DONE.md、DROPPED.md；条目变化同轮运行 `done-coding harness lists --dir docs/governance`。
- [MUST] 提交前运行 `done-coding harness check --dir docs/governance`。
- [MUST] 快照覆盖当前事实；刷新说明写本批 PROGRESS，不持续追加到快照。
