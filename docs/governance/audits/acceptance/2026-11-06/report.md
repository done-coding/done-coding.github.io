# 黑盒验收报告 2026-11-06

> 由 `pnpm acceptance` 生成，与同目录 results.json 一致；不要手改。

环境：Darwin 22.6.0 x64，内存 8 GB，Node v24.22.2，pnpm 12.15.0，npm 11.19.1。

被测版本：`create-done-coding@0.18.1`、`done-coding@0.23.4`、`@done-coding/forge@0.100.1`。

结果：33 个用例，通过 11，失败 22，跳过 0。

- forge 消费者的 TypeScript 取 5.x 最新版 5.9.3，因为 vue-tsc 依赖 TypeScript 的 JS API。

## 项目模板

| 用例 | 结果 | 步骤 |
|---|---|---|
| 列出全部模板 | 通过 | 列出模板 通过；列出 template-npm-common 的分支 通过；列出 template-npm-node-common 的分支 通过；列出 template-npm-node-cli 的分支 通过；列出 template-node-server 的分支 通过；列出 template-components-vue3 的分支 通过；列出 template-monorepo 的分支 通过；列出 template-web-admin-vue3 的分支 通过 |
| template-npm-common（template/standalone） | 失败 | 创建 通过；安装依赖 失败；批准构建脚本 通过；批准后重新安装 通过；构建 通过；lint 无此脚本；测试 失败 |
| template-npm-common（template/workspace） | 失败 | 创建 通过；安装依赖 失败；批准构建脚本 通过；批准后重新安装 通过；构建 通过；lint 无此脚本；测试 失败 |
| template-npm-node-common（template/standalone） | 失败 | 创建 通过；安装依赖 失败；批准构建脚本 通过；批准后重新安装 通过；构建 通过；lint 无此脚本；测试 失败 |
| template-npm-node-common（template/workspace） | 失败 | 创建 通过；安装依赖 失败；批准构建脚本 通过；批准后重新安装 通过；构建 通过；lint 无此脚本；测试 失败 |
| template-npm-node-cli（template/standalone） | 失败 | 创建 通过；安装依赖 失败；批准构建脚本 通过；批准后重新安装 通过；构建 通过；lint 无此脚本；测试 失败 |
| template-npm-node-cli（template/workspace） | 失败 | 创建 通过；安装依赖 失败；批准构建脚本 通过；批准后重新安装 通过；构建 通过；lint 无此脚本；测试 失败 |
| template-node-server（template/standalone） | 失败 | 创建 通过；安装依赖 失败；批准构建脚本 通过；批准后重新安装 通过；构建 通过；lint 无此脚本；测试 失败 |
| template-node-server（template/workspace） | 失败 | 创建 通过；安装依赖 失败；构建 未执行；lint 无此脚本；测试 未执行 |
| template-components-vue3（template/standalone） | 失败 | 创建 通过；安装依赖 失败；批准构建脚本 通过；批准后重新安装 通过；构建 通过；lint 通过；测试 无此脚本 |
| template-components-vue3（template/workspace） | 失败 | 创建 通过；安装依赖 失败；批准构建脚本 通过；批准后重新安装 通过；构建 通过；lint 无此脚本；测试 无此脚本 |
| template-monorepo（template/common） | 失败 | 创建 通过；安装依赖 失败；批准构建脚本 通过；批准后重新安装 通过；构建 无此脚本；lint 无此脚本；测试 无此脚本 |
| template-monorepo（template/components） | 失败 | 创建 通过；安装依赖 失败；批准构建脚本 通过；批准后重新安装 通过；构建 无此脚本；lint 无此脚本；测试 无此脚本 |
| template-web-admin-vue3（master） | 失败 | 创建 通过；安装依赖 失败；批准构建脚本 通过；批准后重新安装 通过；构建 失败；lint 通过；测试 无此脚本 |
| template-web-admin-vue3（subpackage） | 失败 | 创建 通过；安装依赖 失败；批准构建脚本 通过；批准后重新安装 通过；构建 失败；lint 无此脚本；测试 无此脚本 |
| template-web-mobile-vue3 | 失败 | 创建 失败 |
| template-uni-mobile-vue3 | 失败 | 创建 通过；安装依赖 失败；批准构建脚本 通过；批准后重新安装 通过；构建 无此脚本；lint 无此脚本；测试 超时 |
| template-node-express | 失败 | 创建 失败 |
| template-web-site-vue3 | 失败 | 创建 失败 |

