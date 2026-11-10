# FlowRunSteps（执行步骤树）

> 只读运行轨迹：顺序步 + 并行支（fanout）的树 / 时间线展示。对标观测系 Trace View，**不基于画布引擎**。

## 定位

- 展示「这次跑了哪些步、各自什么状态、花了多久」；**不编排、不可拖拽、不可编辑**
- 🔴 **只画不判断**：`running` 时调用方传「已执行 + 当前」，终态传全量。组件 [MUST NOT] 自行推断哪步在跑——推断会和服务端真相打架
- 选中态经 `v-model:activeKey` 受控，配 `FlowRunIo` 展示当前步的进料 / 输出

## 快速上手（最小可用）

```ts
import { FlowRunSteps, type FlowRunStepNode } from "@done-coding/forge-kit-flow";

const steps: FlowRunStepNode[] = [
  { key: "parse", label: "解析输入", status: "done", durationMs: 820 },
  {
    key: "fanout",
    label: "并行生成",
    status: "done",
    // 🔴 二维：N 条并行支，每支是一串子步
    parallel: [
      [{ key: "gen-a", label: "文案生成", status: "done", durationMs: 4300, replayable: true }],
      [
        { key: "gen-b", label: "配图生成", status: "failed", durationMs: 12010 },
        { key: "retry-b", label: "配图重试", status: "skipped" },
      ],
    ],
  },
  { key: "merge", label: "合并产物", status: "running" },
  { key: "notify", label: "回调通知", status: "pending" },
];
```

```html
<FlowRunSteps
  v-model:activeKey="activeKey"
  :steps="steps"
  @replay="handleReplay"
/>
```

## 三条 [MUST] 记牢的语义

**Ⓐ `parallel` 是二维数组，不是一维。** fanout = 「一步展开成 N 条并行支，每支是一串子步」。拍平成一维会让「三条支各两步」与「六个顺序步」**长得一模一样**——信息丢失且无法回填。

**Ⓑ `durationMs` 无值 = 没量到。** `undefined` / `null` 一律不显示时长，[MUST NOT] 渲染成 `0ms`（`0` 是真的量到了 0 毫秒，照常显示）。

**Ⓒ 状态由调用方给全。** 组件按 `status` 上色与标注，不做状态推导、不做超时判定、不做「上一步 done 则本步 running」这类补全。

**Ⓓ `pending` 只给「计划内、必经」的未执行步。** 三种「未来」性质不同，[MUST NOT] 混用一个词：

| 未来的性质 | 例子 | 表达 |
| --- | --- | --- |
| **计划内必经** | 线性流程 / 已声明 DAG 的主干 | ✅ `pending` |
| **条件可能**（N 选 1，最终只落一个） | if/else 各支 | `branch` 分支组（拿 `parallel` 凑合会被读成「都会跑」） |
| **未知长度** | ReAct / 动态循环，连几步都不知道 | 不渲染未来（尾部留一个 `running` + `openEnded`） |

反例（[MUST NOT]）：ReAct 场景为「看起来完整」预发一串 `pending` 占位步——那是拿确定性冒充未知，与「时长没量到就不显示 `0ms`」违反的是同一条诚实缺省原则。

## 失败详情（`error`）

`status: "failed"` 的步可带失败详情：

```ts
{ key: "image", label: "配图生成", status: "failed", error: { message: "上游超时", detail: "GET /v1/images 504\n…" } }
```

- `message` 行内简讯直接展示；`detail` 折叠，点「详情」展开（长文本区内滚动，不撑爆行高）。
- 🔴 **诚实缺省**：`failed` 但无 `error` → 状态文案显「失败（未提供原因）」，组件 [MUST NOT] 编一句默认错误文案冒充。
- `error` 仅 `status: "failed"` 时有意义，其余状态给了也不渲染。

## 条件分支组（`branch`）

与 `parallel` 同构、**语义相反**——N 条支最终只走 1 条：

```ts
{
  key: "verdict",
  label: "质检判定",
  status: "pending",
  // 判定前：支内不渲染，空支即可（只表支数）；判定后传全量
  branch: [[], []],
}
```

