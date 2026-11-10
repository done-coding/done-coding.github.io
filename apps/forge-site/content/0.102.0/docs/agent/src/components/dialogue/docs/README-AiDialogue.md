# AiDialogue（全流程单会话对话）

> 自管全流程的 AI 对话主件：IndexedDB 持久化（会话 + 消息）+ SSE 流式（打字机 / markdown / 思考折叠 / 工具调用）+ 输入框 + 历史记录分页加载 + 键盘避让。
> 范式页：`demo-src/demos/DialogueDemo.vue`

## 定位

- **自管路径一等公民**：要「一个能用的对话」直接用它——平台接管持久化 / SSE / 输入 / 渲染全流程
- **何时不用**：消息数据由消费方持有、平台不碰持久化/网络的场景用 `AiMessageList`（+ `AiSender`）；多会话 + 会话列表用 `AiDialogueGroup`；浮层挂载用 `AiDialogueWrap` 包裹
- 内部实现（不导出）：`useBubbleListScoped`（气泡列表）/ `useSenderScoped`（输入全流程）/ `useSessionExpose`（expose 注册）/ `useAiSSE` · `useAiAgent`（传输与工具循环）/ `AiBubbleContent` 等 bubble 内部件

## 快速上手（最小可用）

```html
<AiConfigProvider :is-dark-theme="false">
  <AiDialogue
    userName="demo-user"
    sseUrl="/api/chat"
    :sseBody="{ model: 'gpt-4o-mini' }"
  />
</AiConfigProvider>
```

**要点**：

- `userName` 必填——派生 `createAiDb(userName, dbNamespace)`（IndexedDB 库名含 userName 隔离用户数据；`dbNamespace` 对齐 bridge 命名空间机制，多应用/多环境隔离用）
- `sseUrl` [MUST] 显式传入（OpenAI Chat Completions 端点）——库不读宿主 env（`import.meta.env` 构建期替换会让发布包焊死包作者环境）；未传时发送会提示「未配置 SSE 端点」
- **模型走 `sseBody.model`**——本组件[MUST NOT] 持模型清单，也不提供模型选择器（见下「输入区只有输入框」）
- 外层 [MUST] 包 `AiConfigProvider`（主题变量 + expose 通道）；容器需有确定高度（组件 `height:100%`）

## 输入区只有输入框（0.3.0 起）

输入区**只有文本域 + 发送/停止键**，没有智能体下拉、没有模型标签行。

**为什么**：「智能体 → 执行目标」是**某个具体业务的信息架构**，不是对话组件的通用契约。焊进库里会让「单模型应用」「模型由后端路由」「模型走 `sseBody`」三种常见形态全都发不出消息。业界（ChatGPT / Claude / Copilot Chat / Cursor）composer 里的常驻控件也只有**模型选择**（最多再加一个模式），能力唤起走 `@` / `/`，不是常驻下拉。

要在输入区放业务控件，[SHOULD] 自建外壳承载，[MUST NOT] 期待本组件内置。

## 空态：欢迎语 + 快捷发起

新会话（`msgCount` 为 0）时展示欢迎语与快捷问题卡，**点击即发送**（不是填进输入框）。

```html
<AiDialogue
  userName="u"
  sseUrl="/api/chat"
  greeting="试试这么说："
  :swiftAsk="['带我去主题画廊', '把主题换成夜间模式']"
/>
```

- `swiftAsk` 不传 → **整块建议卡不渲染**（只剩欢迎语）
- `greeting` 不传 → 按有无 `swiftAsk` 取默认：有 → `你可以这么问：`；无 → `今天有什么可以帮到你？`
- 窄容器（如侧栏内嵌）建议卡自动降为单列——走**容器查询**，不看视口宽度

## 能力边界 / 按需使用

