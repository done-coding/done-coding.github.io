# portal 快照

## 技术快照

静态页面，`scripts/build-static.mjs` 从 `public/` 复制到 `dist/`，按 `analytics.websiteId` 注入统计脚本、选择隐私说明内容块，并给每页注入 canonical 与 Open Graph（取页面的 title 和 description，缺少即构建失败；`noindex` 的 404 页不加）。`render-compatibility.mjs` 在构建时读取 `docs/governance/audits/acceptance/` 下日期最新的 `results.json`，填进兼容性矩阵页；只读结果，不运行验收。

## 业务快照

一句话介绍 done-coding，入口指向 forge 和 cli，文案只取 npm 已发布包的描述。兼容性矩阵页按产品（create-done-coding 的模板、forge 消费者、cli 子命令）列出被测版本、通过数和每个用例的通过或失败与未通过的步骤，并写明验收日期与环境；没有结果时显示「暂无验收结果」。门户已启用 Umami Cloud 统计，隐私说明输出启用版，写明 Umami 记录的内容、IP 处理方式，以及脚本只加载在门户和文档页、产品演示页不加载；脚本只在 `done-coding.github.io` 线上域名上报，记录页面路径时不含查询参数。门户到产品站的点击记为 `portal-to-forge`、`portal-to-cli` 事件。

## UX 快照

首页、404、隐私说明、兼容性矩阵共用 `portal.css`，支持深浅色，手机宽度单列显示，矩阵表格窄屏时横向滚动。首页页脚链接兼容性矩阵和隐私说明。
