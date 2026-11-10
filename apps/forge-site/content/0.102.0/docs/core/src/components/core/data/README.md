# core/data 组件目录

> 文档定位：索引 · L1 实现已归 forge-core；按文档组收纳，旧 admin-core 保留兼容转出。

| 组件                | 文档组 | 源码 / 既有 API 文档                                                                                                        |
| ------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| BadgeMark           | 数据   | 源码 · [API](./badge-mark/docs/README-BadgeMark.md)                                           |
| BooleanTag          | 数据   | 源码 · [API](./boolean-tag/docs/README-BooleanTag.md)                                       |
| ImagePreviewTrigger | 数据   | 源码 · [API](./image-preview-trigger/docs/README-ImagePreviewTrigger.md) |
| ModalImagePreview   | 数据   | 源码 · [API](./modal-image-preview/docs/README-ModalImagePreview.md)         |

组件专属 hook/测试/类型与组件收纳；组内单文件组件直接留在组目录。职责桶子路径由 package.json exports 显式列出。完整迁移映射见仓根 `scripts/core-component-path-map.json`。

BadgeMark 内部模板引用仅持有必要实例，避免把子组件的 GlobalComponents 推导展开到发布声明。