- **SSE 端点**：`sseUrl` [MUST] 显式传（无 env 默认）；协议 = OpenAI Chat Completions（POST `{model, messages, stream:true}` + SSE 帧 + `[DONE]`）
- **`sseConverter`（业务转换器）**：默认不传 = 恒等（content → text part，即够用）；业务自定义协议数据（自定义事件 / delta 扩展字段）时传 `(frame: AiSSEFrame) => AiMessagePart[]`
- **`sseMessagesSerializer`（wire 序列化替换点）**：默认 `toOpenAIMessages`——`text` 拼进 `content`、`data-*` 序列化成 `[<type>]\n<JSON>` 文本段并入同一条 `content`、`reasoning` 丢弃（业界通例）、`tool-call` / `file` 不映射。默认映射是**有损**的；后端要的不是这个形状（如 data part 要走 multimodal `content` 数组、或走自定义顶层字段）就整条换掉它，[MUST NOT] 去改 `toOpenAIMessages` 的输出再回填
- **以用户名义发数据卡（`ask({ parts })`）**：`#part` 槽对**用户气泡**同样生效；纯卡片消息（无文本）合法可发、可回放，且默认映射保证它**进得了后续轮上下文**
- **`showThink`（`<think>` 文本切分）**：**默认关**。开启后按 `</think>` 标记把正文切成「思考段 + 答复段」。仅当后端把思考塞在**正文文本**里、且不吐结构化 `reasoning` part 时才需要开——两者是同一件事的两条路，[MUST NOT] 同时依赖
- **思维链（结构化 `reasoning` part · q21yfk）**：传输层解析 `delta.reasoning_content`（DeepSeek 式独立字段）→ 默认转换器产 `AiReasoningPart`，**默认渲染**——流式展开「正在思考」、完成自动折叠「已思考(N秒)」（口径见批次 D3，对标 DeepSeek / AI SDK Elements）。无需任何配置；不想要思维链就让后端别下发
- **parts 时序（q21yfk 方案 B）**：流式期间记录每个非 text part 的正文偏移（`partOffsets`），渲染按偏移交错——工具卡出现在两段正文**之间**（真实时序），随打字机推进浮现。存量历史消息（无偏移）退回「正文后挂 parts」旧序
- **会话标题 / logo / 头像**：`showTitle`（默认 `true`）/ `titleHeight`（默认 `43px`）/ `logoUrl`（`#logo` 槽 > logoUrl > 无则不渲染）/ `showAvatar`（默认 false）——纯视觉定制
- **`db`**：默认 `createAiDb(userName)`；需要多组件共享同一库 / 自建库实例时显式传（`createAiDb(key)`，key 任意）
- **完整能力演示**：`demo-src/demos/DialogueDemo.vue`——能力展示，非推荐默认

## API

