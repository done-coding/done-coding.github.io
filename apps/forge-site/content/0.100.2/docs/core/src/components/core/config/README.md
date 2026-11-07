# core/config 组件目录

> 文档定位：索引 · L1 实现已归 forge-core；按文档组收纳，旧 admin-core 保留兼容转出。

| 组件     | 文档组 | 源码 / 既有 API 文档                                                          |
| -------- | ------ | ----------------------------------------------------------------------------- |
| AppTheme | 配置   | 源码 · [API](./app-theme/docs/README-AppTheme.md) |

组件专属 hook/测试/类型与组件收纳；组内单文件组件直接留在组目录。职责桶子路径由 package.json exports 显式列出。完整迁移映射见仓根 `scripts/core-component-path-map.json`。

## 无障碍语义（td1v4s 收窄版 B）

AppTheme 仅补风格选择器和模式组名称；图标单项保持原 DOM/样式，名称缺口按收窄版 B 限定放行。
