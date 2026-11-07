# FlowEditorMiniMap（小地图）

> 画布小地图（x6 MiniMap 封装），graph 就绪后传入。布局由 FlowBox 的 `miniMapLayout` 控制。

## API

> ⚠️ 以 types.ts（`FlowEditorMiniMapProps`）与源码为真相源。

### Props

| name    | type    | 语义                                             |
| ------- | ------- | ------------------------------------------------ |
| `graph` | `Graph` | 画布实例（必传；FlowBox 经 `miniMapProps` 注入） |

## 关联

- 装配方：`FlowBox`（`showMiniMap` / `miniMapLayout` / `miniMapProps`）
