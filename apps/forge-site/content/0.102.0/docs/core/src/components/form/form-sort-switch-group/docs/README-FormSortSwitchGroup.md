# FormSortSwitchGroup（复合排序组）& FormSortSwitch（单字段排序切换器）

> 两组件分工：**`FormSortSwitch`** = 单字段排序切换器（纯状态/展示件，v-model = 方向值 `"asc" | "desc" | undefined`，**无 key——不知道自己的字段**）；**`FormSortSwitchGroup`** = 多字段容器（**key 视角在 group**，v-model = 有序 `FormSortRule[]`，依赖 Switch 组装）。交互 `mode` 双模式；`shadowClone` 影分身（per-option `teleportTo`）；`textType` 展示文本模式（label / 状态文字）。
> 范式页：`apps/reference/src/pages/form/sort/showcase/`（FormMain 配置化接入 + 影分身 + 两模式对照）。

## 定位

- **复合排序表单元素**：FormMain / FormSearch 配置化接入（`render: FormSortSwitchGroup`），序列化交给消费方 `stringify`（如 `field:dir` 逗号复合串）
- **单字段排序开关**：直接裸用 `FormSortSwitch`（v-model 绑方向值，无需关心字段身份）
- **何时不用**：单字段单选排序（后端单 key 排序）用 ElSelect / 原生排序即可

## 快速上手（最小可用）

```html
<FormSortSwitchGroup :options="options" v-model="sortRules" />
```

**要点**：

- `options` 业务注入（`{ field, label }[]`，条目可带非必传 `teleportTo`）——**组件不内置业务字段**
- Group v-model 协议 = 有序 `FormSortRule[]`（`{ field, dir: "asc" | "desc" }`，顺序即优先级）；空数组 = 无排序
- FormMain 接入时 `stringify` 序列化（如 `list.map(r => `${r.field}:${r.dir}`).join(",")`）；表单模型持有数组
- 状态全外置（v-model），组件零内部状态 → 可安全影分身双渲染
- **默认 `mode: "cycle"`**（首击升序，对齐主流）——零配置即主流交互

## 组件分工（Switch / Group）

|                    | `FormSortSwitch`                                                      | `FormSortSwitchGroup`                                               |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 职责               | 单字段 chip：方向状态 + 交互 + 展示（label / 状态文字）               | 多字段容器：options 拆包 → N 个 Switch + 按 field 重组 v-model 数组 |
| v-model            | 方向值 `"asc" \| "desc" \| undefined`（**无 key**，默认 `undefined`） | 有序 `FormSortRule[]`（**有 key**，顺序即优先级）                   |
| 是否知道自己的字段 | **不知道**（直接作表单元素无需知道；作 group 的 item 由 group 知道）  | 知道（key 视角持有者）                                              |
| 内部状态           | 零（状态全外置）                                                      | 零（组装逻辑纯派生）                                                |

## 交互模式（mode）

| mode           | 默认 | 交互语义                                                                                                                                                          | 适用                                                           |
| -------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `"cycle"`      | ✅   | **点击整块三态循环**：`undefined → 升序 → 降序 → 取消`（循环往复）。**首击升序对齐主流**（Ant / Element Plus / MUI / Syncfusion 均为 asc first）                  | 默认全覆盖；与主流表头排序交互同构，EP 生态用户零学习成本      |
| `"dual-arrow"` | —    | **上下双三角独立点击**：点 ↑ = 升序（升序态再点 = 取消）、点 ↓ = 降序（降序态再点 = 取消）；方向互斥切换（激活一侧时点另一侧切向，优先级不动）；点击 label 不触发 | 多字段复合排序、操作者需要「点一次即确定方向」的确定性交互场景 |

**cycle 状态转换表（核心机制）**：每次点击 = `NEXT[当前值]` 查表取下一个，**绝不依赖点击次数 / 历史推断**——状态可能被外部（影分身另一处操作 / 双向 v-model 同步）改写，计数推断会失配：

```ts
const NEXT = {
  undefined: "asc", // 首击升序
  asc: "desc",
  desc: undefined, // 取消
};
```

例：cycle 点击第一下 = 升序；此时影分身（dual-arrow）关闭了升序（状态回 `undefined`）；cycle 再点一下 = **仍从 `undefined` 出发 = 升序**（非计数推断的 desc）。

