# json-trigger 结构化输出族

「LLM 出 JSON」原语（批次 gf9z3w）：给定 schema 与自然语言，从 OpenAI 兼容端点拿回
符合 schema 的 JSON。**不关心消费方是表单还是别的**——数据怎么落地归消费方。

| 成员 | 形态 | 入口 |
| --- | --- | --- |
| `getJsonFromLlm` | 纯 async 方法（非 hook） | `src/utils/json-from-llm.ts` |
| `LlmJsonTrigger` | 触发组件（= 方法 + 触发 UI 薄包装） | [README-LlmJsonTrigger](./docs/README-LlmJsonTrigger.md) |

**定位**：本包与 `@done-coding/admin-core` **互不知晓**——core 侧的 aiFill 槽位收的是
duck 契约组件（`getSchema` / `onData`），应用层在 bridge 初始化时把本组件（经薄
wrapper 预绑定传输参数）注册进去。[MUST NOT] 在本族 import core 或假设消费方形态。
