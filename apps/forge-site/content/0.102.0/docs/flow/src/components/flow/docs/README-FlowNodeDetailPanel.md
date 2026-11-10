# FlowNodeDetailPanel（节点详情面板）

> 节点详情 / 数据编辑面板：选中节点时展示（FlowBox 内 `onlyNode` 驱动开合），编辑经 x6 node 数据模型回写。

## API

> ⚠️ 以 types.ts（`FlowNodeDetailPanelProps`）与源码为真相源。

### Props

| name   | type   | 语义                                       |
| ------ | ------ | ------------------------------------------ |
| `node` | `Node` | 当前编辑节点（必传；FlowBox 从选中态注入） |

## 注意

- 编辑的是 x6 节点 `data` 字段（业务数据契约见 flow-custom-cell 族：`FlowStepCellData` 等）
- FlowBox 内 `#nodeDetailPanel` 插槽可完全接管渲染（如自定义表单编辑器）

## 关联

- 装配方：`FlowBox`（`nodeDetailPanelLayout` / `nodeDetailPanelProps`，`#nodeDetailPanel` 插槽）
