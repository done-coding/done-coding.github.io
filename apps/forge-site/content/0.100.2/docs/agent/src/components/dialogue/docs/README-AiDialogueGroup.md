# AiDialogueGroup（多会话对话 + 操作条）

> 多会话形态的对话主件：`AiDialogue` × N（按会话列表渲染）+ 折叠式操作条（会话记录：分组列表 / 新建 / 分页加载 / 激活切换）。AI 模块整体 `AiDialogueGroupProps` 透传给各 AiDialogue。
> 范式页：`demo-src/demos/GroupDemo.vue`

## 定位

- **多会话场景一等公民**：需要会话列表（历史记录 / 新建会话 / 切换）时用它，单会话场景用 `AiDialogue` 即可
- **何时不用**：单会话用 `AiDialogue`；无需会话列表的自管场景也用 `AiDialogue`
- 内部实现（不导出）：`AiOperationBar`（操作条 + Conversations 会话列表）/ `useSessionListScoped`（会话列表状态机）

## 快速上手（最小可用）

```html
<AiConfigProvider :is-dark-theme="false">
  <AiDialogueGroup :user-name="'demo-user'" />
</AiConfigProvider>
```

**要点**：

- 操作条默认折叠（`v-model:is-collapsed` 默认 `true`）；点操作条按钮展开会话记录，**点选会话后立即收起**（显式操作）
  > 0.3.0 起移除「悬停主体区 300ms 自动收起」（原 `useGroupUX`）——鼠标飘过即消失属反直觉交互
- 新会话流程：点「新建会话」→ 主区出现空会话输入框（AiSenderHeader 欢迎语 + 快捷问题）→ 首问后写入会话列表
- `operationBarProps` 覆盖操作条行为（`position` 默认 `"right"`，支持 `"left"`）
- 会话 / 消息全部持久化于 `createAiDb(userName)`（与 AiDialogue 同库，切换页面不丢）

## 能力边界 / 按需使用

- **操作条位置**：默认右侧；`operationBarProps.position: "left"` 换左侧（tooltip 方向自动跟随）
- **折叠宽度**：`operationBarProps.collapsedWidth`（默认 `50`）/ `unCollapseWidth`（默认 `200`）——纯视觉定制
- **会话列表分组**：按日期分组展示（今天 / 更早，`Conversations groupable`）——内置行为
- **完整能力演示**：`demo-src/demos/GroupDemo.vue`——能力展示，非推荐默认

## API

> ⚠️ API 以 types.ts（`AiDialogueGroupProps`）与组件源码为真相源；与文档冲突时以源码为准。

### Props

继承 `AiDialogueProps` 全部字段（透传给各 AiDialogue，见 [README-AiDialogue](./README-AiDialogue.md)），另有：

| name | type | 默认 | 语义 |
| --- | --- | --- | --- |
| `operationBarProps` | `Omit<AiOperationBarProps, "list"\|"sessionListLoadMoreLoading">?` | — | 操作条 props（position / collapsedWidth / unCollapseWidth / onClose / logoUrl）；`list` 与加载态由组件内部注入 |

**v-model**：`isCollapsed`（boolean，操作条折叠态，默认 `true`）

### Emits

无显式 defineEmits（AiDialogue 的 `sessionEnable` 经内部 `unshiftSession` 直接消费——新会话自动入列，无需外部转发）

### Slots

| name | 参数 | 语义 |
| --- | --- | --- |
| `part`（可选） | `{ part: AiDataPart, item: XBubbleListItemProps }` | 透传给 AiDialogue 的数据 part 渲染口；缺省使用内置渲染 |
| `tool`（可选） | `{ part: AiToolPart, item: XBubbleListItemProps }` | 透传给 AiDialogue 的工具 part 渲染口；缺省使用内置渲染 |

### Expose

无 `defineExpose`；`useSessionListScoped` 内部注册会话级操作（`useSessionOperateMount`）→ 外部经 `useAiExposeInject().aiExpose.sessionOperate` 取（`create()` 新建会话 / `switch(id)` 切换激活）

## 反模式 / 注意

- **多个 AiDialogueGroup 并存**：共享同一 `AiConfigProvider` 时 expose 通道为全局单份——多实例并存场景建议各配独立 Provider 或确认 expose 语义符合预期
- **漏包 AiConfigProvider**：expose 通道缺失 → `useSessionOperateMount` inject 抛错（「未获取到上级注入…」）
- **改 userName 换库**：同 AiDialogue，切换用户 = 切换 IndexedDB 库

## 关联

- 单会话：`AiDialogue`；浮层：`AiDialogueWrap`（GroupDemo 外层常配 Wrap）
- 操作条内部件：`AiOperationBar` / `AiOperationBtns`（见 operation 族文档，仅 API）
- hooks：`useSessionListScoped` / `useSessionOperateMount`（见 `src/hooks/docs/README.md`）
