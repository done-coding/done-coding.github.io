# create-done-coding：README 中的 `-c` 选项不存在

> 黑盒验收草稿，协调者已于 2026-11-06 复核归因并定稿；只写现象，不猜实现原因。

## 现象

README「API 文档」写 `-c` 是 `--justCloneFromDoneCoding` 的简写；实际运行报「无法识别这些选项：c, acc-readme」，`create-done-coding --help` 中也没有 `-c`。

## 复现命令

```bash
npx -y create-done-coding@0.18.1 acc-readme -c < /dev/null
npx -y create-done-coding@0.18.1 --help
```

## 期望

README 与 CLI 一致：`-c` 可用并出现在 `--help` 中，或从 README 删去。

## 实际

运行 `create-done-coding acc-readme -c`：报未知选项，README 的用法不可用。输出摘要：

```text
无法识别这些选项：c, acc-readme
```

## 环境

- Darwin 22.6.0 x64，Node v24.22.2，pnpm 12.15.0，npm 11.19.1
- 被测版本：create-done-coding@0.18.1、done-coding@0.23.4、@done-coding/forge@0.100.1
- 验收日期：2026-11-06，临时目录与隔离的 HOME，无全局安装
