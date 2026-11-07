# core/basic 组件目录

> 文档定位：索引 · L1 实现已归 forge-core；按文档组收纳，旧 admin-core 保留兼容转出。

| 组件                | 文档组 | 源码 / 既有 API 文档                                                                                                          |
| ------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| AppCollapseToggle   | 基础   | 源码                                                                                               |
| ActionBtn           | 基础   | 源码 · [API](./action-btn/docs/README-ActionBtn.md)                                             |
| ActionBtnGroup      | 基础   | 源码 · [API](./action-btn-group/docs/README-ActionBtnGroup.md)                       |
| DragFloat           | 基础   | 源码 · [API](./drag-float/docs/README-DragFloat.md)                                             |
| HeightProvider      | 基础   | 源码 · [API](./height-provider/docs/README-HeightProvider.md)                         |
| ShadowClone         | 基础   | 源码 · [API](./shadow-clone/docs/README-ShadowClone.md)                                     |
| WatchSize           | 基础   | 源码 · [API](./watch-size/docs/README-WatchSize.md)                                             |
| SlotLayoutFlowAside | 基础   | 源码 · [API](./slot-layout-flow-aside/docs/README-SlotLayoutFlowAside.md) |
| SlotLayoutTemplate  | 基础   | 源码 · [API](./slot-layout-template/docs/README-SlotLayoutTemplate.md)       |

组件专属 hook/测试/类型与组件收纳；组内单文件组件直接留在组目录。职责桶子路径由 package.json exports 显式列出。完整迁移映射见仓根 `scripts/core-component-path-map.json`。

按钮事件由 ActionBtn 负责确认生命周期及配置点击；ActionBtnGroup 传 groupMeta，原生 ElButton 分支自行旁路报告一次。

确认操作移除 ActionBtn 自身时，确认结果仍由已开始的提交回调结算后报告；普通关闭与取消按同一确认轮次去重，详见 ActionBtn 文档。

## 新增组件指引

**新增组件必须补埋点**：按统一要求更新矩阵、事件文档和 reference，运行 `pnpm core:instrumentation`；无事件写明原因。配置按钮点击 / 确认归 ActionBtn，Group 原生分支独立接线；折叠委托布局状态源。
