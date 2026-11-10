# core 组件目录

> 文档定位：索引 · L1 原语按文档组收纳；forge-core 实际持有实现，旧 admin-core 暂时兼容转出。

| 组件                | 文档组 | 源码 / 既有 API 文档                                                                                                                          |
| ------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| AppCollapseToggle   | 基础   | 源码                                                                                                         |
| AppTheme            | 配置   | 源码 · [API](./config/app-theme/docs/README-AppTheme.md)                                                   |
| ActionBtn           | 基础   | 源码 · [API](./basic/action-btn/docs/README-ActionBtn.md)                                                 |
| ActionBtnGroup      | 基础   | 源码 · [API](./basic/action-btn-group/docs/README-ActionBtnGroup.md)                           |
| ActionConfirm       | 反馈   | 源码 · [API](./feedback/action-confirm/docs/README-ActionConfirm.md)                           |
| BadgeMark           | 数据   | 源码 · [API](./data/badge-mark/docs/README-BadgeMark.md)                                                   |
| BooleanTag          | 数据   | 源码 · [API](./data/boolean-tag/docs/README-BooleanTag.md)                                               |
| DragFloat           | 基础   | 源码 · [API](./basic/drag-float/docs/README-DragFloat.md)                                                 |
| HeightProvider      | 基础   | 源码 · [API](./basic/height-provider/docs/README-HeightProvider.md)                             |
| ShadowClone         | 基础   | 源码 · [API](./basic/shadow-clone/docs/README-ShadowClone.md)                                         |
| WatchSize           | 基础   | 源码 · [API](./basic/watch-size/docs/README-WatchSize.md)                                                 |
| AutoRefresh         | 其他   | 源码 · [API](./other/auto-refresh/docs/README-AutoRefresh.md)                                         |
| AutoRefreshGroup    | 其他   | 源码 · [API](./other/auto-refresh-group/docs/README-AutoRefreshGroup.md)                   |
| TriggerAutoImport   | 其他   | 源码                                                                                                         |
| ImagePreviewTrigger | 数据   | 源码 · [API](./data/image-preview-trigger/docs/README-ImagePreviewTrigger.md)         |
| ModalConfirm        | 反馈   | 源码 · [API](./feedback/modal-confirm/docs/README-ModalConfirm.md)                               |
| ModalImagePreview   | 数据   | 源码 · [API](./data/modal-image-preview/docs/README-ModalImagePreview.md)                 |
| ModalVideoPreview   | 反馈   | 源码 · [API](./feedback/modal-video-preview/docs/README-ModalVideoPreview.md)         |
| VideoPreviewTrigger | 反馈   | 源码 · [API](./feedback/video-preview-trigger/docs/README-VideoPreviewTrigger.md) |
| SlotLayoutFlowAside | 基础   | 源码 · [API](./basic/slot-layout-flow-aside/docs/README-SlotLayoutFlowAside.md)     |
| SlotLayoutTemplate  | 基础   | 源码 · [API](./basic/slot-layout-template/docs/README-SlotLayoutTemplate.md)           |

组件专属 hook/测试/类型与组件收纳；组内单文件组件直接留在组目录。职责桶子路径由 package.json exports 显式列出，应用优先使用根入口。完整迁移映射见仓根 `scripts/core-component-path-map.json`。

## forge 拆包 A 迁移说明

底座与 core 原语已整体迁入 `packages/forge-core`（单份实现），应用 `@done-coding/forge` 聚合六实现包并保留原公共导出。内部底座消费走 `@done-coding/forge-core` 的职责桶子路径；21 项注入键继续使用历史 namespace。组件行为/API 不变，panel 与 deprecated 保留。

## 按钮行为采集

ActionBtn（裸按钮与组内按钮）统一单发点击与确认事件，可用 `trackKey` 标识业务动作。ActionBtnGroup 只传组定位；`props` 的 ElButton 分支退出采集。API 见对应组件文档。
