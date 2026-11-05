# portal 快照

## 技术快照

静态页面，`scripts/build-static.mjs` 从 `public/` 复制到 `dist/`，并按 `analytics.websiteId` 注入统计脚本、选择隐私说明内容块。

## 业务快照

一句话介绍 done-coding，入口指向 forge 和 cli，文案只取 npm 已发布包的描述。隐私说明按统计开关输出：未启用时写明未启用，启用时写明 Umami 记录的内容、IP 处理方式和产品演示页不加载统计。门户到产品站的点击记为 `portal-to-forge`、`portal-to-cli` 事件。

## UX 快照

首页、404、隐私说明共用 `portal.css`，支持深浅色，手机宽度单列显示。
