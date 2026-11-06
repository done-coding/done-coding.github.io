# template-web-admin-vue3 新项目首次构建时类型检查找不到 ref、computed 等名字（2 个用例）

> 黑盒验收草稿，协调者已于 2026-11-06 复核归因并定稿；只写现象，不猜实现原因。

## 现象

template-web-admin-vue3 的 master 与 subpackage 两个分支，新项目安装完成后首次 `pnpm run build`，类型检查报 `TS2304: Cannot find name 'ref'`（以及 computed、watch、provide），以退出码 2 结束。源码中这些名字没有显式 import。

同一现象出现在 2 个用例中：

- template-web-admin-vue3（master） / 构建：全新项目首次构建时类型检查找不到 ref、computed 等自动导入的名字
- template-web-admin-vue3（subpackage） / 构建：全新项目首次构建时类型检查找不到 ref、computed 等自动导入的名字

## 复现命令

以「template-web-admin-vue3（master）」为例：

```bash
npx -y create-done-coding@0.18.1 -n acc-template-web-admin-vue3-master
# 交互中选择模板「template-web-admin-vue3(2个细分分支)」、分支「master」，其余问题回车取默认值
cd acc-template-web-admin-vue3-master
pnpm install
pnpm run build
pnpm run lint
```

## 期望

按创建完成时提示的步骤，全新项目可以直接 `pnpm run build` 成功。

## 实际

运行 `pnpm run build`：全新项目首次构建时类型检查找不到 ref、computed 等自动导入的名字。输出摘要：

```text
src/components/app-layout/AppBody.vue(54,21): error TS2304: Cannot find name 'ref'.
src/components/app-layout/AppBody.vue(58,39): error TS2304: Cannot find name 'ref'.
src/components/app-layout/AppBody.vue(60,1): error TS2304: Cannot find name 'provide'.
src/components/app-layout/AppBody.vue(62,25): error TS2304: Cannot find name 'computed'.
src/components/app-layout/AppBody.vue(66,23): error TS2304: Cannot find name 'computed'.
src/components/app-layout/AppBody.vue(70,16): error TS2304: Cannot find name 'computed'.
src/components/app-layout/AppBody.vue(74,27): error TS2304: Cannot find name 'computed'.
src/components/app-layout/AppBody.vue(109,1): error TS2304: Cannot find name 'watch'.
src/store/user.ts(154,3): error TS2304: Cannot find name 'watch'.
src/store/user.ts(154,17): error TS7006: Parameter 'n' implicitly has an 'any' type.
src/store/user.ts(154,20): error TS7006: Parameter 'o' implicitly has an 'any' type.
[ELIFECYCLE] Command failed with exit code 2.
```

## 环境

- Darwin 22.6.0 x64，Node v24.22.2，pnpm 12.15.0，npm 11.19.1
- 被测版本：create-done-coding@0.18.1、done-coding@0.23.4、@done-coding/forge@0.100.1
- 验收日期：2026-11-06，临时目录与隔离的 HOME，无全局安装
