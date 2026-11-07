# feedback 组件目录

> 文档定位：索引 · 本批整体迁至 packages/forge-feedback/src/components；实际实现只保留一份，旧 admin-core 根保留原契约。

| 组件        | 文档组 | 源码 / 既有 API 文档                                                                      |
| ----------- | ------ | ----------------------------------------------------------------------------------------- |
| ModalPorter | 反馈   | 源码 · [API](./modal-porter/docs/README-ModalPorter.md) |
| ModalShelf  | 反馈   | 源码 · [API](./modal-shelf/docs/README-ModalShelf.md)     |

组件专属 hook/测试/类型与组件收纳；组内单文件组件直接留在组目录。职责桶作为包间实现契约由新包 exports 声明，应用根只转出白名单。完整迁移映射见仓根 `scripts/core-component-path-map.json`。

## 本批事件

ModalShelf 按真实状态发 modal-open/update/close，ModalPorter 委托，覆盖全局 remote。

## 新增组件指引

**新增组件必须补埋点**：按统一要求（根 docs/component-development.md 规则27）更新矩阵、事件文档和 reference，运行 `pnpm core:instrumentation`；无事件写明原因。ModalShelf 控制器按真实状态报告；Porter 委托，独立弹层不得冒充 Shelf。

## B 包迁移

`@done-coding/forge-feedback` 提供本族根入口与职责桶子路径，组件行为/API不变。应用聚合 `@done-coding/forge` 保留原名字、别名及类型；本族只依赖 forge-core 的公共桶，21共享键由底座单一定义。组件、专属 hook、类型、样式、测试与API文档一起迁移；panel已迁forge-compose且仍保留。CSS通过本包style.css显式消费。
