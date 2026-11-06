# create-done-coding：README 中的位置参数用法 `create-done-coding <项目名>` 被拒绝

> 黑盒验收草稿，协调者已于 2026-11-06 复核归因并定稿；只写现象，不猜实现原因。

## 现象

README「API 文档」写的 `create-done-coding <项目名>`，实际报「无法识别的选项：acc-readme」并退出；只有 `-n <项目名>` 可用。

## 复现命令

```bash
npx -y create-done-coding@0.18.1 acc-readme < /dev/null
```

## 期望

README 与 CLI 一致：项目名作为位置参数被接受，或 README 改为 `-n <项目名>`。

## 实际

运行 `create-done-coding acc-readme`：报未知选项，README 的用法不可用。输出摘要：

```text
无法识别的选项：acc-readme
```

## 环境

- Darwin 22.6.0 x64，Node v24.22.2，pnpm 12.15.0，npm 11.19.1
- 被测版本：create-done-coding@0.18.1、done-coding@0.23.4、@done-coding/forge@0.100.1
- 验收日期：2026-11-06，临时目录与隔离的 HOME，无全局安装
