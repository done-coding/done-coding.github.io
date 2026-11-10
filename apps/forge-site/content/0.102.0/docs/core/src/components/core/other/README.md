# core/other 组件目录

> 文档定位：索引 · L1 实现已归 forge-core；按文档组收纳，旧 admin-core 保留兼容转出。

| 组件              | 文档组 | 源码 / 既有 API 文档                                                                                            |
| ----------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| AutoRefresh       | 其他   | 源码 · [API](./auto-refresh/docs/README-AutoRefresh.md)                       |
| AutoRefreshGroup  | 其他   | 源码 · [API](./auto-refresh-group/docs/README-AutoRefreshGroup.md) |
| TriggerAutoImport | 其他   | 源码                                                                                 |

组件专属 hook/测试/类型与组件收纳；组内单文件组件直接留在组目录。职责桶子路径由 package.json exports 显式列出。完整迁移映射见仓根 `scripts/core-component-path-map.json`。

AutoRefresh 报告自动刷新开关；AutoRefreshGroup 仅报告手动 refresh，不把定时回调当作手动刷新。

## 新增组件指引

**新增组件必须补埋点**：按统一要求更新矩阵、事件文档和 reference，运行 `pnpm core:instrumentation`；无事件写明原因。手动 refresh 归 AutoRefreshGroup，开关归 AutoRefresh，定时刷新不冒充手动意图。

## 无障碍语义（td1v4s）

AutoRefresh 的开关/间隔输入、AutoRefreshGroup 手动刷新提供明确可访问名称，既有 attrs 转发规则不变。
