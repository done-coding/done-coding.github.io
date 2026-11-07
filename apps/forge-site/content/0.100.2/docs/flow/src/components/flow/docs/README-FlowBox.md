# FlowBox（集大成容器）

> 流程编辑器的**唯一推荐入口**：内部装配画布 + 素材面板 + 操作栏 + 小地图 + 节点详情面板，处理布局矫正 / 面板联动 / 空态引导 / 高亮语义。业务语义（新增什么节点、数据如何编辑）由应用层决定。
> 范式页：`demo-src/pages/Home.vue`

## 定位

- **集大成装配层**：`FlowProps` 一个对象把五个子件全配齐（布局 / 显隐 / props 透传）
- **业务在应用层**：库只提供画布能力；节点注册（`registerFlowCustomNode`）、新增类型决策（`@add-node-request`）、数据编辑（节点详情面板插槽）都是应用层职责
- **何时不用**：需要裸画布 / 自装配子件时用 `FlowEditor` 等子件独立拼装

## 快速上手（最小可用）

```ts
import {
  FlowBox,
  FlowStep,
  FlowStartEnd,
  FlowDecision,
  registerFlowCustomNode,
  FLOW_PORT_PRESET,
  type FlowInstance,
} from "@done-coding/forge-kit-flow";

// ① 注册节点（形状 / 尺寸 / 端口角色由应用层定）
registerFlowCustomNode({
  shape: "flow-start",
  component: FlowStartEnd,
  width: 180,
  height: 44,
  ports: FLOW_PORT_PRESET.entry(),
});
registerFlowCustomNode({
  shape: "flow-end",
  component: FlowStartEnd,
  width: 180,
  height: 44,
  ports: FLOW_PORT_PRESET.exit(),
});
registerFlowCustomNode({
  shape: "flow-step",
  component: FlowStep,
  width: 280,
  height: 64,
  ports: FLOW_PORT_PRESET.process(),
});
registerFlowCustomNode({
  shape: "flow-decision",
  component: FlowDecision,
  width: 280,
  height: 72,
  ports: FLOW_PORT_PRESET.branch(2),
});
```

```html
<FlowBox
  ref="flowInstance"
  style="height: 100vh"
  :materialPanelProps="{ title: '节点素材', groupList }"
  @add-node-request="handleAddNodeRequest"
  @graph-created="handleGraphCreated"
/>
```

**要点**：

- **必须先注册再使用**：`registerFlowCustomNode`（x6-vue-shape `register` 的封装，自动标记 CUSTOM_NODE）——不注册则素材拖入 / 加载数据时节点无渲染
- 端口语义预设 `FLOW_PORT_PRESET`：`entry()` 仅下出桩 / `exit()` 仅上入桩 / `process()` 上入下出 / `branch(n)` 条件扇出 / `gateway(style?)` 四向——免手拼 `groupConfig`；特殊布局用 `getFlowNodeCirclePorts`
- `@add-node-request`（点节点出端「+」）→ 应用层决定新增 type、`graph.addNode` 并接线；`@graph-created` → 画布就绪，可绑事件 / 自定义图操作（自环等）
- 空态引导：无节点时居中提示（`#emptyGuide` 插槽可替换）；`pointer-events:none` 不挡画布交互

## 能力边界 / 按需使用

- **面板布局**：`actionBarLayout` / `materialPanelLayout` / `nodeDetailPanelLayout` / `miniMapLayout` 配宽高；`moduleColor` 配外壳底色（默认跟 dc-core 主题三级回退）
- **画布插件**：`graphPluginUse` 逐项开关（transform / snapline / clipboard / keyboard / history / selection / scroller / export）；history 默认开，高亮等瞬态改动经 `FLOW_HIGH_LIGHT_MUTATION_OPTION` 过滤不进撤销栈
- **节点高亮**：`cellHighLightConfig` 配高亮色（fill / stroke / strokeWidth）
- **受控操作**：`FlowInstance.mountData(data)` 挂载 JSON / `getGraph()` 拿 x6 Graph（未就绪 undefined）——消费方自定义图操作经它
- **插槽**：`#actionBar` / `#materialPanel` / `#nodeDetailPanel` 覆盖默认面板（scoped 透传 props + node/graph）；`#emptyGuide` 空态引导

