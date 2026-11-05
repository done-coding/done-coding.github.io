---
id: v7k2pa
title: 补齐模板工程配置
modules: [site-platform]
created: 2026-11-06
source: 用户 2026-11-06 当轮工程配置任务
after: ""
---

# 补齐模板工程配置

共享骨架独占方：当前本批独占根 `package.json`、`pnpm-lock.yaml`、`AGENTS.md`；锁文件本轮只保留，主协调在沙箱外更新。下一条批次串尚未启动，原有 PROGRESS 不改。

## 任务

| 项 | 状态 | 交付 sha |
|---|---|---|
| [按模板补齐配置](k4m9rx-template-tooling.md) | 已完成 | 未提交（用户禁止） |
| 更新模块快照和上层摘要 | 已更新 | 未提交（用户禁止） |
| 沙箱内验证及来源报告 | 已完成 | 未提交（用户禁止） |
| 主协调安装、更新锁文件、修正 lint、提交后归档 | 已完成 | 未提交（用户禁止） |

## 完成标准与进度

配置源是用户指定的 monorepo-standalone；以实际文件差异、检查退出码为证据，不以自述代替验证。

已保留 pages.yml、site.config.json、原有 scripts 的行为、apps 结构和下一条批次串。已修正脚本的已知长行与无大括号分支；完整 lint 尚待安装依赖验证，不声称已全部符合。

## 快照刷新说明

替换旧事实：模块仅描述静态构建与 Pages，现在补入已落盘的 lint、提交钩子、工作区和 TypeScript 配置，并明确未安装、锁文件未同步。静态构建、统计状态不变。旧事实及变更原因固定保留于本节，快照正文只描述当前事实。

## 文件来源与调整

模板路径统一指用户指定的 `~/Documents/code/done-coding/done-coding-template-hub/templates/monorepo/monorepo-standalone`。

| 文件 | 来源与调整理由 |
|---|---|
| `.eslintrc.cjs` | 模板为基底，保留所有规则及 Vue override；忽略项缩为 node_modules、各级 dist、产品 content，避免模板中 lib、types、styles 等目录免检误伤本站代码。 |
| `.prettierrc.cjs` | 模板原样复制。 |
| `.husky/pre-commit`、`.husky/commit-msg` | 模板原样复制，设为可执行；未安装 husky、未激活 hooks。 |
| `commitlint.config.cjs` | 模板原样复制，保留模板 type 枚举。 |
| `.ls-lint.yml` | 模板命名规则迁到 apps 和 scripts，补 mjs/cjs 后缀；排除各级 dist、node_modules、产品 content，去除不存在的 injectInfo 特例。 |
| `.npmrc` | 模板原样复制。 |
| `tsconfig.json` | 模板严格性选项保留；本站为 Node ESM 静态脚本，改 ES2022/NodeNext、noEmit、allowJs，显式 apps/scripts 与产物排除，使用 node 类型。模板 ES5/CommonJS、declaration 的发包设定不适用。保留模板 @types/node 18 范围，不能据此保证 Node 22+ 专属 API 类型覆盖。 |
| `.done-coding/template.json` | 模板结构保留；包名默认值用现有 done-coding-github-io，工作区文件名替换为 done-coding.github.io。 |
| `done-coding.github.io.code-workspace` | 模板编辑器、扩展设置保留；替换仓名，cSpell 范围改 apps/scripts 并排除 content，改严格 JSON 便于解析。 |
| `package.json` | 保留现有名称、Node/pnpm 约束及 build/check/verify；模板三个安装钩子原样；开发依赖版本原样，去掉 lerna、conventional-changelog、conventional-changelog-cli 和 log；新增 lint 子命令与总命令，lint-staged 改 apps/scripts，移除没有 Python 源码的 Ruff 入口。 |
| `.prettierignore` | 本仓新增，确保格式检查及暂存格式化跳过 dist、node_modules、产品 content。 |
| `scripts/assemble.mjs`、`scripts/check-site.mjs` | 现有文件，仅调整长行、大括号以适配 lint 风格；未改检查语义。 |
| `AGENTS.md` | 现有命令一节补 pnpm lint。 |
| `docs/governance/modules/site-platform/SNAPSHOT.md`、`docs/governance/SNAPSHOT.md` | 按实际落盘状态覆盖更新，未把待安装写成通过。 |
| 本批 PROGRESS 与需求正文 | 按当轮需求新建，after 留空。 |
| `docs/governance/SCHEDULE.md` 等生成清单 | 只由 done-coding harness lists --dir docs/governance 生成，以实际 diff 为准。 |

