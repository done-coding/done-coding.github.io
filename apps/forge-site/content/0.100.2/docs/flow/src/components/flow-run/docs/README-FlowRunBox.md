# FlowRunBox（运行态二合一）

> 集大成件：内部组合 `FlowRunSteps`（左，执行步骤树）+ `FlowRunIo`（右，进料/输出），
> 点步骤即按 `io` 映射表取该步数据喂给 IO 面板。命名对齐编排族的 `FlowBox`。

## 定位

- 覆盖最常见的组合形态「树选步 → 看该步进料/输出」，省掉每个消费方手写 activeKey → io 查表的接线。
- **仍是纯展示**：数据 in / 事件 out，不焊数据获取；`io` 表由应用层给全。
- 两个子件的能力**一件不少**：props 经 `stepsProps` / `ioProps` 分组透传，
  `#input` / `#output` / `#feedback` 自定义插槽**透传**给内层 `FlowRunIo`
  （`#feedback` 的 scope 额外带 `step`，见下）。
- 需要更自由的布局 / 数据流（如回放态换数据源、IO 放弹窗）时，直接组合
  `FlowRunSteps` + `FlowRunIo` 两件，[MUST NOT] 反过来在 box 上叠旋钮。

## 快速上手（最小可用）

```ts
import {
  FlowRunBox,
  type FlowRunStepIo,
  type FlowRunStepNode,
} from "@done-coding/forge-kit-flow";

const steps: FlowRunStepNode[] = [
  { key: "parse", label: "解析输入", status: "done", durationMs: 820 },
  { key: "merge", label: "合并产物", status: "running" },
];

/** 步骤 key → 进料/输出；未收录的 key = 没取到（诚实缺省） */
const io: Record<string, FlowRunStepIo> = {
  parse: { input: { rawText: "…" }, output: { intent: "video.create" } },
  merge: { input: { copyId: "d_1" } }, // 还在跑，输出没取到
};
```

```html
<FlowRunBox
  v-model:activeKey="activeKey"
  :steps-props="{ steps }"
  :io="io"
  @step-click="…"
  @replay="…"
>
  <!-- 可选：接管输出区渲染（不传则用 FlowRunIo 默认渲染） -->
  <template #output="{ value, missing }">…</template>

  <!-- 可选：反馈区（不传则整块不渲染）。step = 当前选中步，反馈的落库标的 -->
  <template #feedback="{ step, input, output }">
    <MyStepRating :step-key="step.key" :input="input" :output="output" />
  </template>
</FlowRunBox>
```

## 语义

- **选中驱动取数**：`activeKey`（受控可省）指向的步从 `io[activeKey]` 取 `input` / `output`。
  未选中 / `io` 表无该 key → 双 `undefined` → IO 面板显缺省文案（诚实缺省，[MUST NOT] 兜空对象冒充）。
- **插槽透传**：`#input` / `#output` 原样转发，scope 与 `FlowRunIo` 一致（`{ value, missing }`）；
  不传插槽时保底 `FlowRunIo` 默认渲染（对象键值表 / JSON 原文 / 缺省文案）。
- **`#feedback` 的 scope 额外带 `step`**：反馈的落库标的是「**哪一步**」。消费方也能从自己的
  `activeKey` 反查，但那要它自己再维护一份「key → step」映射，而 box 手上本来就有这个对象
  —— 不给 = 每个消费方各写一遍同样的反查。`step` 按 `activeKey` 在**全树**查（含并行支 /
  条件支内的子步），拿到的就是被点中的那一个。
  - 🔴 **未选中步 / `activeKey` 不在树里 → 反馈区不渲染**（`step` 无值 = 没有落库标的，
    [MUST NOT] 拿根步或空对象冒充；同「诚实缺省」一条纪律）。选中即出现。
  - `feedbackTitle` 由 `ioProps` 透传（它不由 box 按选中步驱动，故**不在** `Omit` 名单里）。
- **`ioProps` 的类型剔除了 `input` / `output`**——这两键由 box 按选中步驱动，外部传入无效（编译期即拦）。

## API

> ⚠️ 以 `types.ts`（`FlowRunBoxProps` / `FlowRunStepIo`）与源码为真相源。

### Props