> ⚠️ API 以 types.ts（`AiDialogueProps`）与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name | type | 默认 | 语义 |
| --- | --- | --- | --- |
| `userName` | `string`（必填） | — | 用户名；派生 createAiDb 库 key（库名 `${dbNamespace}/ai-db/${userName}`，用户数据隔离） |
| `db` | `AiDb?` | `createAiDb(userName, dbNamespace)` | 显式 IndexedDB 库实例（会话 + 消息两表） |
| `dbNamespace` | `string?` | 无 | 会话库命名空间（库名 `${namespace}/ai-db/${userName}`） |
| `sseUrl` | `string?` | 无（[MUST] 显式传） | SSE 端点（OpenAI Chat Completions 协议） |
| `sseConverter` | `AiSSEConverter?` | 恒等（content → AiTextPart） | 业务转换器：帧 → AiMessagePart[] |
| `sseHeaders` | `AiSSEHeaders \| (() => …)?` | 无 | 附加/覆盖请求头；函数形态每轮求值（token 刷新） |
| `sseBody` | `Record<string, unknown>?` | 无 | 附加/覆盖请求体；**`model` 走这里**，另含 `temperature` / `tool_choice` 等 |
| `historyLimit` | `number?` | 全量 | 携带历史条数上限；`<= 0` = 不带历史 |
| `sseMessagesSerializer` | `((messages: AiMessage[]) => AiChatCompletionMessage[])?` | `toOpenAIMessages` | 气泡历史 → wire `body.messages[]` 的序列化器（替换默认有损映射） |
| `tools` | `readonly AiTool[]?` | 无 | 前端工具注册表（webAgent 循环） |
| `onToolCall` | `AiToolExecutor?` | 无 | 工具兜底执行体 |
| `maxSteps` | `number?` | `10` | 工具循环轮数上限 |
| `swiftAsk` | `string[]?` | 无 | **空态快捷问题，点击即发送**；不传则整块不渲染 |
| `greeting` | `string?` | 见「空态」 | 空态欢迎语 |
| `showTitle` | `boolean?` | `true` | 是否展示会话标题栏（侧栏内嵌且宿主已有标题时传 `false`） |
| `showThink` | `boolean?` | `false` | 是否按 `</think>` 切分正文为思考段 |
| `bubbleMaxWidth` | `string?` | `"100%"` | 用户消息气泡最大宽度 |
| `showAvatar` | `boolean?` | `false` | 是否展示头像 |
| `titleHeight` | `number\|string?` | `"43px"` | 会话标题高度（`showTitle` 为 false 时不占位） |
| `logoUrl` | `string?` | — | logo 图片地址（优先级 `#logo` 槽 > logoUrl > 不渲染） |

**v-model**：`sessionInfo`（`XConversationItem`，当前会话信息；缺省 = 新会话）

### Emits

| 事件 | 参数 | 语义 |
| --- | --- | --- |
| `sessionEnable` | `XConversationItem` | 会话被启动（新对话首次发言）——用于插入会话列表 |

### Slots

| slot | 作用域 | 语义 |
| --- | --- | --- |
| `part`（可选） | `{ part: AiDataPart, item: XBubbleListItemProps }` | 业务 data part 渲染口；缺省退回 `AiPartRenderer`。**AI 与用户气泡共用**（用户侧的 part 来自 `ask({ parts })`） |
| `tool`（可选） | `{ part: AiToolPart, item: XBubbleListItemProps }` | 工具调用 part 渲染口（generative UI / 人在环）；缺省退回 `AiPartRenderer` |

### Expose

无 `defineExpose`；会话 expose（sender/bubbleList/ask）经 `useSessionExpose` 自动注册进 `AiConfigProvider` 的 expose 通道。

- **provider 子树内**：`useAiExposeInject().aiExpose.value.ask({ value })` / `ask({ parts })`（`value` 与 `parts` 至少给一个）
- **provider 子树外**（宿主页面按钮触发）：给 `AiConfigProvider` 挂 ref，用它的 `defineExpose`——见 `README-AiConfigProvider.md`

## 反模式 / 注意

- **漏包 AiConfigProvider**：主题变量与 expose 通道缺失 → 视觉走默认兜底 + `useAiExposeInject` 取不到 expose（undefined，不报错）
- **无确定高度容器**：组件 `height:100%` + 内部 sender 绝对定位——容器高度塌陷会视觉崩坏
- **SSE 端点须为 OpenAI 协议**：`useAiSSE` 按 OpenAI Chat Completions 解析——接非 OpenAI 协议端点需经 `sseConverter` 映射
- **改 userName 换库**：IndexedDB 库 key 含 userName——切换用户 = 切换库，历史会话按用户隔离
- **[MUST NOT] 指望库替你选模型**：不传 `sseBody.model` 时请求体不带 `model` 字段，多数网关会 400

## 关联

- 受控路径对照：`AiMessageList` / `AiSender`（不碰持久化/SSE）
- 多会话：`AiDialogueGroup`（AiDialogue + 操作条）；浮层：`AiDialogueWrap`
- hooks：`useSenderScoped` / `useBubbleListScoped` / `useSessionExpose` / `useAiSSE` / `useAiAgent`（见 `src/hooks/docs/README.md`）
