# FlowRunIo（节点进料 / 输出展示）

> 单个执行步骤的**进料参数**与**输出**的只读双栏壳。默认渲染原样降级、诚实缺省；不满意就用插槽自己画。

## 定位

- **壳，不是渲染器**：包侧只保证「两栏在、缺省诚实、未知字段不丢」；具体怎么好看地呈现一坨业务 JSON 是应用层的事
- 🔴 **不按业务 schema 分型渲染**：分型是应用层语义（哪个节点类型的入参长什么样，包侧不知道也不该知道）。要分型 → 用 `#input` / `#output` 插槽
- 插槽里塞什么与本包无关——提示词三段回放、模型调用详情、还是别的什么，应用层自己处理
- **三格而非两格**：进料 / 输出之后还有一格**反馈区**（`#feedback`），装「看完这一步之后人对这一步的表态」

## 快速上手（最小可用）

```html
<!-- 默认渲染：对象走键值表，其余走 JSON 原文 -->
<FlowRunIo :input="step.input" :output="step.output" />
```

```html
<!-- 接管渲染：拿 value 自己画，missing 为真时是「没取到」而非「空」 -->
<FlowRunIo :input="step.input" :output="step.output">
  <template #input="{ value, missing }">
    <MyPromptReplay v-if="!missing" :data="value" />
  </template>
</FlowRunIo>
```

```html
<!-- 反馈区：不传 #feedback = 整块不渲染（[MUST NOT] 渲成空白区 / 占位框） -->
<FlowRunIo :input="step.input" :output="step.output" feedbackTitle="这一步怎么样">
  <template #feedback="{ input, output }">
    <MyStepRating :input="input" :output="output" @submit="save" />
  </template>
</FlowRunIo>
```

## 反馈区（`#feedback`）

**看完一步之后人要对这一步表态**——打分 / 批注 / 标好坏样本 / 补一句失败原因。这个动作既不是进料也不是输出，故独占第三格。

- **位置**：input / output 两格**之后**。默认左右双栏时**横跨两栏**在底部；`vertical` 时顺次排在两格下方。
- 🔴 **不传插槽 = 整块不渲染**（连标题行一起），[MUST NOT] 渲染成空白区或占位框。
- `feedbackTitle` 缺省 = **不渲染标题行**，只渲插槽内容（反馈区常自带标题 / 自带一整套表单，包侧不替它出标题）。
- scope `{ input, output }` = 当前两格的原值（与 `#input` / `#output` 的 `value` 同源），省得消费方自己再存一份。
  - ⚠️ 这里**不给 `missing` 判据**：反馈针对的是「这一步」，不是「取没取到」——`missing` 由消费方自行按 `undefined` 判（判据与 `#input` 一致）。
- **落库标的是「哪一步」**：本件手上没有步骤对象，要 `step` 请用 `FlowRunBox`（它透传同名插槽、scope 额外带 `step`）。

🔴 **[MUST NOT] 把反馈区塞进 `#output` 底部凑合**：语义错，且 `missing` 为真时消费方通常整块不渲染 ⇒ **「没产物」的那一步恰恰最需要反馈，却正好被藏掉**。

## 诚实缺省（本件的立身之本）

| 传入值                      | 语义             | 默认渲染         | 插槽 scope `missing` |
| --------------------------- | ---------------- | ---------------- | -------------------- |
| `undefined`                 | **没取到**       | `missingText` 文案 | `true`               |
| `null` / `""` / `[]` / `{}` | 取到了，但是空值 | 空值本身         | `false`              |

🔴 **[MUST NOT] 拿默认值 / 现行版本冒充历史值。** 典型翻车：回放时取不到执行当时冻结的那一版模板，就拿**现行版本**顶上——页面看起来一切正常，但展示的是「他当时根本没用过的那份」。取不回就传 `undefined`，让它显示「没取到」。

## 默认渲染规则（未知字段原样降级）

- **纯对象** → 键值表：逐键一行，**不挑字段、不按 schema 裁剪**；标量值直接显示，嵌套值折成 JSON 单行
- **其余**（数组 / 标量 / 无法序列化的值）→ JSON 原文块（`JSON.stringify(value, null, 2)`，循环引用等序列化失败时退回 `String(value)`）
- 空对象 / 空数组 → 显示 `{}` / `[]` 本身（它们是**取到的空**，不是缺省）

## API

> ⚠️ 以 `types.ts`（`FlowRunIoProps`）与源码为真相源。

### Props

| name          | type       | 默认         | 语义                                       |
| ------------- | ---------- | ------------ | ------------------------------------------ |
| `input`       | `unknown`  | `undefined`  | 进料参数；`undefined` = 没取到             |
| `output`      | `unknown`  | `undefined`  | 输出；`undefined` = 没取到                 |
| `inputTitle`  | `string?`  | `"进料参数"` | 进料区标题                                 |
| `outputTitle` | `string?`  | `"输出"`     | 输出区标题                                 |
| `missingText` | `string?`  | `"没取到"`   | 缺省说明文案                               |
| `vertical`    | `boolean?` | `false`      | 纵向堆叠（窄容器用）；默认左右双栏         |
| `feedbackTitle` | `string?` | `undefined`  | 反馈区标题；缺省 = 不渲染标题行（只渲插槽内容） |

### Slots

| name     | scope                              | 语义                       |
| -------- | ---------------------------------- | -------------------------- |
| `input`  | `{ value: unknown, missing: boolean }` | 接管进料区内容渲染 |
| `output` | `{ value: unknown, missing: boolean }` | 接管输出区内容渲染 |
| `feedback` | `{ input: unknown, output: unknown }` | 反馈区（对这一步表态）；**不传 = 整块不渲染** |

`#input` / `#output` 只接管**内容**，标题行仍由组件渲染（两栏视觉一致性归包侧）；`#feedback` 的标题行由 `feedbackTitle` 决定有无。

## 两格配比（经 CSS 变量调）

默认两格等宽（`minmax(0, 1fr)` 各一）。进料格要更宽 / 定宽时，给容器设变量即可，
**不需要 `:deep()`**（理由同 `FlowRunBox`：覆盖类与组件那条同为 (0,2,0) 特异度，
谁生效取决于两份 CSS 的加载顺序）：

```css
.my-drawer {
  --flow-run-io-input-width: 320px; /* 也可 2fr / 60% 等任何 grid 轨道值 */
}
```

`vertical`（单列堆叠）时该变量不参与；反馈区恒占满整行。

## 注意

- 本件不请求数据、不缓存、不做 diff：数据 in，渲染 out
- 大对象不做虚拟滚动——内容区 `overflow: auto`，超高自行滚动。真的很大（>1MB）建议应用层先摘要再传

## 关联

- `FlowRunSteps`：选中步骤后把该步的 `input` / `output` 喂给本件
