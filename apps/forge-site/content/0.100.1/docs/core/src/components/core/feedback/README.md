# core/feedback 组件目录

> 文档定位：索引 · L1 实现已归 forge-core；按文档组收纳，旧 admin-core 保留兼容转出。

| 组件                | 文档组 | 源码 / 既有 API 文档                                                                                                        |
| ------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| ActionConfirm       | 反馈   | 源码 · [API](./action-confirm/docs/README-ActionConfirm.md)                           |
| ModalConfirm        | 反馈   | 源码 · [API](./modal-confirm/docs/README-ModalConfirm.md)                               |
| ModalVideoPreview   | 反馈   | 源码 · [API](./modal-video-preview/docs/README-ModalVideoPreview.md)         |
| VideoPreviewTrigger | 反馈   | 源码 · [API](./video-preview-trigger/docs/README-VideoPreviewTrigger.md) |

组件专属 hook/测试/类型与组件收纳；组内单文件组件直接留在组目录。职责桶子路径由 package.json exports 显式列出。完整迁移映射见仓根 `scripts/core-component-path-map.json`。

## 无障碍语义（td1v4s 收窄版 B）

VideoPreviewTrigger 仅为原有首帧/占位按钮补名称和封面 alt 缺省值；键盘、preview 开关及 DOM 保持 HEAD 行为。
