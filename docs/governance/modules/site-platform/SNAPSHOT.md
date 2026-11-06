# site-platform 快照

## 技术快照

`assemble.mjs` 按配置拼装，并生成覆盖全站的 `sitemap.xml` 和 `robots.txt`（站根 `https://done-coding.github.io/`）。`check-site.mjs` 检查首页、根绝对和相对链接、source map；每个可收录页面的 title、description、指向自身的 canonical、Open Graph 和 sitemap 收录；图片 alt、标题跳级、`<html lang>`；单页与脚本样式的体积预算（`site.config.json` 的 `budgets`：页面 256 KB、脚本样式 1024 KB）。演示目录是产品仓的独立应用，只查链接与 source map。页面枚举和地址规则在 `site-pages.mjs`，拼装与检查共用。`test-site.mjs` 对每项检查有正反例，已并入 `pnpm verify`；`pages.yml` 发布到 GitHub Pages，尚未真实运行。

产品站共用基础在 `packages/site-kit`：VitePress 1.6（MIT）配置工厂、主题、统计读取、内容产物校验和测试夹具，选择依据见其 README。配置工厂给每页生成 canonical 与 Open Graph；内容产物下每个版本目录都发布，`current.json` 的版本在站点原路径，其余在 `v/<版本>/`，多版本时导航出现版本切换；有内容时启用 VitePress 自带的本地搜索（minisearch，随 VitePress 安装，未新增依赖），只索引当前版本。夹具含当前与历史两个版本。`analytics.websiteId` 当前为 null，不加载统计；有值时加载 Umami 脚本，两种构建均有测试。

依赖已安装，`pnpm-workspace.yaml` 只批准 esbuild 的构建脚本。`pnpm lint` 覆盖 apps、scripts、packages，忽略 dist、VitePress 缓存和产品内容产物。

## 业务快照

不持有业务内容。

## UX 快照

共用主题在默认主题底部加页脚，链接门户首页和隐私说明。
