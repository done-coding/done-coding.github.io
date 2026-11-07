# FlowActionBar（操作栏）

> 操作栏：保存 / 删除选中节点 / 素材面板开关。可在 graph 实例化前渲染（`graph` 可选）。

## API

> ⚠️ 以 types.ts（`FlowActionBarProps`）与源码为真相源。

### Props

| name         | type      | 默认 | 语义                              |
| ------------ | --------- | ---- | --------------------------------- |
| `graph`      | `Graph?`  | —    | 画布实例（可晚于组件渲染就绪）    |
| `canDelNode` | `boolean` | —    | 是否可删除节点（选中节点时 true） |

### v-model

| 字段                | 语义           |
| ------------------- | -------------- |
| `openMaterialPanel` | 素材面板展开态 |

### Emits

| 事件           | 语义                                                       |
| -------------- | ---------------------------------------------------------- |
| `saveClick`    | 保存按钮点击（FlowBox 内接 `editorInstance.saveJsonData`） |
| `delNodeClick` | 删除按钮点击（FlowBox 内删选中节点）                       |

## 注意

- 本组件只发事件 + 展示态，**不持删除/保存逻辑**（FlowBox 内部接线）；独立使用需应用层自接

## 关联

- 装配方：`FlowBox`（`#actionBar` 插槽可覆盖）
