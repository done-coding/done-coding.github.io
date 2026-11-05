# site-platform 快照

## 技术快照

`assemble.mjs` 按配置拼装；`check-site.mjs` 检查首页、根绝对和相对链接、source map；`test-site.mjs` 跑反例和统计开关测试，已并入 `pnpm verify`；`pages.yml` 发布到 GitHub Pages，尚未真实运行。

产品站共用基础在 `packages/site-kit`：VitePress 1.6（MIT）配置工厂、主题和统计读取，选择依据见其 README。`analytics.websiteId` 当前为 null，不加载统计；有值时加载 Umami 脚本，两种构建均有测试。

依赖已安装，`pnpm-workspace.yaml` 只批准 esbuild 的构建脚本。`pnpm lint` 覆盖 apps、scripts、packages，忽略 dist、VitePress 缓存和产品内容产物。

## 业务快照

不持有业务内容。

## UX 快照

共用主题在默认主题底部加页脚，链接门户首页和隐私说明。
