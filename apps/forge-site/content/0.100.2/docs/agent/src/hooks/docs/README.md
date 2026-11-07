# hooks 模块引导

`useCodeXSlot()` 返回 `{ codeXSlot: ComputedRef<CodeXSlotHeader> }`；`CodeXSlotHeader` 保持上游七个可选代码头插槽字段，类型依据为公开 `XMarkdown` props。消费者无需导入上游内部 `shiki-header` 文件；运行时复制与折叠行为不变。

对话全流程组合函数。公开件经顶层 barrel 导出（`import { useAiExposeInject } from "@done-coding/forge-kit-agent"`）。

| hook                                                                                                         | 职责                                                                                         | 公开    |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------- |
| `useAiExposeProvide` / `useAiExposeInject`                                                                   | 对话 expose 通道（AiConfigProvider provide / 任意位置 inject）                               | ✅      |
| `useAiSessionProvide` / `useAiSessionInject`                                                                 | 当前会话 expose（AiDialogue provide / 内部件 inject）                                        | ✅      |
| `useSessionExpose`                                                                                           | 单会话 expose 注册（sender/bubbleList/ask，随激活态绑解）                                    | ✅      |
| `useSessionOperateMount`                                                                                     | 会话级操作挂载（create/switch，AiDialogueGroup 注册）                                        | ✅      |
| `useSenderScoped`                                                                                            | 输入框全流程作用域（提交 → SSE → 气泡追加 → 中止）                                           | ✅      |
| `useBubbleListScoped`                                                                                        | 气泡列表状态机（内存 + IndexedDB，分页）                                                     | ✅      |
| `useSessionListScoped` / `createNewSessionInfo`                                                              | 会话列表状态机（内存 + IndexedDB，分组/分页）                                                | ✅      |
| `useAiModuleTheme`                                                                                           | 主题变量挂值（`--dc-agent-*` 三级 fallback 链）                                              | ✅      |
| `useCodeXSlot`                                                                                               | XMarkdown 代码块头部控制（复制 + 折叠）                                                      | ✅      |
| `useFixBubbleListBug`                                                                                        | BubbleList 滚动动画屏蔽（历史加载 / 首问）                                                   | ✅      |
| `useAiSSE` + 协议层工具（parseOpenAIChunk / parseSSEEventLine / mergeToolCallsDeltas / defaultSSEConverter） | OpenAI 协议 SSE 对话流 + 传输层/转换层工具（C 阶段去耦）                                     | ✅      |
| `useAgentUiDensity`                                                                                          | 移动端 scoped-rem 密度（AiDialogueWrap 内置）                                                | ❌ 内部 |
| `useKeyboardInset`                                                                                           | 移动端键盘避让（AiDialogueWrap 内置）                                                        | ❌ 内部 |
| `useEmptyStateCenter`                                                                                        | 空态「欢迎语 + 建议卡 + 输入框」整团垂直居中的几何补偿（RO 实测 header 高，AiDialogue 内置） | ❌ 内部 |

存储层（`hooks/storage.ts`）：`createAiDb(key, namespace?)`（IndexedDB 库：sessions / messages 两表，dexie）+ `useSessionListStorage` / `useMessageListStorage`（分页读写）。库名 `${namespace}/ai-db/${key}`（不传 namespace = `ai-db/${key}`）——**对齐 bridge 的 namespace 机制**（多应用/多环境隔离走 namespace，组件库不区分构建环境、无 DEV 后缀；key 通常 = userName 做用户数据隔离）。

## 使用范式

**expose 通道（最重要的一条）**——外部驱动对话的唯一正道：

```ts
// ① AiConfigProvider 已 provide（无需手动）；任意后代 / 兄弟作用域：
const { aiExpose } = useAiExposeInject();
// aiExpose: { activeSessionId, sender?, bubbleList?, ask?, sessionOperate?, sessionExposeMap }
// ⚠️ 这是 inject，只在 AiConfigProvider **子树内**可用。子树外的宿主（如「AI 面板在
//    侧栏、按钮在主内容区」）走 AiConfigProvider 的 defineExpose：aiRef.value.ask({ value })

// ② 外部「快捷提问」：触发当前激活会话提问
await aiExpose?.ask?.({ value: "帮我写一段示例文本" });

// ②' 以**用户名义**发一张结构化数据卡（引用卡 / 附件的通用机制）
//     value 与 parts 至少给一个；纯卡片（无 value）合法。
await aiExpose?.ask?.({
  parts: [{ type: "data-task-ref", data: { id: 42, name: "日结工作流" } }],
});
// 卡片长什么样归消费方：AiDialogue 的 `#part` 槽对**用户气泡**同样生效。
// 它也进得了后续轮上下文——默认 wire 映射把 `data-*` 序列化成 `[type]\n<JSON>`
// 文本段并入该条 content；形状不合意就换 `AiDialogue` 的 `sseMessagesSerializer`。

