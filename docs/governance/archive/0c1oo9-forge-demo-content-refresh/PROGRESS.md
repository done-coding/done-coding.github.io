---
id: 0c1oo9
title: forge 0.100.2 内容产物换用修复后的 demo
modules: [forge-site, product-acceptance]
created: 2026-11-07
source: 主协调下发（用户 2026-11-07 授权按部就班推进）
after: ""
---

# forge 0.100.2 内容产物换用修复后的 demo

本机 master 上未推送的 `cf59710` 写入的 forge 0.100.2 demo 为空（只剩首页），根因与修复见 forge rlkjn3。

## 任务

| 项 | 状态 | 交付 sha |
| --- | --- | --- |
| 在 forge 合入后的 HEAD 上 `pnpm -F @done-coding/showcase build` 与 `publish:content --site <本仓>`，替换 `cf59710` 中的 forge 内容（cf59710 未推送，可直接改写；cli 0.24.0 内容保留） | 已完成 | 见收口 |
| 浏览器验收：`/forge/demo/` 左侧示例菜单齐全、抽查 3 个示例页可渲染；`pnpm verify` 通过 | 已完成 | 见收口 |
| `acceptance/cases/templates.mjs` 中 DOCUMENTED_TEMPLATES 的来源说明从 0.23.3 更新为当前 cli 文档版本 0.24.0，并复核文档是否仍未选用具体模板 | 已完成 | `3df62d2` |
| 刷新所涉模块快照与上层摘要；归档本批（只留 PROGRESS.md），`done-coding harness lists` / `check` 通过 | 已完成 | 见收口 |
| 串末：报告各批交付 sha、验证结果与未完成项（压缩由用户另行指示，本串不做） | 已完成 | 见收口 |
| 收工 | | |

## 边界（整串通用）

- 分支：`master（本仓一直直接推 master 部署 Pages，用户确认）`（主协调建），整串提交都在此分支；push、合并由用户执行。
- 开工先读根 AGENTS.md、docs/governance/AGENTS.md 与 DEVELOPMENT.md，并逐条核实条目里写的「现状」；与实际不符时以实测为准并在 PROGRESS 记录，不照搬。
- 允许：本机服务、本机数据库与对象存储、联网安装锁定依赖。禁止：付费 API、连接生产或非本机服务、读取或输出 .env 值与凭据、改其他仓（跨仓问题用 `done-coding harness issue` 提）、发布、git worktree、手改锁文件。显式 pathspec 提交。
- 测试按改动范围选择受影响门禁，不固定跑全量（用户口径）；完成声明附命令与退出码。
- 遇真实阻塞（权限、上游未交付、需用户裁决）写本文件「阻塞」并继续不受影响的部分；跨仓前置未满足的批次可先做不依赖部分，或在 PROGRESS 写明等待点后进入下一批。

## 进入条件

forge `fix/showcase-content-demo`（`205912e`，rlkjn3：demo 恢复完整示例）已推送并合入 forge master。未满足时本批只做第 3 项并写等待点。

## 阻塞（已解除）

- **等待点（2026-11-07 实测）**：进入条件未满足。forge `205912e` 只在本地分支 `fix/showcase-content-demo`，远端无此分支（`git ls-remote --heads origin fix/showcase-content-demo` 为空），origin/master 仍为 `7f67bb1`。第 1、2、4 项依赖它，需用户推送并合入 forge master 后继续；继续时从第 1 项开始。
- forge 本地工作区当前在 `feat/behavior-analytics`（另一批 jvd529 在途），重建内容产物时不得切换或改动该工作区，需另行确认构建用的检出方式（本串禁用 git worktree）。
- 2026-11-08 复查仍未满足（forge origin/master `7f67bb1`，远端无含 `205912e` 的分支）。总协调分工：恢复后能交 Codex 的部分（第 1 项构建与产物替换、第 4 项快照与归档）优先交 Codex，Claude 复核；第 2 项浏览器验收由 Claude 在沙箱外执行。
- 2026-11-10 用户已推送 master 至 `70970b7`，`cf59710`（空 demo 的 forge 0.100.2 内容）已上线，不能再改写：第 1 项改为追加新提交替换 forge 内容，cli 0.24.0 内容保留；在此之前线上 `/forge/demo/` 只有首页。

