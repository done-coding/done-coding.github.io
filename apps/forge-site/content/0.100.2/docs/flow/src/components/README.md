# components 组件族清单

| 族                      | 组件                                                                                                                                                            | 状态                                     | 文档                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------- |
| flow 编排族             | FlowBox（集大成容器）/ FlowEditor（画布）/ FlowActionBar（操作栏）/ FlowEditorMiniMap（小地图）/ FlowMaterialPanel（素材面板）/ FlowNodeDetailPanel（节点详情） | 公开                                     | [README](./flow/README.md)             |
| flow-custom-cell 节点族 | FlowStep / FlowStartEnd / FlowDecision / FlowSkinFx + useFlowCellData                                                                                           | 内部件（供 registerFlowCustomNode 注册） | [README](./flow-custom-cell/README.md) |
| flow-run 运行态族       | FlowRunSteps（执行步骤树）/ FlowRunIo（节点进料 / 输出展示）                                                                                                    | 公开                                     | [README](./flow-run/README.md)         |

写作约定：

- 公开件写全（定位 / 快速上手 / 能力边界 / API）；内部件仅 API 段
- 内部件标识：`flow-custom-cell` 族组件不直接由消费方 import 渲染，经 `registerFlowCustomNode` 注册后由 x6 实例化
- API 真相源 = `types.ts` + 组件源码；文档与源码冲突时以源码为准
