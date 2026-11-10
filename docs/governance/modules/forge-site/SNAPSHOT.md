# forge-site 快照

## 技术快照

VitePress 站点，`.vitepress/` 只有配置和主题入口，逻辑在 `packages/site-kit`。读 `content/` 下全部版本目录，`current.json` 指向的为当前版本，生成不进仓的 `.generated/` 作为源目录。内容按纯 Markdown 渲染（关闭原始 HTML，`{{ }}` 转义），正文中的尖括号与标签按文本显示。当前内容产物有 0.100.1、0.100.2、0.102.0 三个版本，`current.json` 指向 0.102.0（来源 `done-coding-forge@0daee92`）；演示只发布当前版本，在 `/forge/demo/`，左侧示例菜单完整（89 个示例页）；两个历史版本只发布文档，其演示引用 `/forge/demo/` 绝对路径，按契约不发布。尚未安装 `@done-coding/forge`，正文用到组件时再装。

## 业务快照

只呈现产品仓导出的内容，不写 forge 文档正文。首页一句话取自 npm 包描述。

## UX 快照

默认主题加共用页脚。有产物时首页在 `/forge/`，文档在 `/forge/docs/`，侧栏来自 `nav.json`；历史版本在 `/forge/v/<版本>/`，多版本时导航出现版本切换，只有一个版本时不显示；有内容时顶栏有站内搜索，只搜当前版本；演示在 `/forge/demo/`，文档里指向演示的链接直接打开演示。