## 进度

- 2026-11-07 第 3 项：复核 `apps/cli-site/content/0.24.0/docs/`，create.md 只用 `<模板地址>` 占位与示例清单，index.md 只写 `npm create done-coding my-project`，forge 内容未引用 create；仍未选用具体模板，`DOCUMENTED_TEMPLATES` 保持为空。来源说明 0.23.3 → 0.24.0，同一事实在 `acceptance/README.md` 与 `modules/product-acceptance/SNAPSHOT.md` 一并替换（旧事实「截至 cli 0.23.3」不再保留，历史见 git）。验证：`pnpm lint` 退出码 0；仅改注释与文档，未跑 verify / acceptance。
- 2026-11-11 进入条件满足（实测）：forge origin/master `0daee92`（tag `v0.102.0`），`205912e` 的代码改动（`apps/showcase/scripts/build.mjs`、`apps/reference/vite.config.ts`、`apps/showcase/tests/content-artifact.test.mjs` 等）与 origin/master 逐文件一致，随 #12 合入。forge 发布流水线 42839801839 成功，日志含 `lerna success published` 全部包 0.102.0；npmjs 上 `@done-coding/forge` latest 已为 0.102.0，`forge-core` 当时仍查到 0.101.0（registry 同步延迟，本仓内容产物不依赖它）。
- 前提调整（以实测为准）：forge HEAD 已是 0.102.0，不再重导 0.100.2，改为导出 0.102.0 作为当前版本；`cf59710` 已推送不可改写，用新提交追加。0.100.2 保留为历史版本，其演示引用 `/forge/demo/` 绝对路径，按契约不发布到 `/forge/v/0.100.2/demo/`，线上不再出现空演示。
- 构建方式：forge 本地工作区被其他会话占用（`fix/triage-post-alpha`），且禁用 worktree，故从本地 forge 仓 clone 到会话 scratchpad，检出 `0daee92`。`pnpm install --frozen-lockfile`（pnpm 12.15.0 与 forge 锁定一致）退出码 0 → `pnpm -r --filter "./packages/**" run build` 退出码 0（首次直接构建 showcase 因库包未构建、无法解析 `@done-coding/forge/style.css` 失败）→ `pnpm -F @done-coding/showcase build` 退出码 0 → `publish:content --site <本仓>`：「已写入内容：版本 0.102.0，451 个文件」，`current.json` 为 `{ "version": "0.102.0", "source": "done-coding-forge@0daee92b3adc7d7f115bb001c5dd1ee4ae8111f3" }`；clone 工作区始终干净。因需联网安装并跨目录写入本仓，Codex 沙箱不适用，由 Claude 执行。cli 0.24.0 内容未动。
- 验证：`pnpm verify` 退出码 0（站点测试全部通过）；产物无 `.map`。浏览器（cdp-ui 无头 Chrome，本机 `python3 -m http.server` 预览 dist）：`/forge/demo/` 左侧 el-menu 89 个叶子项，分组首页 / 基础 / 配置 / 表单 / 数据 / 导航 / 反馈 / 其他 / 布局齐全；抽查 `#/form/guide`（FormMain · 最佳实践，7 个表单项）、`#/data/table/toolbar`（TableMain · toolbar 按钮，1 个表格）、`#/feedback/modal/guide`（ModalPorter · 最佳实践）均正常渲染。控制台观察（只记录不下结论）：`[permission] check 抛错，按无权处理`（对应演示中「check 抛错 · 应无权」示例）；`ElementPlusError: [ElMenuItem] Missing required prop: "index"`，属 forge 演示自身，本仓不改。
- 快照刷新：forge-site 原「当前无内容产物，正式站显示「文档建设中」」、根快照 forge-site 行原「尚无产物，显示建设中」，替换为当前版本 0.102.0 及历史版本事实；旧事实只留本文件。发现根快照 cli-site 行「尚无产物，显示建设中」同样过时（cli 已有 0.23.3、0.24.0 内容），不在本批领域，未改，留待 cli-site 批次。

## 收口

内容提交 `459d352`，归档 sha 见本表；`done-coding harness lists` / `check` 通过。未完成：根快照 cli-site 行过时（见上）；forge 演示 `ElMenuItem` 缺 `index` 告警未转交 forge。
