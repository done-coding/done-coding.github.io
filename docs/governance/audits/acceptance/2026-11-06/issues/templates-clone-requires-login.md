# 模板列表中 3 个模板的仓库无法匿名克隆（3 个用例）

> 黑盒验收草稿，协调者已于 2026-11-06 复核归因并定稿；只写现象，不猜实现原因。

## 现象

模板列表中的 template-web-mobile-vue3、template-node-express、template-web-site-vue3 指向 gitee 上的仓库（`justsosu/template-web-m-vue3`、`justsosu/template-node-express`、`justsosu/template-web-site-vue3`），匿名 `git clone` 时 git 要求输入用户名（运行环境关闭了交互登录，报「could not read Username for 'https://gitee.com': terminal prompts disabled」），创建失败。另以 `git ls-remote` 单独复核，三个仓库结果相同。

同一现象出现在 3 个用例中：

- template-web-mobile-vue3 / 创建：克隆模板仓库需要登录，无法匿名获取
- template-node-express / 创建：克隆模板仓库需要登录，无法匿名获取
- template-web-site-vue3 / 创建：克隆模板仓库需要登录，无法匿名获取

## 复现命令

以「template-web-mobile-vue3」为例：

```bash
npx -y create-done-coding@0.18.1 -n acc-template-web-mobile-vue3
# 交互中选择模板「template-web-mobile-vue3(默认分支)」，其余问题回车取默认值
cd acc-template-web-mobile-vue3
```

## 期望

公开模板列表中的模板都能匿名克隆并创建项目。

## 实际

运行 `create-done-coding -n acc-template-web-mobile-vue3（交互选择 template-web-mobile-vue3）`：克隆模板仓库需要登录，无法匿名获取。输出摘要：

```text
Command failed: git clone 'https://gitee.com/justsosu/template-web-m-vue3.git' '<tmp>/tmp/done-coding-create-template-source/<uuid>' --depth=1
Error: Command failed: git clone 'https://gitee.com/justsosu/template-web-m-vue3.git' '<tmp>/tmp/done-coding-create-template-source/<uuid>' --depth=1
    at genericNodeError (node:internal/errors:986:15)
    at wrappedFn (node:internal/errors:540:14)
    at checkExecSyncError (node:child_process:943:11)
    at ui (file://<tools>/node_modules/create-done-coding/es/index-909011eb.js:299:5)
    at xn (file://<tools>/node_modules/create-done-coding/es/index-909011eb.js:366:62)
    at fh (file://<tools>/node_modules/create-done-coding/es/index-909011eb.js:4835:30)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
```

## 环境

- Darwin 22.6.0 x64，Node v24.22.2，pnpm 12.15.0，npm 11.19.1
- 被测版本：create-done-coding@0.18.1、done-coding@0.23.4、@done-coding/forge@0.100.1
- 验收日期：2026-11-06，临时目录与隔离的 HOME，无全局安装
