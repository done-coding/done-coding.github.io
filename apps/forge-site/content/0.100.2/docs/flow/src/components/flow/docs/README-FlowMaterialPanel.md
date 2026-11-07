# FlowMaterialPanel（素材面板）

> 素材面板：分组可搜、拖入生成节点（x6 Stencil）。布局由 FlowBox 的 `materialPanelLayout` 控制。

## 定位

- 面板只负责「展示素材组 + 拖入创建节点」；**分组数据（`groupList`）与拖入的节点 type 由应用层提供**
- 节点拖入 = Stencil 按 `groupList` 配置生成对应 shape 的节点（shape 须已 `registerFlowCustomNode` 注册）

## 快速上手（最小可用）

```ts
const groupList: FlowMaterialPanelGroupItem[] = [
  {
    title: "基础节点",
    name: "basic",
    collapsable: true,
    children: [
      { shape: "flow-step", attrs: { label: { text: "步骤" } } },
      { shape: "flow-decision", attrs: { label: { text: "判断" } } },
    ],
  },
];
```

```html
<FlowMaterialPanel :graph="graph" title="节点素材" :groupList="groupList" />
```

## API

> ⚠️ 以 types.ts（`FlowMaterialPanelProps` / `FlowMaterialPanelGroupItem`）与源码为真相源。

### Props

| name            | type                            | 默认 | 语义                                                              |
| --------------- | ------------------------------- | ---- | ----------------------------------------------------------------- |
| `graph`         | `Graph`                         | —    | 画布实例（必传）                                                  |
| `title`         | `string?`                       | —    | 面板标题                                                          |
| `placeholder`   | `string?`                       | —    | 搜索占位提示                                                      |
| `notFoundText`  | `string?`                       | —    | 无搜索结果提示                                                    |
| `collapsable`   | `boolean?`                      | —    | 分组是否可折叠                                                    |
| `groupList`     | `FlowMaterialPanelGroupItem[]?` | —    | 分组列表（title / name / collapsable / children: NodeMetadata[]） |
| `layoutOptions` | `Record<string, any>?`          | —    | Stencil 布局选项（x6 文档）                                       |
| `search`        | `(cell, keyword) => boolean?`   | —    | 自定义搜索判定                                                    |

## 注意

- children 是 x6 `NodeMetadata[]`：`shape` 字段须为已注册 shape（`registerFlowCustomNode`）
- `layoutOptions` 布局参考 x6 Stencil 插件文档

## 关联

- 装配方：`FlowBox`（`showMaterialPanel` / `materialPanelLayout` / `materialPanelProps`，`#materialPanel` 插槽可覆盖）
