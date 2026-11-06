# Theme：主题资产

`@done-coding/forge-plugin-theme` 为 core 提供主题预设、应用 shell 与装饰资产。主题机制由 core 管理，资产通过 `themePlugin` 注册到应用 bridge；应用按需求选择布局与主题。

```bash
pnpm add @done-coding/forge-plugin-theme
```

主题能力与使用边界见 [Shell 族文档](./src/shells/README.md)；装饰约束见 [Decor 文档](./src/shells/decor/README.md)。
