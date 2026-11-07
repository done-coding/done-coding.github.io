# LlmJsonTrigger — LLM 结构化填充触发器

> `getJsonFromLlm` 的触发 UI 薄包装（批次 gf9z3w）：触发钮 → popup 粘贴自然语言 →
> 调 LLM 拿符合 schema 的 JSON → 吐给消费方落地 → 展示回执与撤销按钮。

## 定位

消费方（如 admin-core 的 FormMain aiFill 槽位）出「挂点 + 数据落地」，本组件出
「全部 AI 交互 UI + LLM 调用」。两侧靠 duck props 契约互盲对接，应用层组装。

## 快速上手（应用层组装范式）

```ts
// 应用 config：薄 wrapper 预绑定传输参数，再注册进消费方槽位
const AppAiFillTrigger = (props: Record<string, any>) =>
  h(LlmJsonTrigger, {
    ...props, // 消费方喂的 getSchema / onData 原样透传
    sseUrl: "/dev-ai/chat",
    model: import.meta.env.VITE_DEV_AI_MODEL,
  });
bridge.register({ aiFillTrigger: AppAiFillTrigger });
```

## 能力边界 / 按需使用

- **duck 契约（消费方喂）**：`getSchema()`（数据契约获取，本组件不关心是表单还是别的）
  + `onData(data)`（吐数据，返 `{ appliedCount, undo }` 回执——撤销**机制**归消费方，
  撤销**按钮**归本组件）。
- **传输四参与 `AiSSEOptions` 同形**（`sseUrl` / `model` / `headers` / `body`），
  应用配一次与对话族通用；`body` 浅合并覆盖内置字段（同 useAiSSE 语义）。
- **默认双意图提示词**（`systemPrompt` 可整体覆盖）：ⓐ 抽取式——文本没提到 / 不确定
  的字段填 null 不编造（防幻觉入库）；ⓑ 用户显式要求模拟 / 生成时按要求出示例值。
- popup：textarea 回车提交、Shift+Enter 换行；loading 期禁输入；错误透传上游
  `error.message`；成功后显示「已应用 N 项 · 撤销」。
- `#trigger` 插槽可换触发钮外观（缺省魔棒圆钮）。
- [MUST NOT] 假设消费方形态；[MUST NOT] import core。

## API
> ⚠️ API 以组件源码为真相源；与文档冲突时以源码为准。

### Props

| name | type | 默认 | 语义 |
| --- | --- | --- | --- |
| `getSchema` | `() => Promise<Record<string, any>>`（必填） | — | duck：数据契约获取 |
| `onData` | `(data) => { appliedCount: number; undo: () => void }`（必填） | — | duck：数据落地回执 |
| `sseUrl` | `string`（必填） | — | OpenAI Chat Completions 端点 |
| `model` | `string` | 未设 | `body.model`（同名 body 键覆盖之） |
| `headers` | `AiSSEHeaders \| () => AiSSEHeaders \| Promise<...>` | 未设 | 附加/覆盖请求头（函数形态每次发起前求值） |
| `body` | `Record<string, unknown>` | 未设 | 浅合并覆盖内置请求体字段 |
| `systemPrompt` | `string` | 双意图模板 | 整体覆盖系统提示词 |
| `placeholder` | `string` | 内置文案 | textarea 占位 |

### Slots

| 槽 | scope | 语义 |
| --- | --- | --- |
| `trigger` | — | 触发钮外观（缺省魔棒圆钮） |

## getJsonFromLlm（配套纯方法）

`getJsonFromLlm({ sseUrl, model?, headers?, body?, schema, prompt, systemPrompt? })
→ Promise<Record<string, any>>`——非流式（`stream:false` + `response_format:
json_object`）一次性取 JSON；HTTP 非 2xx 透传上游 `error.message`；非 JSON 内容抛带
截断原文的 Error。[MUST NOT] 复用 `useAiSSE` 本体（聊天气泡耦合），只同形复用其
传输配置。

## 关联

- 消费侧范式：admin-core FormMain aiFill 槽位（bridge `aiFillTrigger`）；
  demo：reference `/form/ai-fill`。
