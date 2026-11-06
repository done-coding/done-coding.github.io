# 模板新项目的 test 脚本找不到测试文件，以退出码 1 结束（7 个用例）

> 黑盒验收草稿，协调者已于 2026-11-06 复核归因并定稿；只写现象，不猜实现原因。

## 现象

新项目中运行 `pnpm run test`，vitest 输出「No test files found, exiting with code 1」：模板带了 `test` 脚本但没有任何测试文件。

同一现象出现在 7 个用例中：

- template-npm-common（template/standalone） / 测试：测试脚本找不到任何测试文件，以退出码 1 结束
- template-npm-common（template/workspace） / 测试：测试脚本找不到任何测试文件，以退出码 1 结束
- template-npm-node-common（template/standalone） / 测试：测试脚本找不到任何测试文件，以退出码 1 结束
- template-npm-node-common（template/workspace） / 测试：测试脚本找不到任何测试文件，以退出码 1 结束
- template-npm-node-cli（template/standalone） / 测试：测试脚本找不到任何测试文件，以退出码 1 结束
- template-npm-node-cli（template/workspace） / 测试：测试脚本找不到任何测试文件，以退出码 1 结束
- template-node-server（template/standalone） / 测试：测试脚本找不到任何测试文件，以退出码 1 结束

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

新建项目的 `test` 脚本可以直接通过：模板自带测试，或在没有测试文件时不判失败。

## 实际

运行 `pnpm run test`：测试脚本找不到任何测试文件，以退出码 1 结束。输出摘要：

```text
[ELIFECYCLE] Test failed. See above for more details.
exclude:  **/node_modules/**, **/dist/**, **/cypress/**, **/.{idea,git,cache,output,temp}/**, **/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*
watch exclude:  **/node_modules/**, **/dist/**
No test files found, exiting with code 1
```

## 环境

- Darwin 22.6.0 x64，Node v24.22.2，pnpm 12.15.0，npm 11.19.1
- 被测版本：create-done-coding@0.18.1、done-coding@0.23.4、@done-coding/forge@0.100.1
- 验收日期：2026-11-06，临时目录与隔离的 HOME，无全局安装
