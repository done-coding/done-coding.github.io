# hooks 引导（FlowEditor 内部机制）

`components/flow/hooks/` 是 FlowEditor 内部机制 hooks——**FlowBox/FlowEditor 内部消费，消费方不直接使用**（不单独出文档，仅清单）。

| hook / 模块             | 职责                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `keyboard.ts`           | 快捷键（删除 / 撤销重做等）                                                                                         |
| `events.ts`             | 画布事件统一绑定/解绑                                                                                               |
| `plugins.ts`            | x6 插件装配（transform / snapline / clipboard / history / selection / scroller / export，按 `graphPluginUse` 开关） |
| `high-light.ts`         | 选中高亮（含 `FLOW_HIGH_LIGHT_MUTATION_OPTION` 瞬态标记）                                                           |
| `add-node-connector.ts` | 出端「+」连接器（点 + 请求新增下游 → `@add-node-request`）                                                          |
| `custom-data.ts`        | 节点自定义数据读写                                                                                                  |
| `custom-cell-style.ts`  | 自定义节点样式                                                                                                      |
| `dev-tools.ts`          | 开发调试工具                                                                                                        |

> 变更注意：这些 hooks 无对外契约，可随 FlowEditor 内部重构自由调整。
