# data 组件目录

> 文档定位：索引 · 本批整体迁至 packages/forge-data/src/components；实际实现只保留一份，旧 admin-core 根保留原契约。

| 组件             | 文档组 | 源码 / 既有 API 文档                                                                                            |
| ---------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| DataGridView     | 数据   | 源码 · [API](./data-grid-view/docs/README-DataGridView.md)                 |
| DataGridViewCard | 数据   | 源码                                                                                  |
| DataListView     | 数据   | 源码 · [API](./data-list-view/docs/README-DataListView.md)                 |
| DataListViewItem | 数据   | 源码                                                              |
| InfiniteListView | 数据   | 源码 · [API](./infinite-list-view/docs/README-InfiniteListView.md) |
| TableEmpty       | 数据   | 源码                                                                            |
| TableMain        | 数据   | 源码 · [API](./table-main/docs/README-TableMain.md)                               |
| TableSkeleton    | 数据   | 源码                                                                      |
| TableToolbar     | 数据   | 源码                                                                                      |
| ToolbarButtons   | 数据   | 源码                                                                    |

组件专属 hook/测试/类型与组件收纳；组内单文件组件直接留在组目录。职责桶作为包间实现契约由新包 exports 声明，应用根只转出白名单。完整迁移映射见仓根 `scripts/core-component-path-map.json`。

## 数据交互事件（v0.35.0）

TableMain / TableToolbar / DataListView / DataGridView 接入既有 core 事件契约。表与卡片按当前视图归属，程序性清选静默；单行 aggregate → row，全选只 aggregate；scroll 按需绑定、rAF trailing 可取消。详见各组件 API 文档与 [TableToolbar](./docs/README-TableToolbar.md)。私有 report hooks 不进入公开导出。

## 新增组件指引

**新增组件必须补埋点**：按统一要求（根 docs/component-development.md 规则27）更新矩阵、事件文档和 reference，运行 `pnpm core:instrumentation`；无事件写明原因。TableMain 与 DataListView/customView 分开报告；DataGridView 使用独立事件，Toolbar 负责导出与视图切换。

## B 包迁移

`@done-coding/forge-data` 提供本族根入口与职责桶子路径，组件行为/API不变。应用聚合 `@done-coding/forge` 保留原名字、别名及类型；本族只依赖 forge-core 的公共桶，21共享键由底座单一定义。组件、专属 hook、类型、样式、测试与API文档一起迁移；panel已迁forge-compose且仍保留。CSS通过本包style.css显式消费。

## 无障碍语义（td1v4s）

DataListView/InfiniteListView 默认可键盘聚焦滚动；TableToolbar 视图切换有可读名称。未新增公开 prop。

## 无障碍 API（td1v4s）

原生选择框名称取 column.label 与行序号，不新增字段。
