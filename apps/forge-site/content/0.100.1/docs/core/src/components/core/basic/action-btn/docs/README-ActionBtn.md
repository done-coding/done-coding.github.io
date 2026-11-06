# ActionBtn（确认闸门按钮）

> ElButton 超集：透传全部 ElButton props + 确认闸门（popconfirm / messageConfirm）+ beforeOpen 异步预取 + click handler 返 Promise 自动 loading + 重复点击防抖。
> 范式页：`apps/reference/src/pages/basic/action-btn/showcase/`

## 定位

- **何时用**：配置化体系下的**默认按钮原语**——需要 confirm / loading 中的任意能力，或按体系规则 11 替代 ElButton
- **何时不用**：表格操作列 / 堆按钮用 `ActionBtnGroup`（配置驱动）；`loading` 对外不可设置，[MUST NOT] 自管 submitting ref + :loading
- 内部：`confirmMode="messageConfirm"` 内嵌 ConfirmModal 居中模态；`"popconfirm"` 走 ElPopover

## 快速上手（最小可用）

普通按钮 + 异步 onClick 自动 loading——零配置即带 loading 与重复点击防抖：

```html
<ActionBtn type="danger" @click="handleDelete">删除</ActionBtn>
```

```ts
const handleDelete = async () => {
  await deleteUserApi(row.id); // 返回 Promise → 自动 loading
  ElMessage.success("已删除");
};
```

**要点**：

- 提交类按钮让 onClick 返回 Promise（async）即自动 loading——[MUST NOT] 自管 `submitting` ref + `:loading`（留着是死 prop）
- `@click` 归 emits 不进 $attrs（防绕过闸门），由组件在确认通过后手动触发

## 能力边界 / 按需使用

- **确认闸门（`confirmConfig`）：默认无=普通按钮直通 click。** 仅当操作需要确认（删除 / 归档 / 批量操作等不可逆）才配；函数形态 `(data: T) => config` 仅当确认文案依赖点击时预取的数据时用（data 来自 `beforeOpen` 返回值，无 beforeOpen 时 T 默认 void、data=undefined）。
- **`confirmMode`：默认 `"popconfirm"`（ElPopover 就近轻确认）即够用**；`"messageConfirm"`（内嵌 ConfirmModal 居中模态、强阻断）仅当操作风险高、需醒目居中确认时选。
- **`beforeOpen`（异步预取）：默认不用。** 仅当确认内容需要点击时动态取数（如先取详情再拼删除文案）才配；reject 静默退出（不弹层不触发 click），调用方 [MUST] 内部 catch 反馈；⚠️ 与 confirmConfig 均消耗瞬时用户激活窗口，handler 内 [MUST NOT] 调 window.open / navigator.clipboard 等。
- **自动 loading 与重复点击防抖：默认即带。** onClick 返 Promise 自动 loading，innerLoading / confirmVisible 置位时自动吞重复点击——无需任何配置。
- **完整能力演示**（beforeOpen 预取 + 函数 confirmConfig + 动态删除各场景）：`apps/reference/src/pages/basic/action-btn/showcase/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（泛型 `T` = beforeOpen 返回类型）

| name                | type                                                               | 默认                | 语义                                                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 全部 ElButton props | 透传                                                               | type 默认 "default" | size/plain/bg/link/round/circle/color/dark/disabled/autofocus/nativeType/autoInsertSpace/tag/icon/loadingIcon 显式 pick 透传 + attrs 叠加                                                                                           |
| `loading`           | ❌ 被 Omit                                                         | —                   | 对外不可设置，内部独占 innerLoading（对接异步 confirm / beforeOpen / click handler）                                                                                                                                                |
| `confirmMode`       | `ActionConfirmMode?`                                               | `"popconfirm"`      | "popconfirm"\|"messageConfirm"（后者内嵌 ConfirmModal 居中模态）                                                                                                                                                                    |
| `confirmConfig`     | `ActionBtnConfirmConfig \| ((data: T) => ActionBtnConfirmConfig)?` | 无=普通按钮         | 确认闸门；函数形态入参 data 来自 beforeOpen 返回值                                                                                                                                                                                  |
| `badgeKey`          | `string?`                                                          | 无=不显徽标         | 徽标键；命中 `bridge.badge` 注册表则在按钮内容右侧渲染绝对定位角标（不压字，且**不改变按钮尺寸**）。按钮无 path，[MUST] 显式给键。契约见 bridge 文档 · 徽标注册表                           |
| `beforeOpen`        | `() => Promise<T>?`                                                | —                   | 点击后、弹层前异步预取；reject 静默退出（不弹层不触发 click，调用方 [MUST] 内部 catch 反馈）；期间按钮 loading。⚠️ confirmConfig/beforeOpen 均会消耗瞬时用户激活窗口，之后 handler [MUST NOT] 调 window.open/navigator.clipboard 等 |

`ActionBtnConfirmConfig`：`title?` / `content?`（`ActionConfirmTextResolver` = string | (() => string | VNode[])）、`confirmText?`（默认「确定」）、`cancelText?`（默认「取消」）、`type?: ButtonProps["type"]`

### Emits

| 事件    | 载荷         | 语义                                                                                 |
| ------- | ------------ | ------------------------------------------------------------------------------------ |
| `click` | `MouseEvent` | 显式声明——父层 @click 归 emits 不进 $attrs（防绕过闸门）；由组件在确认通过后手动触发 |

### Slots

| 槽         | scope | 语义     |
| ---------- | ----- | -------- |
| `#default` | 无    | 按钮内容 |