- **宿主步 = 判定本身**：宿主非终态（`pending` / `running`）→ 整组折叠标「N 选 1 · 待定」，支内一律不渲染；宿主终态 → 展开，走的支正常态、未走支各步由调用方落 `skipped`（沿用既有状态，不新增词）。
- 🔴 **渲染与 `parallel` 刻意不同**——并行 = 横排虚线块（读作「都会跑」）；条件 = 纵排实线左缘 + 「N 选 1」badge（读作「只跑一条」）。长一样等于没表达。
- 组件不判定走了哪支：判定结果由调用方用各步 `status` 表达（未走支全 `skipped`）。
- 同一步同时给 `parallel` 与 `branch` 会两组都渲染、语义混乱，[MUST NOT] 这么用。

## 开放式结尾（`openEnded`）

ReAct / 动态循环下工作流长度未知，组件不造假：

```html
<FlowRunSteps :steps="steps" open-ended />
```

- `openEnded` 为真 → 列表末尾渲染省略指示（文案 `openEndedText`，默认「后续步骤未定」）。
- ReAct 用法：只追加**已发生**的步 + 尾部留一个 `running` + `openEnded`；🔴 [MUST NOT] 为「看起来完整」预发一串假 `pending`（见语义Ⓓ）。

## 时间轴（瀑布）档（`startedAt` / `endedAt`）

**渐进增强**：树内存在「起止都给」的步才切档；全树都不给 = 与列表形态一致，零新增 DOM。

- 档位判定：全树（含 `parallel` / `branch` 子步）存在 `startedAt` 与 `endedAt` 均为有限数的步，且总跨度 > 0。
- 几何：以全树 `min(startedAt)` 为原点、`max(endedAt) − origin` 为总跨度，每步 `left% = (startedAt − origin) / total`、`width% = (endedAt − startedAt) / total`；bar 按状态取色，悬停 title 显起止时刻与耗时。
- **步级诚实缺省**：某步缺任一时间戳 → 该步不画 bar（`running` 只有 `startedAt` 也不画——组件不引时钟推算「跑到现在」）。
- 瀑布档下并行支改**纵排**（同深度 track 对齐），支间时间重叠一眼可见——这正是瀑布相对结构框的增量价值。

## 外观（root 自带卡片面）

根容器 `.flow-run-steps` **自带一层卡片面**：底色 `@flow-color-bg`（= 主题的「面」档）+ 12px 呼吸 + 8px 圆角，**无描边、无投影**——层级靠「面 / 底」色差表达（页面底是 `--el-bg-color-page`，比面深一档），与 `FlowRunIo` 的分格卡同一套观感。

- 取色走 `flow-theme.less` 的三级回退（`--dc-core-*` → `--el-*` → 自身兜底），切主题 / 明暗自适配。
- 🔴 **[MUST NOT] 改用 `ElCard` 套一层**：它底读 `--el-fill-color-blank`，是本包取色收口之外的**第四个色来源**，切主题时会与 `@flow-color-bg` 分家（甲方 2026-09-17 已就此裁决）。
- 消费方要改外观（换底 / 去面 / 加描边）：覆盖 `.flow-run-steps` 一个类即可，不必跟组件内部结构较劲。
- **已经在自己的卡片里放本件**的消费方：升级后会看到「卡中卡」（两层面色相同，表现为多一圈 12px 内边距）——按上一条覆盖 `.flow-run-steps { padding: 0; background: transparent; }` 即可回到原观感。

## API

> ⚠️ 以 `types.ts`（`FlowRunStepNode` / `FlowRunStepsProps`）与源码为真相源。

### Props

| name            | type                 | 默认             | 语义                                   |
| --------------- | -------------------- | ---------------- | -------------------------------------- |
| `steps`         | `FlowRunStepNode[]`  | —                | 步骤列表（必传）                       |
| `emptyText`     | `string?`            | `"暂无执行记录"` | 空列表文案                             |
| `replayText`    | `string?`            | `"回放"`         | 回放入口文案（`replayable` 为真时出现） |
| `openEnded`     | `boolean?`           | `false`          | 开放式结尾：末尾渲染「后续步骤未定」省略指示 |
| `openEndedText` | `string?`            | `"后续步骤未定"` | 开放式结尾文案                         |