// ③ 会话级操作（AiDialogueGroup 场景）：新建 / 切换会话
await aiExpose?.sessionOperate?.create();
await aiExpose?.sessionOperate?.switch(sessionId);

// ⚠️ 未包 AiConfigProvider 时 aiExpose 为 undefined——调用前判空
```

```ts
// ❌ 不推荐：绕过通道直接 import 内部状态 / 自行 provide 同名 key（AI_EXPOSE_PROVIDE 为包内私有）
```

**❌ [MUST NOT] 在 `AiConfigProvider` 外层再自建一个 provider**——`AiConfigProvider`
自身就调 `useAiExposeProvide()`，外层那个会被**内层遮蔽**：注册表恒空、`ask` 恒 undefined，
且两个 provider 静默共存、零报错。`useAiExposeProvide` 检测到上级已有同 key provide 时会
`console.warn`（不做 DEV 门控——门控后消费方永远看不见，而这条 warn 的价值全在消费方那侧）。

```ts
// ❌ 外层这层是多余的，只会遮蔽
useAiExposeProvide(); // ← 宿主组件里自建
// <AiConfigProvider> … </AiConfigProvider>  ← 它内部又 provide 了一次

// ✅ 直接用 AiConfigProvider 的 defineExpose（子树外）或 useAiExposeInject（子树内）
```

## SSE 内部件契约（sse.ts · 不导出 · 仅 API）

> `useAiSSE` 为 `useSenderScoped` 内部消费的 SSE 对话流（C 阶段已交付 OpenAI 协议，2026-08-02）。传输层业务无关、业务数据经转换器注入；协议类型（`AiSSEFrame` / `AiSSEConverter` / `AiOpenAIDeltaToolCall`）与函数（`parseOpenAIChunk` / `parseSSEEventLine` / `mergeToolCallsDeltas` / `defaultSSEConverter`）随包导出（types barrel 与 hooks 经顶层导出）。

```ts
useAiSSE<T extends XBubbleListItemProps>({
  message,        // 当前气泡项（只读）
  input,          // 提交内容（OpenAI body.messages 的 user content）
  sseUrl,         // 端点（[MUST] 显式传入，库不读宿主 env）
  model,          // 模型标识（OpenAI body.model；Authorization: Bearer 同值）
  converter,      // 业务转换器（缺省恒等：content → AiTextPart）
  finish,         // 完成回调（symbol 隔离）
  changeMessage,  // 消息增量更新（content 高频防抖）
})
```

- 请求：`fetch POST sseUrl`，body `{ model, messages: [{role:"user",content}], stream:true }`
- 帧：OpenAI chunk（`choices[0].delta.content` 累积 + `delta.tool_calls` 增量 + `finish_reason`）+ `data: [DONE]` 结束；经 `useXStream`（vue-element-plus-x）读流（其 splitPart 已剥 `data:` 前缀，`parseSSEEventLine` 兼容两种输入形态）
- 转换器输出应用：text part → `content` 增量拼接（打字机流式）；非 text part（reasoning/tool-call/file/data-\*）→ `item.parts` 累积，**并同步记录 `item.partOffsets`**（每 part 首次落位时的正文长度，驱动 AiBubbleContent 时序交错渲染；upsert 命中已有 id 时保持首记偏移。q21yfk 方案 B，种子经 `initialPartOffsets` 跨轮续接）
- **reasoning_content（q21yfk / ot2ihk）**：`delta.reasoning_content`（DeepSeek 式独立字段）解析进 `frame.reasoningContent`；默认转换器产 `AiReasoningPart`（`state: "streaming"`，增量在 applyParts 合并进同一 part 而非逐帧追加，见批次 D9）；首个正文/工具帧到达或流收尾时翻 `"done"` 并落 `thinkTime`（秒）
- function call 铺路（REQ-4）：`delta.tool_calls` 增量解析进归一化帧（`frame.toolCalls`），`mergeToolCallsDeltas` 纯合并（index 锚 + arguments 拼接），默认转换器不消费——业务转换器按需映射为 AiToolPart（v5 状态机）
- 返回：`{ startSSE, symbol, input, isResponding, cancel }`——`startSSE` 幂等（内部锁只跑一次）；`cancel` 中止响应
- 完成语义：done 帧（`[DONE]` 或 `finish_reason`）→ `isFinished: true` + `finish(symbol)`；异常 → `errorMsg`（通用 body 错误解析）

## 关联

- 主题 token 真相表：`theme.ts`（`AGENT_UI_DENSITY_TOKENS` + DEFAULTS）——`--dc-agent-*` 默认值唯一真相源，消费方覆盖走 CSS 变量
- 移动端：`useAgentUiDensity` / `useKeyboardInset` 由 `AiDialogueWrap` 内置，一般业务不直接调（详见 `docs/mobile-adaptation.md`）
- 存储：dexie（`dependencies`）——`AiDb` 为包内封装的 IndexedDB 库类
