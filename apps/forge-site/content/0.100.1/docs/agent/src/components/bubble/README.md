# bubble 气泡族

消息气泡渲染内部件（全部不导出，[MUST NOT] 当公共组件用）：AiDialogue / AiMessageList 自动装配。流式打字机 → 思考折叠 → markdown 渲染 → 代码块控制 → 错误/中止/复制，一条消息的渲染链路。

## 组件文档（docs/ · 仅 API）

- [AiBubbleContent](./docs/README-AiBubbleContent.md) — 气泡内容（AI 推理轨 + 打字机 + markdown；用户纯文本；`item.parts` 静态渲染链**两角色共用**）
- [AiBubbleFooter](./docs/README-AiBubbleFooter.md) — 气泡尾（中止/错误提示 + 复制操作条）
- [AiCodeHeaderControl](./docs/README-AiCodeHeaderControl.md) — 代码块头部控制（复制 + 折叠/展开，XMarkdown codeHeaderControl 插槽）
- [AiContentSplit](./docs/README-AiContentSplit.md) — 思考内容切分（`<think>...</think>` → 折叠框 + 答复分列）
- [AiThinkBox](./docs/README-AiThinkBox.md) — 思考折叠框（流式自动展开 / 完成自动折叠 / 手动优先）
- [AiTypewriter](./docs/README-AiTypewriter.md) — 打字机（逐字展示 + 光标后缀）
- [AiPartRenderer](./docs/README-AiPartRenderer.md) — 非 text part 默认渲染（reasoning 折叠 / tool-call 状态机 / file / data-* 占位）

## 机制契约（族级）

- 渲染链路：`AiBubbleContent`（AI 角色）→ `AiTypewriter`（流式逐字）→ 有思考标记时 `AiContentSplit` → `AiThinkBox` 折叠 + `XMarkdown` 渲染；错误/中止在 `AiBubbleFooter` 呈现
- 所有组件消费 `XBubbleListItemProps`（内部气泡项，含 `content` / `isFinished` / `errorMsg` / `isAborted` / `thinkTime` / `showThink` 等）——公开受控路径由 AiMessageList 的 adapter 映射（AiMessage → XBubbleListItemProps）
