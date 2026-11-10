# site-platform 快照

## 技术快照

`assemble.mjs` 按配置拼装，并生成覆盖全站的 `sitemap.xml` 和 `robots.txt`（站根 `https://done-coding.github.io/`）。`check-site.mjs` 检查首页、根绝对和相对链接、source map；每个可收录页面的 title、description、指向自身的 canonical、Open Graph 和 sitemap 收录；图片 alt、标题跳级、`<html lang>`；单页与脚本样式的体积预算（`site.config.json` 的 `budgets`：页面 256 KB、脚本样式 1024 KB；VitePress 本地搜索索引 `@localSearchIndex*.js` 只在打开搜索时按需加载，单列 1536 KB，检查输出列出每个搜索索引的实际大小与预算）。演示目录是产品仓的独立应用，只查链接与 source map。页面枚举和地址规则在 `site-pages.mjs`，拼装与检查共用。`test-site.mjs` 对每项检查有正反例，已并入 `pnpm verify`；`pages.yml` 发布到 GitHub Pages，尚未真实运行。

产品站共用基础在 `packages/site-kit`：VitePress 1.6（MIT）配置工厂、主题、统计读取、内容产物校验和测试夹具，选择依据见其 README。配置工厂给每页生成 canonical 与 Open Graph；内容产物下每个版本目录都发布，`current.json` 的版本在站点原路径，其余在 `v/<版本>/`，多版本时导航出现版本切换；内容产物按纯 Markdown 渲染（`markdown.html: false`，正文与行内代码中的 `{{ }}` 转义为实体）；文档里指向同版本 `demo/` 的相对链接改写为演示站内地址并加 `target="_self"`，绕开 VitePress 路由与死链检查（历史版本的演示未发布时改指该版本首页，没有演示的版本照常报死链）；有内容时启用 VitePress 自带的本地搜索（minisearch，随 VitePress 安装，未新增依赖），只索引当前版本。夹具含当前与历史两个版本，标题与正文带尖括号、标签和插值的文档，以及指向同版本演示的文档链接。正式站断言按是否已有内容产物分两种。`analytics.websiteId` 已填入复用 showcase 的 Umami 站点 ID `113f1baf-0830-4993-a686-e6a17a04bdcf`，门户与文档页加载 Umami Cloud 统计脚本，产品演示页不加载；脚本通过 `data-domains` 限定只在 `site.config.json` 的 `origin` 所指定的线上域名 `done-coding.github.io` 上报，通过 `data-exclude-search="true"` 排除页面路径中的查询参数；null / 有值两种构建均有测试。

依赖已安装，`pnpm-workspace.yaml` 只批准 esbuild 的构建脚本。`pnpm lint` 覆盖 apps、scripts、packages，忽略 dist、VitePress 缓存和产品内容产物。

## 业务快照

不持有业务内容。

## UX 快照

共用主题在默认主题底部加页脚，链接门户首页和隐私说明。