### v-model

| name             | type        | 语义                                         |
| ---------------- | ----------- | -------------------------------------------- |
| `v-model:activeKey` | `string?` | 选中步骤的 `key`；点击步骤时写回（受控可省） |

### Emits

| name        | payload           | 时机                               |
| ----------- | ----------------- | ---------------------------------- |
| `stepClick` | `FlowRunStepNode` | 点击任一步骤（含并行支内的子步）   |
| `replay`    | `FlowRunStepNode` | 点击步骤上的回放入口（不冒泡选中） |

模板里照常用 kebab 监听：`@step-click="…"`（Vue 自动归一，已经 vue-tsc 实证）。

### FlowRunStepNode

| 字段         | type                     | 语义                                                    |
| ------------ | ------------------------ | ------------------------------------------------------- |
| `key`        | `string`                 | 步骤标识（回放时原样回传；建议 = 节点 id 或业务步骤码） |
| `label`      | `string`                 | 展示名（业务语义步骤名）                                |
| `status`     | `FlowRunStepStatus`      | `done` / `running` / `failed` / `skipped` / `pending`（`pending` 仅限**计划内必经**步，见语义Ⓓ） |
| `durationMs` | `number \| null?`        | 耗时；无值 = 没量到，不显示                             |
| `replayable` | `boolean?`               | 为真时该步出现回放入口                                  |
| `error`      | `FlowRunStepError?`      | 失败详情（`message` 简讯 + `detail?` 可展开）；仅 `failed` 时有意义。`undefined` = 没取到 → 显「失败（未提供原因）」 |
| `startedAt`  | `number?`                | 开始时间戳（ms）；与 `endedAt` 都给才画瀑布条         |
| `endedAt`    | `number?`                | 结束时间戳（ms）；缺任一 → 该步不画 bar（不引时钟推算） |
| `parallel`   | `FlowRunStepNode[][]?`   | fanout 分支组：**每个元素是一条并行支**，支内为一串子步 |
| `branch`     | `FlowRunStepNode[][]?`   | 条件分支组：与 `parallel` 同构、语义相反（N 选 1）；宿主步 = 判定本身 |

## 注意

- `key` 在整棵树内应唯一（选中态按 `key` 比对）；重复 key 会让多步同时高亮
- 并行支内的子步可再带 `parallel`，递归无深度限制（但 ≥3 层时横向空间会紧张，建议业务侧先聚合）
- 分支组横向排布，容器窄时自动换行成多行——每支仍是独立虚线块 + 「支 N」标题，与顺序步不会混淆
- 组件不滚动定位到 `running` 步——需要时应用层自行 `scrollIntoView`（属应用层交互偏好）
- 瀑布 bar 的横轴随嵌套深度有缩进偏移（缩进本身是结构信息）；**同深度 track 天然对齐**，并行支间的时间对比以同深度为准

## 时间线（连接线）

每个步骤项用 `::before` 画一段竖线、同层相邻首尾相接、末项只画到圆点；
**嵌套子列表是新的 `<ol>`、天然自成一条** ⇒ 父子层级各连各的。

- 取色走 `flow-theme.less` 的 **`@flow-color-line`**（placeholder 档，亮色 ≈2.2:1）。
  🔴 [MUST NOT] 复用 `@flow-color-border`：边框档在白底实测只有 **1.33:1**，
  线画了等于没画（甲方看业务截图提「点要连起来」，实测线本来就有、只是看不见）。
- 🔴 [MUST NOT] 因「看不见」去**重做结构**：现有实现就是甲方要的「层级各连各的」，改只会弄坏。
- 🔴 [MUST NOT] 改用 `ElSteps`：它是**扁平** step 列表、不支持树，而本组件数据是树
  （`parallel` / `branch` / children）；且其连接线画在相邻 step 之间，嵌套渲染会断在错误的地方。
- 圆点 11px、线在 `left: 5px`，两者已同轴 ⇒ 调深后自然呈现「点串在线上」，**不用动几何**。

## 关联

- `FlowRunIo`：展示当前选中步的进料 / 输出，常与本件左右并排
