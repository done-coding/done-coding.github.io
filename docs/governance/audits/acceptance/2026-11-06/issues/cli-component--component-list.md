# done-coding component：新项目中 component list 因缺少 .done-coding/component/ 报错

> 黑盒验收草稿，协调者已于 2026-11-06 复核归因并定稿；只写现象，不猜实现原因。

## 现象

在没有 `.done-coding/component/` 的新项目中运行 `done-coding component list`，以退出码 1 结束并打印 yargs 调用栈。`component --help` 中没有初始化这一目录的子命令说明。

## 复现命令

```bash
mkdir -p cli-smoke/src && cd cli-smoke && npm init -y && echo '# cli-smoke' > README.md
npx -y done-coding@0.23.4 component --help
npx -y done-coding@0.23.4 component list
```

## 期望

新项目中 `component list` 正常结束（例如列出空结果），或给出一句如何初始化的提示，而不是带调用栈的错误。

## 实际

运行 `done-coding component list`：退出码 1。输出摘要：

```text
Error: 未找到批次类型「component」：已逐级向上查找 .done-coding/component/ 至全局 ~/.done-coding/component/，均未命中（R2）
    at CommandInstance.handleValidationAndGetResult (file://<tools>/node_modules/yargs/build/lib/command.js:205:25)
    at CommandInstance.applyMiddlewareAndGetResult (file://<tools>/node_modules/yargs/build/lib/command.js:245:20)
    at CommandInstance.runCommand (file://<tools>/node_modules/yargs/build/lib/command.js:128:20)
    at [runYargsParserAndExecuteCommands] (file://<tools>/node_modules/yargs/build/lib/yargs-factory.js:1386:105)
```

## 环境

- Darwin 22.6.0 x64，Node v24.22.2，pnpm 12.15.0，npm 11.19.1
- 被测版本：create-done-coding@0.18.1、done-coding@0.23.4、@done-coding/forge@0.100.1
- 验收日期：2026-11-06，临时目录与隔离的 HOME，无全局安装
