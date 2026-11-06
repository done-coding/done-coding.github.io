# done-coding.github.io

done-coding 的公开站点。每个 app 构建到一个 URL 路径，由 `pnpm build` 拼成根 `dist/` 发布到 GitHub Pages。

## 开发流程

[MUST] 开始处理本项目任务前，以及上下文压缩、会话恢复或跨工具接手后，重新读取并遵守
`docs/governance/DEVELOPMENT.md`，其中规则适用于整个项目。
路径相对于本 AGENTS.md 所在的项目根目录，不相对于终端当前目录。
对已授权执行的任务，仅缺权限、前提不成立、缺资源或交付完成时可停；恢复后先读本批 `PROGRESS.md` 并核对未完成项，再继续推进。

## 目录与路径

| 目录 | URL | 放什么 |
|---|---|---|
| `apps/portal` | `/` | 门户首页、404、隐私说明 |
| `apps/forge-site` | `/forge/` | forge 的站点外壳：布局、导航、首页、统计接入 |
| `apps/cli-site` | `/cli/` | cli 的站点外壳：布局、导航、首页、统计接入 |
| `packages/site-kit` | 不发布 | 产品站共用的 VitePress 配置、主题和统计读取 |
| `acceptance` | 不发布 | 只用已发布产物的黑盒验收运行器，本机运行，不进 CI |

新增产品时加 `apps/<产品>-site`，复用 `packages/site-kit`，并在 `site.config.json` 登记。

## 边界

- 本仓不放 forge、cli 的实现代码，开发时也不读取这两个仓的源码。
- 产品的组件用法通过 npm 上已发布的包使用；文档正文和演示来自内容产物。
- `apps/*-site/content/` 是内容产物，由产品仓导出，本仓不手改。
- admin 文档站 `/done-coding-showcase/` 是独立的项目站，本仓不覆盖。

## 内容产物契约

产品仓把产物导出到 `apps/<产品>-site/content/<版本>/`，并更新 `apps/<产品>-site/content/current.json`：

- `current.json`：`{ "version": "0.100.1", "source": "<产品仓>@<提交>" }`
- `docs/`：Markdown 文档，站内链接用相对路径
- `demo/`：可选，已构建的静态演示，由产品仓用 `/<产品>/demo/` 作 base 构建；文档可用相对路径链接同版本的 `demo/`（如 `../demo/#/form`），站点改写为演示地址
- `nav.json`：文档导航，非空数组，每项 `{ "text": 标题, "link"?: 相对 docs/ 的路径, "items"?: 子项 }`，`link` 和 `items` 至少有一个；`link` 可省略 `.md`，目录写成 `guide/`（对应 `guide/index.md`）

`content/` 下每个版本目录都会发布：`current.json` 指定的版本在 `/<产品>/`，其余在 `/<产品>/v/<版本>/`，多于一个版本时导航出现版本切换，站内搜索只索引当前版本。历史版本的演示只有不引用 `/<产品>/demo/` 绝对路径时才发布到 `/<产品>/v/<版本>/demo/`。

内容产物按纯 Markdown 渲染，不解析原始 HTML 或 Vue 组件：正文中的尖括号、标签和 `{{ }}` 都按文本显示。

产物不含源码和 source map。修改契约时，同时通知产品仓。

## 站点检查

`pnpm verify` 的站点检查除链接和 source map 外，还要求每个可收录页面有 title、description、指向自身的 canonical 和 Open Graph，并列入站根 `sitemap.xml`；图片要有 alt、标题不跳级、`<html>` 有 lang；单个页面与脚本样式不超过 `site.config.json` 的 `budgets`。演示是产品仓的独立应用，只查链接与 source map。门户的兼容性矩阵页在构建时读取 `docs/governance/audits/acceptance/` 下最近一次 `results.json`。

## 统计

`site.config.json` 的 `analytics.websiteId` 是公开 ID，为 `null` 时不加载统计脚本。隐私说明要与实际统计行为一致。令牌和账号不进仓库。

## 命令

```bash
pnpm install
pnpm verify
pnpm lint
pnpm acceptance        # 黑盒验收，联网，约一小时，见 acceptance/README.md
```

## 提交

Git 钩子与模板一致：pre-commit 跑 lint-staged，commit-msg 跑 commitlint，其他检查靠本节引导，不靠钩子阻塞。改动站点或脚本后运行 `pnpm lint` 和 `pnpm verify`，纯文案改动不用跑。

显式 pathspec 提交，不用 `git add -A`。push 每次单独授权。提交文档不写本机家目录绝对路径。
