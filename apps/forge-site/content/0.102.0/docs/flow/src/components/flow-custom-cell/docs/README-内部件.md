# flow-custom-cell 内部件 API 段

> 内部件 = 不直接 import 渲染，经 `registerFlowCustomNode` 注册后由 x6 实例化。API 以 types.ts 与组件源码为真相源。

## 组件

| 组件           | props                                                        | 语义            |
| -------------- | ------------------------------------------------------------ | --------------- |
| `FlowStartEnd` | 消费节点 data（variant 驱动形态：start 绿点 / end 红点）     | 起止 / 事件节点 |
| `FlowStep`     | 消费节点 data（leftColor 状态条 + 图标 + title/description） | 步骤 / 处理节点 |
| `FlowDecision` | 消费节点 data（菱形标记 + 条件描述）                         | 判断 / 分支节点 |

三者均无外部 props 契约——**数据全部走 x6 节点 `data` 字段**（x6-vue-shape 惯例）。

## 数据契约

```ts
// FlowCellSkinData（所有节点共有）
interface FlowCellSkinData {
  skin?: FlowNodeSkinEnum; // 视觉皮肤（默认 plain）
}

interface FlowStepCellData extends FlowCellSkinData {
  leftColor?: string; // 左侧强调色（状态条 + 图标）
  title?: string;
  description?: string;
}
interface FlowStartEndCellData extends FlowCellSkinData {
  leftColor?: string;
  title?: string;
  variant?: FlowStartEndVariantEnum; // "start" | "end"
}
interface FlowDecisionCellData extends FlowCellSkinData {
  leftColor?: string;
  title?: string;
  description?: string; // 条件描述
}
```

## 皮肤（FlowNodeSkinEnum）

| 皮肤     | 视觉                                              | 明暗跟随             |
| -------- | ------------------------------------------------- | -------------------- |
| `PLAIN`  | 干净业务卡（默认）                                | 宿主主题             |
| `NEON`   | 霓虹辉光：accent 发光描边 + 弥散外发光 + 边框跑光 | 宿主主题             |
| `GLASS`  | 玻璃拟态：半透磨砂 + 高光细边 + 多层柔影          | 宿主主题             |
| `AURORA` | 流光渐变边：accent 渐变描边沿边流动               | 宿主主题             |
| `CYBER`  | 暗色赛博 HUD：暗底 + 霓虹线 + 切角角标 + 扫描线   | 强制暗底（局部脱离） |

## 组合函数

`useFlowCellData`：x6 节点 data ↔ 响应式视图桥（节点组件内部消费；外部编辑节点 data 直接改 x6 model 即可，面板数据经 node 传入）。

## 常量 / 枚举（types.ts）

- `FlowCellShapeEnum`：内置 shape 标识（STEP = "flow-step" / START_END = "flow-start-end" / DECISION = "flow-decision"）
- `FlowStartEndVariantEnum`：START / END
- `FLOW_CELL_DEFAULT_ACCENT`：默认 accent 色（dc-core 三级回退）
