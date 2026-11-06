# Tour：新手引导与功能导览

`@done-coding/forge-plugin-tour` 将 Driver.js 引导能力接入 core bridge，复用徽标的锚点与描述，也支持显式编排步骤。适合新手上路与新功能导览。

```bash
pnpm add @done-coding/forge-plugin-tour
```

通过 `createTourPlugin` 创建插件，再经 `coreBridge.use(tour)` 安装。配置、跨路由步骤、进度存储与能力边界见 [Tour 使用文档](./src/README.md)。
