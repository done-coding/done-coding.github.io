# TableToolbar

> 文档定位：说明 · 可公开复用的表格工具栏；通常由 TableMain / DataGridView 装配。

## 定位

业务优先经 ListLayout / TableMain 的 toolbar 配置消费；只有自持数据容器、需要复用同一套导出与刷新工具栏时才直接使用 TableToolbar。组件不会替宿主维护分页或选中状态。

## 快速上手

TableMain 提供 tableExpose、exportContext、loading 与分页上下文；最小导出配置如下：

```vue
<TableMain
  :api="api"
  :columns="columns"
  row-key="id"
  :toolbar="{ exportColumns: [{ prop: 'name', label: '名称' }] }"
/>
```

## 能力边界 / 按需使用

默认不显示导出（须给 exportColumns）；给列后默认前端 CSV 导出。需要服务端导出才配置 exportByFe=false 与 exportFn。视图切换默认关闭，单独显示时仍需宿主维持 customView；刷新与自动刷新默认开启，额外按钮默认为空。事件报告默认无采集需求即静默，导出意图不代表文件生成成功。

完整演示：`apps/reference/src/pages/other/integration/event-bus/DataEventScenes.vue`。

## API

真相源：`shared/types.ts` 的 TableToolbarProps、TableToolbarPrivateProps 与组件源码。

| 参数                                        | 说明                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| tableExpose / loading / exportContext       | 必填：宿主 TableMainInstance、加载状态、TableExportContext（列/选中/当前页/API/query/总数） |
| currentPage / pageSize                      | 必填：当前页与容量，仅作为按钮上下文                                                        |
| exportColumns                               | 导出列；缺省不显示导出                                                                      |
| exportByFe / exportFn                       | 默认 true；false 时提供 `(type: ExportType) => Promise<unknown>`                            |
| showSwitchView                              | 默认 false，显示视图开关                                                                    |
| showRefresh / showAutoRefresh               | 默认 true                                                                                   |
| leftExtraButtons / rightExtraButtons        | 配置按钮数组，默认空                                                                        |
| model:customView                            | 默认 false                                                                                  |
| model:isAutoRefresh / model:refreshInterval | 自动刷新状态 / 间隔，间隔默认 5 秒                                                          |

无专属 slot 或 expose；model 经 update 事件回传。

通过既有 useBridgeReport 发 `table-export {type}`（selected / current / all）：防并发闸通过后、业务导出前报告意图，不表示导出成功。用户切换开关时发 `table-view-toggle {custom}`，外部 model 初始化/修改不伪报。无订阅且镜像关闭时载荷不求值；业务导出回调与 model 更新保留。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-data`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。

## 无障碍语义（td1v4s）

视图切换开关名称为“切换自定义视图”，不新增 prop 或改变视图事件。
