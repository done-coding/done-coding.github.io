# ActionConfirm（独立确认弹层）

> 独立确认弹层：popconfirm（ElPopover 宽 240）或 messageConfirm（内嵌 ConfirmModal 居中模态）两种模式，submitFn 返 Promise → 确认按钮 loading + 弹层不关，仅 fulfill 才关闭。
> 范式页：`apps/reference/src/pages/basic/action-btn/showcase/`（场景 12 独立用法）

## 定位

- **何时用**：需要外部独立控制确认弹层显隐（`v-model:show`）的场景——ActionBtn 的确认闸门底层即本组件
- **何时不用**：按钮确认直接走 `ActionBtn` 的 `confirmConfig`（本组件已内嵌，无需手动组合）
- 触发元素由 `#default` 槽提供；弹层显隐由外部 `v-model:show` 控制

## 快速上手（最小可用）

独立用法（`action-btn/showcase/Index.vue` 场景 12）：

```html
<ActionConfirm
  v-model:show="standaloneVisible"
  mode="popconfirm"
  title="..."
  content="..."
  type="danger"
  :submit-fn="standaloneSubmit"
>
  <!-- 触发元素由默认 slot 提供 -->
</ActionConfirm>
```

**要点**：

- submitFn 返 Promise → 确认按钮 loading + 弹层不关，仅 fulfill 才关闭；reject/throw 保持打开（错误由 submitFn 内部 catch 反馈）
- 弹层关闭（确认或取消）都会 emit `close(confirmed: boolean)`
- messageConfirm 模式 show=true→true 重入安全

## 能力边界 / 按需使用

- **`mode` 两种形态判据（必填）**：`"popconfirm"`（ElPopover 宽 240、就近轻确认）为常规推荐；`"messageConfirm"`（内嵌 ConfirmModal 居中模态、强阻断 + 自定义弹层）仅当操作风险高、需醒目居中确认时选。
- **`submitFn` 返 Promise：所有确认场景建议返 Promise**——确认按钮自动 loading + 弹层不关、仅 fulfill 才关闭（防重复提交）；reject/throw 保持打开，错误在 submitFn 内部 catch 反馈。
- **`v-model:show` 外部控制：仅独立弹层场景需要。** 按钮确认一律走 `ActionBtn` 的 `confirmConfig`（本组件已内嵌，无需手动组合）；仅当弹层显隐由外部业务逻辑独立驱动（非按钮触发）时才直用本组件。
- **触发元素由 `#default` 槽提供**：[MUST NOT] 留空（弹层无内置触发点）。
- **完整能力演示**（独立用法）：`apps/reference/src/pages/basic/action-btn/showcase/` 场景 12——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name                | type                                       | 默认     | 语义                                                                          |
| ------------------- | ------------------------------------------ | -------- | ----------------------------------------------------------------------------- |
| `mode`              | `"popconfirm" \| "messageConfirm"`（必填） | —        | 弹层形态（popconfirm = ElPopover 宽 240；messageConfirm = 内嵌 ConfirmModal） |
| `title` / `content` | 同 ActionBtnConfirmConfig                  | —        | 标题 / 内容文本                                                               |
| `confirmText`       | `string?`                                  | 「确定」 | 确认按钮文案                                                                  |
| `cancelText`        | `string?`                                  | 「取消」 | 取消按钮文案                                                                  |
| `type`              | `ButtonProps["type"]?`                     | —        | 按钮类型（如 danger）                                                         |
| `submitFn`          | `() => void \| Promise<void>`（必填）      | —        | 确认提交逻辑                                                                  |

**v-model**：`show`（`v-model:show`，默认 false）

### Emits

| 事件    | 载荷                 | 语义                               |
| ------- | -------------------- | ---------------------------------- |
| `close` | `confirmed: boolean` | 弹层关闭（确认 true / 取消 false） |

### Slots

| 槽         | scope | 语义     |
| ---------- | ----- | -------- |
| `#default` | 无    | 触发元素 |

### Expose

无

## 反模式 / 注意

- **submitFn 吞错误再 resolve**：[MUST NOT] 把失败当成功关闭弹层——reject/throw 保持打开，错误在 submitFn 内部 catch 反馈（如 ElMessage.error）
- **默认槽留空**：popconfirm 触发元素由默认槽提供，[MUST NOT] 留空

## 关联

- 内部组件：`ConfirmModal`（messageConfirm 模式）
- 上游：`ActionBtn`（confirmConfig 内部即本组件）
- 范式页：`apps/reference/src/pages/basic/action-btn/showcase/`（场景 12）

## 内部分层（30mf7k / 3a7k03）

ActionConfirm 经 `display/confirm` 内部桶转出，只依赖 `modal/confirm` 的 ModalConfirm；两者同属 core（L1），不经 modal 聚合入口加载表单组合。

本次仅调整内部引用，组件位置、props、插槽、行为与样式不变；浏览器回归由复核者执行。

> 目录迁移：本组件及配套归入 `components/feedback/action-confirm`；仅源码位置变化，包根导入、props、slots 与实例契约保持。
