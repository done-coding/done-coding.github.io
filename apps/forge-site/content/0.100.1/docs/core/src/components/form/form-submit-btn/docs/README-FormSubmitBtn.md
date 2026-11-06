# FormSubmitBtn（提交按钮）

> 挂 FormMain 实例的提交按钮：内置「validate → stringify → submitFn → 按钮 loading」管线。
> 范式页：`apps/reference/src/pages/form/submit-btn/showcase/`；FormSubmitPanel 内置场景见 `apps/reference/src/pages/form/submit-panel/showcase/`

## 定位

- **何时用**：已有 FormMain 实例，需要一个提交按钮且不想自管「校验 → 序列化 → 提交 → loading」管线
- **何时不用**：提交 + 取消 / 重置 + 面板壳用 `FormSubmitPanel`（内部即内置本组件，经 `submitBtnProps` 定制）；无表单实例的普通按钮用 `ActionBtn`
- 提交 loading 由管线内置管理（`loading` 已从透传面 Omit）

## 快速上手（最小可用）

最小骨架（仅用必填 / 默认项，管线内部完成）：

```html
<FormSubmitBtn
  :formMainInstance="formMain"
  :submitFn="submitFn"
  submitText="保存"
  @success="onSuccess"
  @fail="onFail"
/>
```

**要点**：

- `formMainInstance` 传入 FormMain 的 ref 实例——管线在内部调 `validate()` / `stringify()`，消费方零接线
- `submitFn` 收 `stringifyData` 返回 Promise：resolve → `@success(stringifyData)`；reject → `@fail(error)`；在途按钮自动 loading
- `onSubmitStart()` 可在提交发起时同步回调（如弹层整体 loading 态）

## 能力边界 / 按需使用

- **默认即够用：`formMainInstance` + `submitFn` 即为完整提交按钮**（validate → stringify → submitFn → 按钮 loading 管线全内置）；`submitText` 默认 `"提交"`。
- `onSubmitStart`：默认不设；仅当需要在提交发起时同步做外部动作（如弹层整体 loading 态）才设。
- 其余 ButtonProps：`type` 默认 `"primary"` 即够用；仅当需要按钮视觉定制（size / 样式）才传（`loading` 除外，由管线接管）。
- **完整能力演示**：`apps/reference/src/pages/form/submit-btn/showcase/`；FormSubmitPanel 内置场景见 `apps/reference/src/pages/form/submit-panel/showcase/`。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（`FormSubmitBtnProps` = `Omit<ButtonProps, "loading">` + 以下）

| name               | type                                          | 默认                    | 语义                                                      |
| ------------------ | --------------------------------------------- | ----------------------- | --------------------------------------------------------- |
| `formMainInstance` | `FormMainInstance`（必填）                    | —                       | 提交所挂的 FormMain 实例（管线内调 validate / stringify） |
| `submitFn`         | `(stringifyData) => Promise<unknown>`（必填） | —                       | 提交方法                                                  |
| `submitText`       | `string`                                      | `"提交"`                | 按钮文本                                                  |
| `onSubmitStart`    | `() => void`                                  | 未设                    | 提交发起时同步回调                                        |
| 其余               | `Omit<ButtonProps, "loading">`                | `type` 默认 `"primary"` | ElButton 全量透传（loading 除外，由管线接管）             |

### Emits

| 事件      | 载荷            | 语义             |
| --------- | --------------- | ---------------- |
| `success` | `stringifyData` | submitFn resolve |
| `fail`    | `error`         | submitFn reject  |

### Slots / Expose

无。

## 反模式 / 注意

- **自管 loading**：按钮 loading 由管线内置（`loading` 已从透传面 Omit）——[MUST NOT] 外部再传 `:loading` 或自建 submitting 状态
- **脱离表单实例使用**：`formMainInstance` 必填，未接实例时管线无处校验 / 序列化——裸用无意义
- **管线顺序固定**：validate → stringify → submitFn；校验失败即停，不发 submitFn

## 关联

- 内置进 `FormSubmitPanel`（经 `submitBtnProps` 定制，勿重复外挂）
- 按钮原语：`ActionBtn`（display 桶，confirm / loading 超集）——无表单实例的按钮走 ActionBtn
- 类型：`FormMainInstance<PO, SO>`（FormMain expose 类型）
- 范式页：`apps/reference/src/pages/form/submit-btn/showcase/`、`pages/form/submit-panel/showcase/`

> 目录迁移：实现与配套收纳到 `components/form/form-submit-btn`，包根 API 与演示能力保持。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-form`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