许可证与风险：模板仓根 package.json 未声明 license，未找到根 LICENSE；模板生成项目声明 MIT，不能据此认定模板仓自身的授权。复制按用户本次明确指令执行。开发依赖沿用模板的版本范围（不是固定解析版本），实际传递依赖与许可证需由主协调安装时核对；安装钩子会执行 npx only-allow、安装 Git hooks、格式化 pnpm-lock.yaml，本轮均未运行。没有新增模板以外的依赖。

## 验证记录

环境：Node v24.22.2，pnpm 12.15.0，master。开始时 `git status --short` 无输出。以下为实际执行结果，未用自述替代检查。

| 实跑命令 | 退出码 | 结果 |
|---|---|---|
| `done-coding harness check --dir docs/governance`（变更前） | 0 | 原有批次串治理闸通过。 |
| `node --check scripts/assemble.mjs` | 0 | 语法通过。 |
| `node --check scripts/check-site.mjs` | 0 | 语法通过。 |
| `for file in scripts/*.mjs .eslintrc.cjs .prettierrc.cjs commitlint.config.cjs; do node --check "$file" \|\| exit; done` | 0 | 所有脚本及 CJS 配置语法通过。 |
| `sh -n .husky/pre-commit && sh -n .husky/commit-msg` | 0 | shell 语法通过。 |
| 下方 `node --input-type=module` 解析及断言 | 0 | 8 份 JSON、16 项 devDependencies 版本和三个安装钩子一致。 |
| 下方 `ruby -r yaml -r date` 解析 | 0 | 3 份 YAML、8 份 frontmatter 解析通过；系统 Ruby 提示 ffi 扩展未构建，不影响本次 YAML 解析。 |
| `pnpm lint` | 130 | pnpm 自动尝试安装缺失依赖，网络被沙箱阻止；发现后发送 Ctrl-C 中止，未进入 ESLint，不是 lint 通过。 |
| `pnpm verify` | 130 | 与 lint 同时启动，等待期间中止；没有构建通过证据。 |
| `done-coding harness lists --dir docs/governance` | 0 | 仅生成 SCHEDULE.md 的差异。 |
| `done-coding harness lists --dir docs/governance --check` | 0 | 清单与条目一致。 |
| `done-coding harness check --dir docs/governance`（变更后） | 1 | `并行闸：2fne7b-site-foundation ∩ v7k2pa-template-tooling = ['site-platform']`。 |
| `done-coding harness instructions` | 0 | 指令预算、链路预算和 CLAUDE.md 兼容入口通过。 |
| `git diff --check` | 0 | 已跟踪 diff 无空白错误；不代表 lint 通过。 |
| `git diff --exit-code -- pnpm-lock.yaml` | 0 | 锁文件与 Git 版本一致；`git ls-files pnpm-lock.yaml` 确认它确为已跟踪文件。 |
| `git diff --cached --exit-code` | 0 | 没有暂存变更。 |
| `git diff --name-only -- .github/workflows/pages.yml site.config.json pnpm-workspace.yaml docs/governance/schedule/2fne7b-site-foundation docs/governance/schedule/h3qhwm-forge-site-shell docs/governance/schedule/igtqwx-cli-site-shell` | 0 | 无输出，保留文件和下一条批次串未改动。 |
| `git branch --show-current` | 0 | master。 |

辅助探测：`python3 -c 'import yaml; print(yaml.__version__)'` 退出 1（无 PyYAML），因此改用系统 Ruby；`command -v prettier`、`command -v eslint` 未找到工具。尝试用 `ps -axo pid,ppid,command` 定位 pnpm 进程时被沙箱拒绝（退出 1），随后用现有执行会话的 Ctrl-C 正常中止，没有提权。

JSON 与依赖断言实跑内容：