| name         | type                                       | 默认 | 语义                                             |
| ------------ | ------------------------------------------ | ---- | ------------------------------------------------ |
| `stepsProps` | `FlowRunStepsProps`                        | —    | 透传给内层 `FlowRunSteps`（`steps` 必传在内）    |
| `ioProps`    | `Omit<FlowRunIoProps, "input"\|"output">?` | —    | 透传给内层 `FlowRunIo`（标题 / 缺省文案 / 纵向 / 反馈区标题） |
| `io`         | `Record<string, FlowRunStepIo>?`           | —    | 步骤 key → 进料/输出映射；未收录 = 没取到        |

### v-model / Emits / Slots

| 面 | 名称 | 语义 |
| --- | --- | --- |
| v-model | `v-model:activeKey` | 选中步骤 key（受控可省），与内层步骤树直通 |
| emit | `stepClick(step)` / `replay(step)` | 原样上抛 `FlowRunSteps` 同名事件 |
| slot | `#input` / `#output` | 原样透传 `FlowRunIo` 同名插槽，scope `{ value, missing }` |
| slot | `#feedback` | 透传 `FlowRunIo` 同名插槽，scope `{ step, input, output }`（`step` 为 box 按 `activeKey` 全树查得的选中步）；未选中 = 不渲染 |

### FlowRunStepIo

| 字段     | type       | 语义                                        |
| -------- | ---------- | ------------------------------------------- |
| `input`  | `unknown?` | 进料；`undefined` = 没取到（显缺省文案）    |
| `output` | `unknown?` | 输出；缺省语义同 `input`                    |

## 两栏配比（左定宽 · 经 CSS 变量调）

**步骤树是导航、IO 是内容**：导航列的宽度需求有天花板（短标签 + 状态 + 耗时），内容区没有
（提示词全文 / JSON / 错误栈）。把有上限的和没上限的按 1:1 分，**容器越宽浪费越多** ⇒
默认是**左定宽 320px、右吃剩余**（对标 LangSmith / Langfuse 的 Trace View）。

改宽度**不需要 `:deep()`**，给容器（或任意祖先）设一个变量即可：

```css
.my-drawer {
  --flow-run-steps-width: 280px;      /* 步骤树列宽，默认 320px */
  --flow-run-io-input-width: 320px;   /* 进料格宽（FlowRunIo 的），默认与产物等宽 */
}
```

🔴 **为什么给变量而不是让你覆盖类**：组件那条是 `.flow-run-box-steps[data-v-xxx]`，特异度
**(0,2,0)**；消费方写 `:deep(.flow-run-box-steps)` 编译成 `[data-v-消费方] .flow-run-box-steps`，
**也是 (0,2,0)** ⇒ 谁生效取决于两份 CSS 谁后加载，而那取决于宿主 `main.ts` 的 import 顺序 ——
**今天恰好对，换个引入顺序就静默失效，且没有任何东西会报**。变量没有这层特异度赌局。

| 变量 | 作用域 | 默认 | 说明 |
| --- | --- | --- | --- |
| `--flow-run-steps-width` | `.flow-run-box-steps` | `320px`（**默认档封顶容器 50%**） | 步骤树列宽；IO 列吃剩余（仍 `min-width: 0`，长 JSON 不撑破容器） |
| `--flow-run-io-input-width` | `.flow-run-io` 首格 | `minmax(0, 1fr)` | 进料格宽；`ioProps.vertical` 单列时该变量不参与 |

- **默认档在窄容器里自动封顶 50%**：定宽只在宽容器上是对的，窄容器一刀切 320px 会把内容区挤得
  比 1:1 还惨（实测容器 390px 时树列 320 → IO 只剩 58）⇒ 默认档取 `min(定宽, 50%)` 的效果
  （实测 390px 容器 → 195 / 183）。**显式设了变量就按你给的值来**，不替你二次封顶。
- 容器过窄（窄于「定宽 + 间距」）时步骤树列**允许收缩**而非顶出横向滚动（`flex: 0 1 <定宽>`）。
- 可拖拽分隔条**不提供**：拖拽是消费方的交互偏好，要的话在外层自己做，把算出来的宽度写进上面那个变量即可。

## 注意

- 布局为左树右 IO 的横排 flex；列宽走上面的 CSS 变量，纵排等更自由的排布仍可用稳定类钩子
  覆盖：`.flow-run-box-steps`（树列）/ `.flow-run-box-io`（IO 列）——但覆盖类要自己处理特异度。
- IO 面板自身的双栏 / 纵向堆叠走 `ioProps.vertical`。

## 关联

- `FlowRunSteps` / `FlowRunIo`：box 即两者的组合；自由形态直接用两件。
