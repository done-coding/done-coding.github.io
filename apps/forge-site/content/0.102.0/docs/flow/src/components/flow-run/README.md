# flow-run 运行态族

**只读运行轨迹展示**——与 `flow` 编排族（可编辑画布）互补：编排族回答「流程长什么样」，本族回答「这次跑了哪些步、每步的进料与输出是什么」。

🔴 **本族刻意不基于画布引擎**：只读轨迹通常 ≤10 节点，拖 `@antv/x6` 属大材小用，且轨迹的信息密度诉求是**树 / 时间线**而非自由布局画布。对标观测系 Trace View（LangSmith / Langfuse）。[MUST NOT] 用「让 `FlowEditor` 支持只读模式」替代本族。

| 组件           | 职责                                  | 文档                                                    |
| -------------- | ------------------------------------- | ------------------------------------------------------- |
| `FlowRunSteps` | 执行步骤树（顺序步 + 并行支 fanout + 条件分支组 + 失败详情 + 时间轴档） | [README-FlowRunSteps.md](./docs/README-FlowRunSteps.md) |
| `FlowRunIo`    | 单步进料参数 / 输出 + 反馈区（三格只读壳） | [README-FlowRunIo.md](./docs/README-FlowRunIo.md)       |
| `FlowRunBox`   | 二合一集大成件：左树右 IO，选中步自动按 `io` 表取进料/输出；`#input` / `#output` / `#feedback` 插槽透传（`#feedback` 的 scope 额外带 `step`） | [README-FlowRunBox.md](./docs/README-FlowRunBox.md)     |

类型（`types.ts` 真相源）：`FlowRunStepStatusEnum` / `FlowRunStepStatus` / `FlowRunStepNode` / `FlowRunStepError` / `FlowRunStepsProps` / `FlowRunIoProps` / `FlowRunStepIo` / `FlowRunBoxProps`。

内部件：`RunStepList.vue`（递归渲染一串步骤 + 并行分支组，经 provide 取根上下文）、`utils.ts`（纯函数：时长格式化 / 取值降级归一）——均不出桶，消费方不直接使用。

## 两条贯穿全族的纪律

**Ⓐ 只画不判断。** 组件不推断「哪步在跑」「哪步该算超时」——`running` 时调用方传「已执行 + 当前」，终态传全量。推断必然和服务端真相打架，而打架时**页面看起来一切正常**。

**Ⓑ 诚实缺省。** 取不回的东西显示「没取到」，[MUST NOT] 拿默认值 / 现行版本冒充历史值。全族统一判据：

| 值                          | 语义             | 渲染         |
| --------------------------- | ---------------- | ------------ |
| `undefined`                 | **没取到**       | 缺省说明文案 |
| `null` / `""` / `[]` / `{}` | 取到了，但是空值 | 空值本身     |

同理 `durationMs` 无值 = 没量到 ⇒ 不显示，[MUST NOT] 显示成 `0ms`。

## 边界

- **纯展示，数据 in / 事件 out**：不提供数据获取、不焊后端、不焊模型。
- **不按业务 schema 分型渲染**：分型是应用层语义。包侧只给插槽（`#input` / `#output`），应用层自己处理——无论那头是 agent 提示词回放、还是别的什么。