- 两模式 **v-model 协议完全一致**（方向值 / 规则数组），模式纯属 UI 交互层——切换 mode 对数据零影响、零迁移成本
- **模式视觉辨识**（一眼可判当前交互）：dual-arrow 三角默认**中灰**（WCAG 1.4.11 对比度 ≥3:1 达标 + 「可点」信号）+ hover primary + 激活点亮对应三角；cycle 三角保持 placeholder 浅灰纯指示（整块 hover 变色是它的辨识信号）——两模式视觉语言分离
- 三角尺寸 12px（对齐 [Fluent UI 排序箭头规格](https://github.com/microsoft/fluentui/issues/25706)）+ 伪元素透明热区扩展（命中面 > 视觉图标）
- 激活视觉两模式一致：chip primary 高亮 + 优先级序号 + 方向指示（cycle 整块点亮、dual-arrow 点亮对应三角）

## 展示文本模式（textType）

chip 上的文本内容两选：

| textType  | 默认 | 展示内容                                                   | 适用                                               |
| --------- | ---- | ---------------------------------------------------------- | -------------------------------------------------- |
| `"state"` | ✅   | 状态文字：「**默认**」（未排序）/「**升序**」/「**降序**」 | 独立作为表单元素（自身即状态展示）；`label` 可不传 |
| `"label"` | —    | 字段名（options 的 label）                                 | **group 的 item 即此模式**（group 显式设置）       |

## 影分身（shadowClone，能力内聚在 FormSortSwitch）

- **影分身是控件级通用能力，内聚在 `FormSortSwitch`**：任何排序开关（独立或 group 的 item）都可自带分身——`shadowClone` 开关 + `teleportTo` 目标 + `teleportMode` 分身交互模式
- **group 纯编排**：`shadowClone` 总开关 + `teleportMode` 透传 + **`FormSortOption` 条目级 `teleportTo`**（非必传）透传——配置了目标的条目分身到该目标（ShadowClone 双处渲染、**同一 model 同源同步**，操作任一处同步）；**未配置 `teleportTo` 的条目不分身**（仅本体渲染）
- `teleportTo` 目标不限于表头，看指向哪个元素（`string \| Element`）；表格体系可按列头容器逐列配置
- **分身位交互模式独立于本体**：`teleportMode`（默认 `"dual-arrow"` = 点小箭头升/降序）；数据与本体同一 v-model，仅交互模式不同
- 目标晚渲染（表头容器在表单下方）无需手控：ShadowClone 内置 MutationObserver 等待目标出现后自动激活分身（「合适的时机打出去」）
- 优先级序号：chip 内右置小号 primary 数字（克制样式——不悬浮溢出 chip 外）

## 依赖关系

- **依赖**：display 族 `ShadowClone`（影分身机制，经 `FormSortSwitch` 内聚使用）——form 族 → display 族单向依赖
- 内部组装：`FormSortSwitchGroup` 依赖 `FormSortSwitch`（同族基础件，对外导出、可独立使用）

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### FormSortSwitchGroup（复合排序组）

#### Props

| name           | type                      | 默认           | 必填 | 语义                                                                                           |
| -------------- | ------------------------- | -------------- | ---- | ---------------------------------------------------------------------------------------------- |
| `options`      | `FormSortOption[]`        | —              | ✅   | 排序字段选项（`{ field, label, teleportTo? }[]`，业务注入；`teleportTo` 为影分身目标，非必传） |
| `modelValue`   | `FormSortRule[]`          | `[]`           | —    | 有序排序规则（v-model，顺序即优先级）                                                          |
| `mode`         | `"cycle" \| "dual-arrow"` | `"cycle"`      | —    | 本体 item 交互模式                                                                             |
| `shadowClone`  | `boolean`                 | `false`        | —    | 影分身开关（配置了 `teleportTo` 的条目分身到目标，同 model 同源同步）                          |
| `teleportMode` | `"cycle" \| "dual-arrow"` | `"dual-arrow"` | —    | 分身 item 交互模式（独立于本体；默认点小箭头升/降序）                                          |

#### Emits

| name                | 载荷             | 语义                                                            |
| ------------------- | ---------------- | --------------------------------------------------------------- |
| `update:modelValue` | `FormSortRule[]` | v-model 上抛（item 激活 / 切向 / 取消 → 按 field 重组后新数组） |

#### Slots / Expose

无（状态全外置，组装逻辑纯派生）。

### FormSortSwitch（单字段排序切换器）

#### Props

| name           | type                           | 默认           | 必填                  | 语义                                                                                  |
| -------------- | ------------------------------ | -------------- | --------------------- | ------------------------------------------------------------------------------------- |
| `modelValue`   | `"asc" \| "desc" \| undefined` | `undefined`    | —                     | v-model 方向值（三态：undefined=默认无排序 / asc / desc；**默认 undefined 非 null**） |
| `mode`         | `"cycle" \| "dual-arrow"`      | `"cycle"`      | —                     | 交互模式                                                                              |
| `textType`     | `"label" \| "state"`           | `"state"`      | —                     | 展示文本（state=「默认/升序/降序」状态文字 / label=字段名）                           |
| `label`        | `string`                       | —              | 仅 `textType="label"` | 字段显示名（state 模式可不传）                                                        |
| `showOrder`    | `boolean`                      | `false`        | —                     | 是否显示优先级序号（group 在 options>1 时传 true）                                    |
| `order`        | `number`                       | —              | —                     | 优先级序号值（1-based，`showOrder` 时显示）                                           |
| `shadowClone`  | `boolean`                      | `false`        | —                     | 影分身开关（本体就地 + 分身 teleport 到 `teleportTo`，同一 v-model 同源同步）         |
| `teleportTo`   | `string \| Element`            | —              | `shadowClone` 时      | 分身目标容器（未配置不分身）                                                          |
| `teleportMode` | `"cycle" \| "dual-arrow"`      | `"dual-arrow"` | —                     | 分身位交互模式（独立于本体 mode）                                                     |

#### Emits

| name                | 载荷                           | 语义                                                                     |
| ------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| `update:modelValue` | `"asc" \| "desc" \| undefined` | v-model 上抛（cycle 查 NEXT 表 / dual-arrow 方向两态；`undefined`=取消） |

#### Slots / Expose

无（状态全外置，零内部状态 → 可安全影分身双渲染）。

> 目录迁移：实现与配套收纳到 `components/form/form-sort-switch-group`，包根 API 与演示能力保持。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-form`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
