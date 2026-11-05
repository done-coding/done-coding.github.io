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

新增产品时加 `apps/<产品>-site` 并在 `site.config.json` 登记。

## 边界

- 本仓不放 forge、cli 的实现代码，开发时也不读取这两个仓的源码。
- 产品的组件用法通过 npm 上已发布的包使用；文档正文和演示来自内容产物。
- `apps/*-site/content/` 是内容产物，由产品仓导出，本仓不手改。
- admin 文档站 `/done-coding-showcase/` 是独立的项目站，本仓不覆盖。

## 内容产物契约

产品仓把产物导出到 `apps/<产品>-site/content/<版本>/`，并更新 `apps/<产品>-site/content/current.json`：

- `current.json`：`{ "version": "0.100.1", "source": "<产品仓>@<提交>" }`
- `docs/`：Markdown 文档，站内链接用相对路径
- `demo/`：可选，已构建的静态演示，由产品仓用 `/<产品>/demo/` 作 base 构建
- `nav.json`：文档导航

产物不含源码和 source map。修改契约时，同时通知产品仓。

## 统计

`site.config.json` 的 `analytics.websiteId` 是公开 ID，为 `null` 时不加载统计脚本。隐私说明要与实际统计行为一致。令牌和账号不进仓库。

## 命令

```bash
pnpm install
pnpm verify
pnpm lint
```

## 提交

Git 钩子只保留 pre-commit 的 lint-staged，其他检查靠本节引导，不靠钩子阻塞。提交信息遵循 Conventional Commits；改动站点或脚本后运行 `pnpm lint` 和 `pnpm verify`，纯文案改动不用跑。

显式 pathspec 提交，不用 `git add -A`。push 每次单独授权。提交文档不写本机家目录绝对路径。
