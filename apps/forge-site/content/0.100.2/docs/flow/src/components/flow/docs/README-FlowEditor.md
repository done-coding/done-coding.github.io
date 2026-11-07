# FlowEditor（画布）

> x6 Graph 薄封装：仅透传 FlowEditorProps 白名单字段（`Partial<GraphManual>` 过大且含循环引用，会令 defineProps 生成递归爆栈，故显式白名单）+ 建/销/保存事件。

## 定位

- **裸画布原语**：无面板、无装配；默认值兜底（画布底色跟 dc-core 主题三级回退）
- **何时不用**：全装配场景用 `FlowBox`（本组件只是它的画布子件）

## 快速上手（最小可用）

```html
<FlowEditor
  :width="800"
  :height="600"
  :grid="{ visible: true }"
  :connecting="{ allowLoop: true }"
  @graph-created="onCreated"
  @save-json-data-success="onSaved"
/>
```

```ts
const onCreated = (graph: Graph) => {
  // 画布就绪：可 addNode / 绑事件
  graph.addNode({
    shape: "flow-step",
    x: 40,
    y: 40,
    width: 280,
    height: 64,
    data: { title: "步骤" },
  });
};
const onSaved = (data: FromJSONData) => console.log(data);
```

## API

> ⚠️ 以 types.ts（`FlowEditorProps` / `FlowEditorInstance`）与源码为真相源。

### Props（FlowEditorProps）

| name               | type                         | 默认                             | 语义                                     |
| ------------------ | ---------------------------- | -------------------------------- | ---------------------------------------- |
| `width` / `height` | `number?`                    | 窗口尺寸                         | 画布尺寸                                 |
| `grid`             | `GraphManual["grid"]?`       | —                                | 网格                                     |
| `panning`          | `GraphManual["panning"]?`    | —                                | 画布平移                                 |
| `mousewheel`       | `GraphManual["mousewheel"]?` | —                                | 滚轮缩放                                 |
| `background`       | `GraphManual["background"]?` | dc-core 回退                     | 背景                                     |
| `autoResize`       | `GraphManual["autoResize"]?` | —                                | 自动 resize                              |
| `connecting`       | `GraphManual["connecting"]?` | 浅合并默认（含 createEdge 样式） | 连线交互（单独翻开关不会丢默认连线样式） |

### Emits

| 事件                  | 参数                 | 语义                                                    |
| --------------------- | -------------------- | ------------------------------------------------------- |
| `graphCreated`        | `graph: Graph`       | 画布创建                                                |
| `graphDispose`        | —                    | 卸载时 Graph.dispose 完成后同步发出一次；没有实例时不发 |
| `saveJsonDataSuccess` | `data: FromJSONData` | 保存为 JSON 成功                                        |

### Expose

`FlowEditorInstance`：`getGraph()` / `mountData(data)` / `saveJsonData()`

## 注意

- `connecting` 是**浅合并**：只传 `{ allowLoop: true }` 不会丢掉默认 `createEdge` 连线样式
- 保存 JSON = `saveJsonData()`（expose）或触发 `saveJsonDataSuccess`；消费方自行持久化
- `graphDispose` 是既有事件。tc8m2p 修复卸载时异步 watch 被停止而漏发的问题；消费方不用改接线，浏览器契约会检查 DOM 销毁与事件结果。

## 关联

- 集大成容器：`FlowBox`；插件开关：`FlowEditorGraphPluginUse`
- 内部机制 hooks（键盘 / 事件 / 插件 / 高亮）：见 `hooks/README.md`
