# template-uni-mobile-vue3：新项目 4 个测试失败，且 test 脚本进入监听模式不退出

> 黑盒验收草稿，协调者已于 2026-11-06 复核归因并定稿；只写现象，不猜实现原因。

## 现象

新项目中运行 `pnpm run test`：`src/api/__tests__/index.spec.ts` 的 5 个测试中 4 个失败（`TypeError: Cannot read properties of undefined (reading 'split')`），1 个跳过；随后 vitest 停在「Watching for file changes...」，命令不会自行结束，600 秒后被验收运行器终止。

## 复现命令

```bash
npx -y create-done-coding@0.18.1 -n acc-template-uni-mobile-vue3
# 交互中选择模板「template-uni-mobile-vue3(默认分支)」，其余问题回车取默认值
cd acc-template-uni-mobile-vue3
pnpm install
pnpm run test
```

## 期望

新项目的测试通过，`test` 脚本运行一次后自行退出。

## 实际

运行 `pnpm run test`：超过 600 秒未结束。输出摘要：

```text
stdout | src/api/__tests__/index.spec.ts > api base > 通用接口 - 网络成功, 业务失败
58 TypeError: Cannot read properties of undefined (reading 'split')
 ❯ src/api/__tests__/index.spec.ts  (5 tests | 4 failed | 1 skipped) <t>
     → Cannot read properties of undefined (reading 'split')
   ❯ src/api/__tests__/index.spec.ts > api base > 通用接口 - 网络成功, 业务失败
     → expected TypeError: Cannot read properties of unde… to deeply equal { code: 500, message: '业务失败', …(1) }
     → expected TypeError: Cannot read properties of unde… to deeply equal { code: 40005, message: '未登录', …(1) }
   ❯ src/api/__tests__/index.spec.ts > api base > 通用接口 - 网络失败
   Start at  <clock>
   Duration  <t> (transform <t>, setup <t>, collect <t>, tests <t>, environment <t>, prepare <t>)
 FAIL  Tests failed. Watching for file changes...
       press h to show help, press q to quit
```

## 环境

- Darwin 22.6.0 x64，Node v24.22.2，pnpm 12.15.0，npm 11.19.1
- 被测版本：create-done-coding@0.18.1、done-coding@0.23.4、@done-coding/forge@0.100.1
- 验收日期：2026-11-06，临时目录与隔离的 HOME，无全局安装
