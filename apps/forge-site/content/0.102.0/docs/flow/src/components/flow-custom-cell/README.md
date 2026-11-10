# flow-custom-cell 节点族（内部件）

内置业务节点组件族：**供 `registerFlowCustomNode` 注册后由 x6 实例化**，消费方不直接 import 渲染。应用层注册时决定 shape 名 / 尺寸 / 端口（`FLOW_PORT_PRESET`），组件渲染由 x6-vue-shape 按 shape 匹配。

| 组件              | 语义                                                              | 数据契约                                              |
| ----------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| `FlowStartEnd`    | 起止 / 事件节点（开始 / 结束）                                    | `FlowStartEndCellData`（variant: start/end）          |
| `FlowStep`        | 步骤 / 处理节点                                                   | `FlowStepCellData`（leftColor / title / description） |
| `FlowDecision`    | 判断 / 分支节点                                                   | `FlowDecisionCellData`（条件描述）                    |
| `FlowSkinFx`      | 皮肤光效层（neon/glass/aurora/cyber 内部 SVG 动画，被前三者包裹） | 同宿主节点 data                                       |
| `useFlowCellData` | 节点 data 读取组合函数（x6 节点 data ↔ 响应式视图）              | —                                                     |

## 注册范式（应用层）

```ts
import {
  FlowStep,
  FlowStartEnd,
  FlowDecision,
  registerFlowCustomNode,
  FLOW_PORT_PRESET,
} from "@done-coding/forge-kit-flow";

registerFlowCustomNode({
  shape: "flow-step",
  component: FlowStep,
  width: 280,
  height: 64,
  ports: FLOW_PORT_PRESET.process(),
});
// 起止 = entry / exit 语义单向桩；判断 = branch(n) 条件扇出
```

## 数据契约与皮肤

- 节点业务数据经 x6 节点 `data` 字段：`FlowStepCellData` / `FlowStartEndCellData` / `FlowDecisionCellData`（详情见 [docs/README-内部件](./docs/README-内部件.md)）
- `skin` 字段切皮肤：`FlowNodeSkinEnum`（plain 默认 / neon 霓虹辉光 / glass 玻璃拟态 / aurora 流光渐变 / cyber 暗色赛博 HUD）
- accent 色默认走 dc-core 主题三级回退（`--dc-core-* → --el-* → 死值`，见 `FLOW_CELL_DEFAULT_ACCENT`）；显式传 `leftColor` 优先

## 内部件标识

本族组件不单独从 barrel 增强导出面（`index.ts` 仅导出 3 节点组件 + `useFlowCellData` + types）——`FlowSkinFx` 为纯内部（被节点组件包裹），无对外 API。
