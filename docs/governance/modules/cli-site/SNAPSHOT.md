# cli-site 快照

## 技术快照

VitePress 站点，`.vitepress/` 只有配置和主题入口，逻辑在 `packages/site-kit`，与 forge 站共用。读 `content/current.json` 指向的版本，生成不进仓的 `.generated/` 作为源目录。当前无内容产物，正式站显示「文档建设中」。

## 业务快照

只呈现产品仓导出的内容，不写 cli 文档正文。首页一句话取自 npm 包描述。

## UX 快照

默认主题加共用页脚。有产物时首页在 `/cli/`，文档在 `/cli/docs/`，侧栏来自 `nav.json`，演示可选，在 `/cli/demo/`。
