# components 组件族总引导

agent 共 6 个组件族，公开组件全部经顶层 barrel 导出（`import { AiDialogue } from "@done-coding/forge-kit-agent"`）。各族目录内均有 `README.md` 入口（组件清单 + 指向 `docs/` 组件详情文档，`README-<PascalName>.md`）。

**页面范式**：`AiConfigProvider`（主题 + expose 通道根）→ 对话主件（`AiDialogue` 全流程 / `AiMessageList` 受控展示 / `AiDialogueWrap` 浮层 / `AiDialogueGroup` 多会话）→ 内部件（bubble / sender 扩展 / operation 操作条）由主件自动装配。

## 对话组件契约（接入决策）

| 场景 | 一等公民（优先用） | 说明 |
| --- | --- | --- |
| 接入最快 · 零后端 | `AiMessageList` | 受控消息展示（`{id,role,parts|content}`），静态数据即可用；与 `AiSender` 配对成受控对话原语 |
| 完整对话 · 自管全流程 | `AiDialogue` | 持久化（IndexedDB）+ SSE + 输入 + 流式渲染一揽子；需 SSE 端点 |
| 多会话 + 会话列表 | `AiDialogueGroup` | AiDialogue + 操作条（折叠式会话记录） |
| 浮层挂载 | `AiDialogueWrap` | Teleport fixed 面板（拉手开合 + 移动端全屏），内嵌上述主件 |

- 受控路径（AiMessageList + AiSender）与自管路径（AiDialogue）**可独立使用**：受控路径不碰 IndexedDB / SSE，消费方自己持有消息列表；自管路径由平台接管全部流程。
- **expose 通道**：`AiConfigProvider` provide 全局 expose（sender/bubbleList/ask/sessionOperate/sessionExposeMap），消费方经 `useAiExposeInject` 取（子树外用 `AiConfigProvider` 的 `defineExpose`）——如外部「快捷提问」按钮调 `aiExpose.ask({ value })`，或 `ask({ parts })` **以用户名义**发一张结构化数据卡（`#part` 槽对用户气泡同样生效）。
- [MUST NOT] 在 `AiConfigProvider` **外层**再自建 provider：会被内层遮蔽（注册表恒空、`ask` 恒 undefined），检测到即 `console.warn`。
- **协议层**：AiDialogue 的 SSE 链路为 **OpenAI Chat Completions 协议**——入站经 `sseConverter`（帧 → parts）、出站经 `sseMessagesSerializer`（parts → wire，默认 `toOpenAIMessages`），两者成对，见包级 README「协议契约」节。AiMessageList / AiSender 为受控原语，**零协议耦合**。

## 族清单

| 族 | 组件 | 入口 |
| --- | --- | --- |
| dialogue 对话族 | AiDialogue / AiDialogueGroup / AiDialogueWrap / AiMessageList（全公开） | [README](./dialogue/README.md) |
| sender 输入族 | AiSender（公开）；AiSenderHeader（内部件） | [README](./sender/README.md) |
| config 配置族 | AiConfigProvider（公开） | [README](./config/README.md) |
| operation 操作族 | AiOperationBar / AiOperationBtns（内部件，AiDialogueGroup 装配） | [README](./operation/README.md) |
| bubble 气泡族 | AiBubbleContent / AiBubbleFooter / AiCodeHeaderControl / AiContentSplit / AiThinkBox / AiTypewriter（内部件） | [README](./bubble/README.md) |
| json-trigger 结构化输出族 | LlmJsonTrigger（公开；配套纯方法 getJsonFromLlm）——schema in → JSON out，与消费方 duck 契约互盲对接 | [README](./json-trigger/README.md) |

## 写作与维护约定

- 各族 `README.md` = 入口（组件清单 + 一句话），组件详情在 `docs/README-<PascalName>.md`
- **快速上手 = 最小可用形态**（默认值即够用，5–20 行可直接抄的代码）——[MUST NOT] 把能力全开示例当快速上手
- **每篇必含「能力边界 / 按需使用」段**（快速上手之后）：逐条断言「默认关/默认即够用 + 仅当 X 场景才开（判据）」
- API 段以 `src/types/index.ts` + 组件源码为真相源；与文档冲突时以源码为准
- 内部件（不导出）也写独立文档，但**仅 API 段**（props/emits/slots/expose + 机制契约，以源码为真相源）——[MUST NOT] 写定位 / 快速上手等消费向叙事段（无对外使用场景，写了反而误导 AI 当公共组件用）；族入口标注「内部件 · 仅 API」
- 新增/改造对外组件 [MUST] 同步补 `docs/README-<PascalName>.md`（随 `docs/specs/` 任务闭环）

### 开发流程（API 契约先行）

新组件 / 组件改造（含 API 变更）[MUST] 按四步走，[MUST NOT] 先实现后补文档：

1. **API 契约先行**：先写 `types.ts`（props/emits 类型）并**同步更新**对应 `docs/README-<PascalName>.md` 的 API 段——API 表先于实现存在、锁定契约
2. **实现**：满足契约；实现中 API 微调属正常，同步回改 API 表
3. **验收**：demo（demo-src/demos/）+ 单测 + build（规则 9.1 双链）
4. **非 API 文档收尾**（[MUST] 作为 spec TASK 单列）：定位 / 快速上手（最小可用）/ 能力边界 / 反模式——此时实现与 demo 已定型，写出的姿势全部经实证

**复核闸**：第 4 步执行时 [MUST] 对照 `types.ts` + `withDefaults` 复核 API 表——「API 以 types.ts 为真相源」双向执行：实现前 API 表当契约写，实现后 types.ts 当真相校。