```bash
node --input-type=module <<'JS'
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import assert from "node:assert/strict";
const files = ["package.json", "tsconfig.json", ".done-coding/template.json", "done-coding.github.io.code-workspace", "site.config.json", ...["portal", "forge-site", "cli-site"].map(app => `apps/${app}/package.json`)];
for (const file of files) JSON.parse(readFileSync(file, "utf8"));
const source = JSON.parse(readFileSync(homedir() + "/Documents/code/done-coding/done-coding-template-hub/templates/monorepo/monorepo-standalone/package.json", "utf8"));
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
for (const [name, version] of Object.entries(pkg.devDependencies)) assert.equal(version, source.devDependencies[name], name);
for (const hook of ["preinstall", "prepare", "postinstall"]) assert.equal(pkg.scripts[hook], source.scripts[hook]);
assert.deepEqual(pkg.workspaces, ["apps/*"]);
console.log(`JSON 解析通过：${files.length} 文件；${Object.keys(pkg.devDependencies).length} 项依赖版本和三个钩子与模板一致`);
JS
```

YAML 实跑内容：

```bash
ruby -r yaml -r date <<'RUBY'
files = [".ls-lint.yml", "pnpm-workspace.yaml", ".github/workflows/pages.yml"]
files.each { |file| YAML.safe_load(File.read(file), permitted_classes: [Date, Time], aliases: true) }
documents = Dir.glob("docs/governance/**/*.md").select { |file| File.read(file).start_with?("---\n") }
documents.each do |file|
  text = File.read(file)
  frontmatter = text.split(/^---\s*$\n?/, 3)[1]
  YAML.safe_load(frontmatter, permitted_classes: [Date, Time], aliases: true)
end
puts "YAML 解析通过：#{files.length} 配置与 #{documents.length} 份 frontmatter"
RUBY
```

## 自动安装意外与实际边界

未显式运行 pnpm install，但误判 pnpm 脚本调用会直接报缺依赖：本机 pnpm 12 在执行 pnpm lint 时自动尝试补装。发现后已中止两项 pnpm 命令，网络请求被沙箱拒绝。`node_modules/.pnpm-store/` 等本地运行状态可能已改变，不能声称完全没有安装行为；没有安装成功或 hooks 生效的证据。锁文件实测零 diff，未作恢复或手改。后续停止所有 pnpm 调用，仅完成直接检查与阻塞记录。

## 主协调后续

本轮遇阻停止；依赖和锁文件尚未同步，完整 lint 与构建未验证。本批不归档、不提交，交付 sha 留空。

主协调在仓根、沙箱外使用项目锁定的 pnpm 12.15.0 顺序执行：

```bash
pnpm --version
pnpm install --no-frozen-lockfile
pnpm exec eslint apps scripts --ext .js,.mjs,.cjs,.ts,.tsx,.jsx,.vue --fix
pnpm exec prettier --write apps scripts
pnpm lint
pnpm verify
node --check scripts/assemble.mjs
node --check scripts/check-site.mjs
git diff -- pnpm-lock.yaml
done-coding harness lists --dir docs/governance --check
done-coding harness instructions
done-coding harness check --dir docs/governance
```

安装命令会执行模板 preinstall、prepare、postinstall，可能需要网络与 Git hooks 写权限。核对锁文件只含本批开发依赖及模板 postinstall 的预期格式化；若 lint 报错，修实际文件后重跑，不关闭规则取绿。不要把 formatter 写入成功当成 lint 通过。

当前治理闸失败是实测结果，原因是用户要求本批 after 留空、旧串不动且暂留 schedule。继续所需最小条件：主协调安装依赖并完成 lint/构建，提交本批后按既定授权将本批归档（需求正文收口，仅保留带真实 sha 的 PROGRESS），再运行 `done-coding harness lists --dir docs/governance`、`done-coding harness lists --dir docs/governance --check`、`done-coding harness check --dir docs/governance`。本批移出 schedule 后消除这项领域交集，不为取绿改旧串或伪造 after。

未完成项：依赖安装与锁文件更新；ESLint/Prettier/ls-lint 全量验证及必要修复；pnpm verify；真实 hooks/commitlint 执行验证；主协调提交、填 sha、归档和最终治理闸。

## 主协调验收

沙箱外用 pnpm 12.15.0 安装并生成锁；`pnpm lint`、`pnpm verify`、治理闸通过。用户 2026-11-06 要求 Git 钩子只保留 pre-commit，移除模板的 commit-msg，提交规范写进 AGENTS.md。批次 2fne7b 改为 `after: v7k2pa`，解决 site-platform 与本批重叠。