## forge 消费者

| 用例 | 结果 | 步骤 |
|---|---|---|
| @done-coding/forge@0.100.1 消费者 | 失败 | 安装依赖 通过；批准构建脚本 通过；批准后重新安装 通过；vite build 通过；vue-tsc skipLibCheck=true 通过；vue-tsc skipLibCheck=false 失败 |

## cli 子命令

| 用例 | 结果 | 步骤 |
|---|---|---|
| done-coding create | 通过 | create --help 通过；create template-config 通过；create instances ls 通过 |
| done-coding inject | 通过 | inject --help 通过；inject init 通过；inject 通过 |
| done-coding extract | 通过 | extract --help 通过；extract init 通过；extract 通过 |
| done-coding publish | 通过 | publish --help 通过；真实用法 跳过 |
| done-coding template | 失败 | template --help 通过；template init 通过；template 失败 |
| done-coding component | 失败 | component --help 通过；component list 失败 |
| done-coding generator | 通过 | generator --help 通过；generator list 通过；generator init page 通过 |
| done-coding config | 通过 | config --help 通过；config check 通过 |
| done-coding cc-switch | 通过 | cc-switch --help 通过；真实用法 跳过 |
| done-coding dex | 通过 | dex --help 通过；真实用法 跳过 |
| done-coding harness | 通过 | harness --help 通过；harness lists 通过；harness lists -c 通过；harness check 通过 |
| done-coding completion | 通过 | completion --help 通过；completion 通过 |
| create-done-coding 按 README 的位置参数用法 | 失败 | 位置参数 acc-readme 失败；位置参数 acc-readme -c 失败 |

## 跳过项

- done-coding publish / 真实用法：真实用法会向 npm 发布，需要账号且是对外动作
- done-coding cc-switch / 真实用法：真实用法需要模型服务的账号与 API Key
- done-coding dex / 真实用法：真实用法需要模型服务的账号与 API Key

## 未提供的脚本

- template-npm-common（template/standalone） / lint：package.json 没有 lint 脚本
- template-npm-common（template/workspace） / lint：package.json 没有 lint 脚本
- template-npm-node-common（template/standalone） / lint：package.json 没有 lint 脚本
- template-npm-node-common（template/workspace） / lint：package.json 没有 lint 脚本
- template-npm-node-cli（template/standalone） / lint：package.json 没有 lint 脚本
- template-npm-node-cli（template/workspace） / lint：package.json 没有 lint 脚本
- template-node-server（template/standalone） / lint：package.json 没有 lint 脚本
- template-node-server（template/workspace） / lint：package.json 没有 lint 脚本
- template-components-vue3（template/standalone） / 测试：package.json 没有 test 脚本
- template-components-vue3（template/workspace） / lint：package.json 没有 lint 脚本
- template-components-vue3（template/workspace） / 测试：package.json 没有 test 脚本
- template-monorepo（template/common） / 构建：package.json 没有 build 脚本
- template-monorepo（template/common） / lint：package.json 没有 lint 脚本
- template-monorepo（template/common） / 测试：package.json 没有 test 脚本
- template-monorepo（template/components） / 构建：package.json 没有 build 脚本
- template-monorepo（template/components） / lint：package.json 没有 lint 脚本
- template-monorepo（template/components） / 测试：package.json 没有 test 脚本
- template-web-admin-vue3（master） / 测试：package.json 没有 test 脚本
- template-web-admin-vue3（subpackage） / lint：package.json 没有 lint 脚本
- template-web-admin-vue3（subpackage） / 测试：package.json 没有 test 脚本
- template-uni-mobile-vue3 / 构建：package.json 没有 build 脚本
- template-uni-mobile-vue3 / lint：package.json 没有 lint 脚本