### Expose

无（`inheritAttrs: false`）

## 反模式 / 注意

- **自管 loading**：[MUST NOT] 自管 submitting ref + `:loading`——onClick 返 Promise 即自动 loading，外部 `:loading` 被忽略
- **beforeOpen reject 反馈**：reject 静默退出，调用方 [MUST] 内部 catch 做错误反馈（如 ElMessage.error）
- **用户激活窗口**：confirmConfig / beforeOpen 消耗瞬时用户激活窗口，handler 内 [MUST NOT] 调 window.open / navigator.clipboard 等（被浏览器拦截）
- **无闸门语义**：confirmConfig 不传 = 普通按钮直通 click——需确认的操作 [MUST] 配 confirmConfig
- **重复点击**：innerLoading || confirmVisible 置位时吞掉重复点击（防抖），无需外部再防

## 关联

- 上游：`ActionConfirm`（popconfirm / messageConfirm 两种确认弹层）
- 下游：`ActionBtnGroup`（表格操作列 / 堆按钮配置驱动）
- 体系规则：规则 11（配置化体系按钮默认 ActionBtn 替代 ElButton）
- 范式页：`apps/reference/src/pages/basic/action-btn/showcase/`

## 内部分层（30mf7k / 3a7k03）

确认闸门经 display/confirm 消费 ActionConfirm，再单向调用 modal/confirm 的 ModalConfirm；不关联表单弹层。

本次仅调整内部引用，组件位置、props、插槽、行为与样式不变；浏览器回归由复核者执行。

> 目录迁移：本组件及配套归入 `components/basic/action-btn`；仅源码位置变化，包根导入、props、slots 与实例契约保持。

## bridge 事件（v0.35.0）

新增可选 `groupMeta: BridgeEventGroupMeta`，字段 `key?: string | number`、`index?: number`、`rowKey?: string | number`；可附加自定义字段。

| 事件          | 时机                                            | 载荷                                  |
| ------------- | ----------------------------------------------- | ------------------------------------- |
| action-click  | 有 groupMeta，重复点击守卫通过后、beforeOpen 前 | `{...groupMeta,type}`                 |
| confirm-open  | 确认配置解析成功、show 进入 true                | `{...groupMeta,type,title?,content?}` |
| confirm-close | 确认回调成功（含自卸载），或取消关闭            | `{...groupMeta,type,confirmed}`       |

裸按钮不发 action-click；disabled/loading 拦截无点击事件；beforeOpen 拒绝不发 open/close；取消关闭 confirmed=false；提交失败且弹层未关不发 close。确认 type 优先取 confirmConfig.type。文案不额外求值。不改变原回调、参数及错误行为。完整演示：`/other/integration/event-bus`。

### 确认操作移除按钮

确认业务成功导致按钮/所在行/宿主卸载时，仍报告一次 `confirm-close {confirmed:true}`，顺序为 `confirm-open → 业务事件 → confirm-close`。成功结果来自已开始的确认回调结算，不依赖卸载后 Vue emit；普通确认与取消仍各关闭一次。业务抛错或 Promise reject 不报告成功关闭；单纯卸载不推断为取消。载荷仍惰性求值，未订阅且镜像关闭时不调用 thunk，不为补报增加监听、watch 或定时器。
