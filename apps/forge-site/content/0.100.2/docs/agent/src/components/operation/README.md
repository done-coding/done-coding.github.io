# operation 操作族

会话记录操作条（内部件，AiDialogueGroup 自动装配，[MUST NOT] 当公共组件用——无独立对外使用场景）。

## 组件文档（docs/ · 仅 API）

- [AiOperationBar](./docs/README-AiOperationBar.md) — 折叠式操作条（logo + 按钮 + Conversations 会话列表）
- [AiOperationBtns](./docs/README-AiOperationBtns.md) — 操作条按钮组（关闭 / 展开收起 / 新建会话）

## 机制契约（族级）

- 会话列表数据与加载态由 `AiDialogueGroup` 内部注入（`useSessionListScoped`）：`list` / `sessionListLoadMoreLoading` 两 prop [MUST NOT] 由外部传——外部仅能定制 position / 宽度 / logo 等外观行为
- 激活会话 / 折叠态经 v-model 双向同步到 `AiDialogueGroup` 内部状态
