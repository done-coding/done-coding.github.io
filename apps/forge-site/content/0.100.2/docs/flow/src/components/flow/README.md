# flow 编排族

流程编辑器主组件族。**推荐入口 = `FlowBox`**（集大成容器）：内部装配 FlowEditor 画布 + FlowMaterialPanel 素材面板 + FlowActionBar 操作栏 + FlowEditorMiniMap 小地图 + FlowNodeDetailPanel 节点详情，处理布局矫正 / 面板联动 / 空态引导。

| 组件                  | 职责                                 | 文档                                                                  |
| --------------------- | ------------------------------------ | --------------------------------------------------------------------- |
| `FlowBox`             | 集大成容器（消费方入口）             | [README-FlowBox.md](./docs/README-FlowBox.md)                         |
| `FlowEditor`          | 画布（x6 Graph 薄封装，透传 props）  | [README-FlowEditor.md](./docs/README-FlowEditor.md)                   |
| `FlowActionBar`       | 操作栏（保存 / 删除 / 素材面板开关） | [README-FlowActionBar.md](./docs/README-FlowActionBar.md)             |
| `FlowEditorMiniMap`   | 小地图                               | [README-FlowEditorMiniMap.md](./docs/README-FlowEditorMiniMap.md)     |
| `FlowMaterialPanel`   | 素材面板（分组可搜、拖入生成节点）   | [README-FlowMaterialPanel.md](./docs/README-FlowMaterialPanel.md)     |
| `FlowNodeDetailPanel` | 节点详情（数据编辑）                 | [README-FlowNodeDetailPanel.md](./docs/README-FlowNodeDetailPanel.md) |

节点注册工具与端口预设（同族导出）：`registerFlowCustomNode` / `getFlowNodeCirclePorts` / `FLOW_PORT_PRESET` / `FlowNodePortConfig` / `FlowPortStyleOverride`。

类型（types.ts 真相源）：`FlowProps`（FlowBox）/ `FlowEditorProps` / `FlowInstance` / `FlowEditorInstance` / `FlowEditorGraphPluginUse` / `FlowActionBarLayout` / `FlowMaterialPanelLayout` / `FlowMiniMapLayout` / `FlowNodeDetailPanelLayout` / `FlowCellHighLightOriginAttrs` / `FlowGraphCellTypeEnum` / `FlowGraphCustomDataKeyEnum` / `CUSTOM_CELL_ID_ATTR` / `FLOW_HIGH_LIGHT_MUTATION_OPTION`。

内部 hooks（`hooks/` 目录，不单独导出）：keyboard / dev-tools / custom-cell-style / custom-data / events / plugins / high-light / add-node-connector——FlowEditor 内部机制，消费方不直接使用，见 [hooks 引导](./hooks/README.md)。

## 画布生命周期契约

FlowEditor 挂载创建 Graph，卸载时先完成 Graph.dispose，再同步发出一次既有 `graphDispose` 事件。父组件可据此清理画布外的资源；事件不依赖卸载时会被停止的异步 watcher。根 `pnpm test:component` 的 flow 用例保留真实画布销毁和可见事件结果断言。
