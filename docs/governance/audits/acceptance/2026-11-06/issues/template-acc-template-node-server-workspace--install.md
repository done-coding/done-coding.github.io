# template-node-server（template/workspace）：首次 pnpm install 时根 postinstall 找不到 prettier

> 黑盒验收草稿，协调者已于 2026-11-06 复核归因并定稿；只写现象，不猜实现原因。

## 现象

新建项目首次 `pnpm install` 以退出码 1 结束：项目根的 `postinstall` 执行 `prettier --write ./pnpm-lock.yaml`，此时 `prettier` 命令不存在（退出状态 127）。

本机 PATH 上恰好有 prettier 时，这一步会通过，安装随后报 `ERR_PNPM_IGNORED_BUILDS`（esbuild、nodejieba），与 [templates-pnpm-ignored-builds](templates-pnpm-ignored-builds.md) 同类。

## 复现命令

```bash
npx -y create-done-coding@0.18.1 -n acc-template-node-server-workspace
# 交互中选择模板「template-node-server(2个细分分支)」、分支「template/workspace」，其余问题回车取默认值
cd acc-template-node-server-workspace
pnpm install
```

## 期望

全新项目在没有全局 prettier 的机器上执行 `pnpm install` 即可成功。

## 实际

运行 `pnpm install`：退出码 1。输出摘要：

```text
. postinstall: sh: prettier: command not found
. postinstall: Failed
Error: ERR_PNPM_EXECUTOR_LIFECYCLE_SCRIPT_FAILED
  ╰─▶ <项目目录> postinstall: `prettier --write ./pnpm-lock.yaml` exited with
      exit status: 127
```

## 环境

- Darwin 22.6.0 x64，Node v24.22.2，pnpm 12.15.0，npm 11.19.1
- 被测版本：create-done-coding@0.18.1、done-coding@0.23.4、@done-coding/forge@0.100.1
- 验收日期：2026-11-06，临时目录与隔离的 HOME，无全局安装
