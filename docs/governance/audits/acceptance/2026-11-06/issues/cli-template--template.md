# done-coding template：按 init 生成的配置直接运行报「env与envData不能同时为空」

> 黑盒验收草稿，协调者已于 2026-11-06 复核归因并定稿；只写现象，不猜实现原因。

## 现象

在新项目中先 `done-coding template init`（交互，各问题回车取默认值，成功结束），紧接着运行 `done-coding template`，以退出码 1 结束，只输出「env与envData不能同时为空」，没有说明该在哪里填写、填什么。

## 复现命令

```bash
mkdir -p cli-smoke/src && cd cli-smoke && npm init -y && echo '# cli-smoke' > README.md
npx -y done-coding@0.23.4 template --help
npx -y done-coding@0.23.4 template init
npx -y done-coding@0.23.4 template
```

## 期望

`init` 生成的默认配置可以直接运行；或在需要用户补充时，报错写明配置文件位置和要填的字段。

## 实际

运行 `done-coding template`：退出码 1。输出摘要：

```text
开始单个处理
env与envData不能同时为空
```

## 环境

- Darwin 22.6.0 x64，Node v24.22.2，pnpm 12.15.0，npm 11.19.1
- 被测版本：create-done-coding@0.18.1、done-coding@0.23.4、@done-coding/forge@0.100.1
- 验收日期：2026-11-06，临时目录与隔离的 HOME，无全局安装
