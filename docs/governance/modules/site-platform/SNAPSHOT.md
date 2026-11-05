# site-platform 快照

## 技术快照

`assemble.mjs` 按配置拼装，`check-site.mjs` 检查首页和站内绝对链接，`pages.yml` 发布到 GitHub Pages，尚未真实运行。`analytics.websiteId` 为 null，未加载统计。

根工程已补 ESLint/Prettier、ls-lint、Husky（只有 pre-commit）、TypeScript、VS Code 工作区和模板元数据。`pnpm lint` 检查 apps/scripts，忽略各级 dist 与产品内容产物；暂存检查沿用同一范围。根开发依赖版本来自 monorepo-standalone，移除了 Lerna/changelog 发包工具。依赖尚未安装，锁文件未更新，完整 lint 与 hooks 尚未验证生效。

## 业务快照

不持有业务内容。

## UX 快照

无 UI 面。
