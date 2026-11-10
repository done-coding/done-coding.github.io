# pro/compose 组件目录

> 文档定位：索引 · 源码实际归属forge-compose，文档仍按八组登记；应用由forge聚合转出。

panel 保留但已废弃，计划在 1.0-alpha 删除；本轮不删除、不改变公开 API。layout 收外壳/页面布局，compose 收跨组组合。

| 组件        | 文档组 | 源码 / 既有 API 文档                                                                      |
| ----------- | ------ | ----------------------------------------------------------------------------------------- |
| ListLayout  | 布局   | 源码 · [API](./list-layout/docs/README-ListLayout.md)     |
| ModalDetail | 反馈   | 源码 · [API](./modal-detail/docs/README-ModalDetail.md) |
| ModalForm   | 反馈   | 源码 · [API](./modal-form/docs/README-ModalForm.md)         |

组件专属 hook/测试/类型与组件收纳；组内单文件组件直接留在组目录。职责桶按package.json exports提供包间组合，不等于扩增应用公开白名单。完整迁移映射见仓根 `scripts/core-component-path-map.json`。

## 新增组件指引

**新增组件必须补埋点**：按统一要求更新矩阵、事件文档和 reference，运行 `pnpm core:instrumentation`；无事件写明原因。ListLayout / ModalForm / ModalDetail 委托内部表单、数据与 Shelf，不冒充 FormSubmitPanel 提交。

## C 源码迁移

本组件及配套类型/hooks/测试/API迁至 `packages/forge-compose/src/components`，去掉 pro 重复层。应用消费 `@done-coding/forge`；组件 API、槽与事件不变，Panel已由pn1031退役（C拆包时曾保留）。

## 请求失败反馈

ListLayout 列表失败委托 TableMain/DataGridView 清空旧结果与总数并显示错误，不重复弹消息；同步抛错、异步拒绝与成功恢复同样处理。
