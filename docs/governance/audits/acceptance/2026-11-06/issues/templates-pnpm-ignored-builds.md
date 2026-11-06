# 模板新项目首次 pnpm install 被 pnpm 拦截依赖构建脚本而失败（14 个用例）

> 黑盒验收草稿，协调者已于 2026-11-06 复核归因并定稿；只写现象，不猜实现原因。

## 现象

用 pnpm 12（本次 12.15.0）安装模板新项目，首次 `pnpm install` 以 `ERR_PNPM_IGNORED_BUILDS` 失败：依赖的构建脚本默认被拦截，项目未声明允许哪些依赖运行构建脚本。被拦截的包因模板而异（见下表）。按提示执行 `pnpm approve-builds --all` 后重新安装，14 个用例都安装成功，后续构建与测试照常执行。

观察：npm/node 类模板的依赖中有 nodejieba@2.5.2，其预编译包对 Node 24（node-v137）darwin-x64 返回 404，批准后在本机从源码编译。

同一现象出现在 14 个用例中：

- template-npm-common（template/standalone） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2
- template-npm-common（template/workspace） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2
- template-npm-node-common（template/standalone） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2
- template-npm-node-common（template/workspace） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2
- template-npm-node-cli（template/standalone） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2
- template-npm-node-cli（template/workspace） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2
- template-node-server（template/standalone） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、esbuild@0.27.2、nodejieba@2.5.2
- template-components-vue3（template/standalone） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2、vue-demi@0.14.10
- template-components-vue3（template/workspace） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2
- template-monorepo（template/common） / 安装依赖：pnpm 拦截了依赖的构建脚本：@parcel/watcher@2.0.4、nx@16.10.0
- template-monorepo（template/components） / 安装依赖：pnpm 拦截了依赖的构建脚本：@parcel/watcher@2.0.4、nx@16.10.0
- template-web-admin-vue3（master） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.20.2、esbuild@0.23.1、vue-demi@0.14.10、vue-demi@0.14.7
- template-web-admin-vue3（subpackage） / 安装依赖：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、esbuild@0.23.1、esbuild@0.28.2、vue-demi@0.14.10
- template-uni-mobile-vue3 / 安装依赖：pnpm 拦截了依赖的构建脚本：@parcel/watcher@2.6.0、core-js@3.51.0、esbuild@0.16.17、esbuild@0.17.19、vue-demi@0.14.10

## 复现命令

以「template-npm-common（template/standalone）」为例：

```bash
npx -y create-done-coding@0.18.1 -n acc-template-npm-common-standalone
# 交互中选择模板「template-npm-common(2个细分分支)」、分支「template/standalone」，其余问题回车取默认值
cd acc-template-npm-common-standalone
pnpm install
pnpm run build
pnpm run test
```

## 期望

按创建完成时提示的步骤执行 `pnpm install` 即可成功，不需要用户额外批准构建脚本。

## 实际

运行 `pnpm install`：pnpm 拦截了依赖的构建脚本：esbuild@0.21.5、nodejieba@2.5.2。输出摘要：

```text
Error: ERR_PNPM_IGNORED_BUILDS
  × installing dependencies
  ╰─▶ Ignored build scripts: esbuild@0.21.5, nodejieba@2.5.2
  help: Run "pnpm approve-builds" to pick which dependencies should be allowed
        to run scripts.
```

## 环境

- Darwin 22.6.0 x64，Node v24.22.2，pnpm 12.15.0，npm 11.19.1
- 被测版本：create-done-coding@0.18.1、done-coding@0.23.4、@done-coding/forge@0.100.1
- 验收日期：2026-11-06，临时目录与隔离的 HOME，无全局安装