## API

> ⚠️ API 以 types.ts（`FlowProps` / `FlowInstance`）与组件源码为真相源；与文档冲突时以源码为准。

### Props（FlowProps）

| name                    | type                                                                          | 默认                    | 语义                                    |
| ----------------------- | ----------------------------------------------------------------------------- | ----------------------- | --------------------------------------- |
| `height` / `width`      | `string?`                                                                     | —                       | 容器尺寸                                |
| `backgroundColor`       | `string?`                                                                     | —                       | 容器背景色                              |
| `moduleColor`           | `{ actionBar; nodeDetailPanel; materialPanel; miniMap }: FlowItemModuleColor` | dc-core 主题回退        | 各外壳模块底色 + 阴影                   |
| `editorProps`           | `FlowEditorProps?`                                                            | —                       | 透传 FlowEditor（网格/缩放/连线等）     |
| `showActionBar`         | `boolean?`                                                                    | `true`                  | 展示操作栏                              |
| `actionBarLayout`       | `{ height: string }?`                                                         | `"60px"`                | 操作栏布局                              |
| `nodeDetailPanelLayout` | `{ width: string }?`                                                          | `"350px"`               | 节点详情面板布局                        |
| `nodeDetailPanelProps`  | `Omit<FlowNodeDetailPanelProps, "node">?`                                     | —                       | 节点详情面板 props（node 由选中态注入） |
| `showMaterialPanel`     | `boolean?`                                                                    | `true`                  | 展示素材面板                            |
| `materialPanelLayout`   | `{ width: string }?`                                                          | `"350px"`               | 素材面板布局                            |
| `materialPanelProps`    | `Omit<FlowMaterialPanelProps, "graph">?`                                      | —                       | 素材面板 props（graph 由 FlowBox 注入） |
| `showMiniMap`           | `boolean?`                                                                    | `true`                  | 展示小地图                              |
| `miniMapLayout`         | `{ width; height: string }?`                                                  | `320×220`               | 小地图布局                              |
| `miniMapProps`          | `Omit<FlowEditorMiniMapProps, "graph">?`                                      | —                       | 小地图 props（graph 注入）              |
| `cellHighLightConfig`   | `FlowCellHighLightOriginAttrs?`                                               | `#efdbff / #9254de / 1` | 节点高亮色                              |
| `graphPluginUse`        | `FlowEditorGraphPluginUse?`                                                   | 见源码                  | 画布插件开关                            |

### Emits

| 事件             | 参数               | 语义                                                      |
| ---------------- | ------------------ | --------------------------------------------------------- |
| `addNodeRequest` | `sourceNode: Node` | 点节点出端「+」请求新增下游（应用层决定新增 type 并接线） |
| `graphCreated`   | `graph: Graph`     | 画布就绪（晚于 onMounted，避免 race）                     |

### Slots

| 槽                 | scope                               | 语义                                         |
| ------------------ | ----------------------------------- | -------------------------------------------- |
| `#emptyGuide`      | —                                   | 空画布引导（默认「从左侧素材面板拖入节点」） |
| `#actionBar`       | `{ graph, openMaterialPanel, ... }` | 覆盖操作栏                                   |
| `#materialPanel`   | `{ graph, ...props }`               | 覆盖素材面板                                 |
| `#nodeDetailPanel` | `{ node, ...props }`                | 覆盖节点详情面板                             |

### Expose

`FlowInstance`：`mountData(data: FromJSONData)` / `getGraph(): Graph | undefined`

## 反模式 / 注意

- **不注册节点直接用**：素材拖入无渲染、数据加载后画布空——先 `registerFlowCustomNode`
- **节点渲染尺寸 [MUST] 用 x6 模型几何**（`getNode().size()` + `change:size`），[MUST NOT] RO 观测宿主祖先（正反馈自激）
- **业务数据进出**：经节点 `data` 字段 + `saveJsonData` / `mountData` 序列化；库不焊后端

## 关联

- 节点注册 / 端口预设：`registerFlowCustomNode` / `FLOW_PORT_PRESET`（flow/utils.ts）
- 内置节点组件：components/flow-custom-cell 族
- 子件独立使用：FlowEditor / FlowActionBar / FlowEditorMiniMap / FlowMaterialPanel / FlowNodeDetailPanel
