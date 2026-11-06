# dialogue 对话族

AI 对话主件：全流程对话（AiDialogue）/ 多会话 + 会话列表（AiDialogueGroup）/ 浮层挂载（AiDialogueWrap）/ 受控展示（AiMessageList）。全部经顶层 barrel 导出。

## 组件文档（docs/）

- [AiDialogue](./docs/README-AiDialogue.md) — 全流程单会话对话（持久化 + SSE + 输入 + 流式渲染）
- [AiDialogueGroup](./docs/README-AiDialogueGroup.md) — 多会话对话 + 操作条（折叠式会话记录）
- [AiDialogueWrap](./docs/README-AiDialogueWrap.md) — Teleport 浮层面板（拉手开合 + 移动端全屏）
- [AiMessageList](./docs/README-AiMessageList.md) — 受控消息展示（`{id,role,parts|content}`，零协议耦合）

## 关键类型

- `AiDialogueProps` / `AiDialogueGroupProps` / `AiMessage` / `AiMessageRole` / `AiMessagePart` / `AiTextPart` / `AiDataPart` / `normalizeParts`（经 `./types` 导出）
- 内部件不导出：bubble / sender / operation 各族组件由对话主件自动装配

## 范式页

- `apps/reference/src/pages/other/integration/agent/`（受控展示最小可用）
- `demo-src/demos/`：DialogueDemo（AiDialogue）/ GroupDemo（AiDialogueGroup）/ WrapDemo（AiDialogueWrap）/ MessageListDemo（AiMessageList）/ ConfigDemo（AiConfigProvider）/ AskPartsDemo（`ask({ parts })` 以用户名义发数据卡）

`AiDialogue` / `AiDialogueGroup` 的 `part`、`tool` 插槽均可选；未提供时沿用内置渲染，透传仍由 v-if 判断插槽是否存在。
