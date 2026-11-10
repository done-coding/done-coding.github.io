# Flow：流程编排与运行轨迹

`@done-coding/forge-kit-flow` 提供基于 X6 的 Vue 3 流程画布，以及独立于画布的只读运行轨迹组件。节点类型、业务数据、连线规则和执行逻辑由应用决定。

## 安装

```bash
pnpm add @done-coding/forge-kit-flow
```

```ts
import "@done-coding/forge-kit-flow/style.css";
```

消费项目需安装 Vue、Element Plus、Element Plus Icons 与 Lodash 等 peer dependencies；X6 相关运行时依赖随包安装。

## 选择入口

| 场景                         | 入口与文档                                              |
| ---------------------------- | ------------------------------------------------------- |
| 编排、拖入节点、连线与保存   | [FlowBox 与画布族](./src/components/flow/README.md)     |
| 注册节点组件、选择端口预设   | [节点原语](./src/components/flow-custom-cell/README.md) |
| 展示执行步骤、输入输出与反馈 | [只读运行态](./src/components/flow-run/README.md)       |
| 接入插件、响应式配置与存储   | [Bridge](./src/bridge/docs/README.md)                   |

画布由应用注册节点，再处理新增节点与图就绪事件。运行轨迹则直接消费应用给出的步骤状态和输入输出：组件不会推断哪一步正在执行，也不会把缺失数据伪装成零耗时或空结果。