## 失败与问题草稿

- template-npm-common（template/standalone） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2 → [issues/templates-pnpm-ignored-builds.md](issues/templates-pnpm-ignored-builds.md)
- template-npm-common（template/standalone） / 测试：测试脚本找不到任何测试文件，以退出码 1 结束 → [issues/templates-test-without-test-files.md](issues/templates-test-without-test-files.md)
- template-npm-common（template/workspace） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2 → [issues/templates-pnpm-ignored-builds.md](issues/templates-pnpm-ignored-builds.md)
- template-npm-common（template/workspace） / 测试：测试脚本找不到任何测试文件，以退出码 1 结束 → [issues/templates-test-without-test-files.md](issues/templates-test-without-test-files.md)
- template-npm-node-common（template/standalone） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2 → [issues/templates-pnpm-ignored-builds.md](issues/templates-pnpm-ignored-builds.md)
- template-npm-node-common（template/standalone） / 测试：测试脚本找不到任何测试文件，以退出码 1 结束 → [issues/templates-test-without-test-files.md](issues/templates-test-without-test-files.md)
- template-npm-node-common（template/workspace） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2 → [issues/templates-pnpm-ignored-builds.md](issues/templates-pnpm-ignored-builds.md)
- template-npm-node-common（template/workspace） / 测试：测试脚本找不到任何测试文件，以退出码 1 结束 → [issues/templates-test-without-test-files.md](issues/templates-test-without-test-files.md)
- template-npm-node-cli（template/standalone） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2 → [issues/templates-pnpm-ignored-builds.md](issues/templates-pnpm-ignored-builds.md)
- template-npm-node-cli（template/standalone） / 测试：测试脚本找不到任何测试文件，以退出码 1 结束 → [issues/templates-test-without-test-files.md](issues/templates-test-without-test-files.md)
- template-npm-node-cli（template/workspace） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2 → [issues/templates-pnpm-ignored-builds.md](issues/templates-pnpm-ignored-builds.md)
- template-npm-node-cli（template/workspace） / 测试：测试脚本找不到任何测试文件，以退出码 1 结束 → [issues/templates-test-without-test-files.md](issues/templates-test-without-test-files.md)
- template-node-server（template/standalone） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、esbuild@0.27.2、nodejieba@2.5.2 → [issues/templates-pnpm-ignored-builds.md](issues/templates-pnpm-ignored-builds.md)
- template-node-server（template/standalone） / 测试：测试脚本找不到任何测试文件，以退出码 1 结束 → [issues/templates-test-without-test-files.md](issues/templates-test-without-test-files.md)
- template-node-server（template/workspace） / 安装依赖：退出码 1 → [issues/template-acc-template-node-server-workspace--install.md](issues/template-acc-template-node-server-workspace--install.md)
- template-components-vue3（template/standalone） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2、vue-demi@0.14.10 → [issues/templates-pnpm-ignored-builds.md](issues/templates-pnpm-ignored-builds.md)
- template-components-vue3（template/workspace） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2 → [issues/templates-pnpm-ignored-builds.md](issues/templates-pnpm-ignored-builds.md)
- template-monorepo（template/common） / 安装依赖：pnpm 拦截了依赖的构建脚本：@parcel/watcher@2.0.4、nx@16.10.0 → [issues/templates-pnpm-ignored-builds.md](issues/templates-pnpm-ignored-builds.md)
- template-monorepo（template/components） / 安装依赖：pnpm 拦截了依赖的构建脚本：@parcel/watcher@2.0.4、nx@16.10.0 → [issues/templates-pnpm-ignored-builds.md](issues/templates-pnpm-ignored-builds.md)
- template-web-admin-vue3（master） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.20.2、esbuild@0.23.1、vue-demi@0.14.10、vue-demi@0.14.7 → [issues/templates-pnpm-ignored-builds.md](issues/templates-pnpm-ignored-builds.md)
- template-web-admin-vue3（master） / 构建：全新项目首次构建时类型检查找不到 ref、computed 等自动导入的名字 → [issues/templates-build-missing-auto-import-types.md](issues/templates-build-missing-auto-import-types.md)
- template-web-admin-vue3（subpackage） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、esbuild@0.23.1、esbuild@0.28.2、vue-demi@0.14.10 → [issues/templates-pnpm-ignored-builds.md](issues/templates-pnpm-ignored-builds.md)
- template-web-admin-vue3（subpackage） / 构建：全新项目首次构建时类型检查找不到 ref、computed 等自动导入的名字 → [issues/templates-build-missing-auto-import-types.md](issues/templates-build-missing-auto-import-types.md)
- template-web-mobile-vue3 / 创建：克隆模板仓库需要登录，无法匿名获取 → [issues/templates-clone-requires-login.md](issues/templates-clone-requires-login.md)
- template-uni-mobile-vue3 / 安装依赖：pnpm 拦截了依赖的构建脚本：@parcel/watcher@2.6.0、core-js@3.51.0、esbuild@0.16.17、esbuild@0.17.19、vue-demi@0.14.10 → [issues/templates-pnpm-ignored-builds.md](issues/templates-pnpm-ignored-builds.md)
- template-uni-mobile-vue3 / 测试：超过 600 秒未结束 → [issues/template-acc-template-uni-mobile-vue3--test.md](issues/template-acc-template-uni-mobile-vue3--test.md)
- template-node-express / 创建：克隆模板仓库需要登录，无法匿名获取 → [issues/templates-clone-requires-login.md](issues/templates-clone-requires-login.md)
- template-web-site-vue3 / 创建：克隆模板仓库需要登录，无法匿名获取 → [issues/templates-clone-requires-login.md](issues/templates-clone-requires-login.md)
- @done-coding/forge@0.100.1 消费者 / vue-tsc skipLibCheck=false：forge 或消费者源码有 7 条类型诊断 → [issues/forge-consumer--vue-tsc-skiplibcheck-false.md](issues/forge-consumer--vue-tsc-skiplibcheck-false.md)
- done-coding template / template：退出码 1 → [issues/cli-template--template.md](issues/cli-template--template.md)
- done-coding component / component list：退出码 1 → [issues/cli-component--component-list.md](issues/cli-component--component-list.md)
- create-done-coding 按 README 的位置参数用法 / 位置参数 acc-readme：报未知选项，README 的用法不可用 → [issues/cli-create-readme-usage--acc-readme.md](issues/cli-create-readme-usage--acc-readme.md)
- create-done-coding 按 README 的位置参数用法 / 位置参数 acc-readme -c：报未知选项，README 的用法不可用 → [issues/cli-create-readme-usage--acc-readme-c.md](issues/cli-create-readme-usage--acc-readme-c.md)

## 观察

- 列出全部模板：发现 18 个模板变体；「自定义模版路径(默认分支)」「某个git平台用户仓库(默认分支)」是自填地址的入口，不是模板，未纳入矩阵。
- 列出全部模板：非交互模式没有列出模板的参数，只能在交互界面中查看；本运行器用伪终端读取。
- @done-coding/forge@0.100.1 消费者：安装依赖：pnpm 拦截构建脚本（vue-demi@0.14.10），按提示批准后继续
- @done-coding/forge@0.100.1 消费者：vue-tsc skipLibCheck=true：共 0 条诊断，forge/消费者 0 条，第三方 0 条
- @done-coding/forge@0.100.1 消费者：vue-tsc skipLibCheck=false：共 63 条诊断，forge/消费者 7 条，第三方 56 条（@vueuse/core 16、element-plus 40）
