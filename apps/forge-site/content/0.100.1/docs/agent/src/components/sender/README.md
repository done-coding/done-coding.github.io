# sender 输入族

AI 对话输入：AiSender（公开，受控输入原语）+ 内部件 AiSenderHeader（空态欢迎语 / 快捷问题）。

> 0.3.0 起移除 `AiSenderFooter`（智能体下拉 + 模型 tag 行）——那是某个具体业务的信息架构，非对话组件通用契约。输入区现在只有文本域 + 发送/停止键；模型走 `AiDialogue` 的 `sseBody.model`。

## 组件文档（docs/）

- [AiSender](./docs/README-AiSender.md) — 受控输入原语（薄封装业界 Sender，与 AiMessageList 配对成受控对话）
- [AiSenderHeader](./docs/README-AiSenderHeader.md) — 内部件 · 仅 API（空态欢迎语 + 快捷问题卡，AiDialogue 新会话态渲染）

## 关键类型

- `AiSenderProps` / `AiSenderSubmitType`（经 `./types` 导出）
- 内部件不导出：AiSenderHeader

## 范式页

- `demo-src/demos/DialogueDemo.vue`（AiDialogue 内自动装配）
- `apps/reference/src/pages/other/integration/agent/`（受控对话链路可参考）
