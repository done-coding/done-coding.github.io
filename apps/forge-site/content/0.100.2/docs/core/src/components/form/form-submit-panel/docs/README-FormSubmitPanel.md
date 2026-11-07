# FormSubmitPanel（提交表单面板）

> FormMain 的提交面：`stringifyData` 作初值 + 内置「校验 → 序列化 → 提交」管线 + 取消 / 重置 / 提交操作区（可插槽替换），success / fail / parseDataChange 三事件闭环。
> 范式页：`apps/reference/src/pages/form/submit-panel/showcase/`

## 定位

- **空间一等公民**：纯表单提交空间首选（表单页 / 弹窗内表单）——业务层能用 FormMain 处用 FormSubmitPanel 替代
- **何时用**：录入 / 编辑弹窗或页面的表单主体——需要完整提交管线 + 操作区
- **何时不用**：纯查询 / 搜索用 `FormSearch`；仅录入无提交操作区用 `FormMain`；只要一个提交按钮（无面板壳）用 `FormSubmitBtn` 挂 FormMain
- 与 FormMain 的差异：`data` 被 Omit——表单值由 `stringifyData` 初值内部管理（优先 `parseFormData` 回填，否则 `generateFormData` 初始化），消费方不持有 data
- 内置组合：`FormSubmitBtn`（提交按钮，validate → stringify → submitFn → loading 管线）；`inheritAttrs: false`，attrs 转发内层 FormMain

## 快速上手（最小可用）

单面板最小形态（list + stringifyData 回填 + submitFn + 成功 / 失败回调即完整）：

```html
<FormSubmitPanel
  :list="list"
  :stringifyData="seed"
  :submitFn="submitFn"
  @success="onSuccess"
  @fail="onFail"
/>
```

**要点**：

- `submitFn` 收 `stringifyData` 返回 Promise——提交成功后 `@success` 直接透传同一 `stringifyData` 载荷（新增 / 编辑区分由消费方按上下文定）
- `stringifyData` 作初值：回填数据直接给序列化形态，面板内部消化解析 / 初始化（不传则 `generateFormData(list)` 初始化）
- 校验 → 序列化 → 提交 → loading 管线内置，消费方零接线；`@parse-data-change` 回传内部解析模型（如 reset 后），供外部联动

## 能力边界 / 按需使用

- **默认即够用：`list` + `submitFn` + `@success` / `@fail` 即为完整提交面板**（无回填时 `stringifyData` 可省，内部 `generateFormData` 初始化）。
- `cancelBtn` / `resetBtn`：默认未设 = 不展示；仅当需要取消 / 重置操作才设按钮文字（按钮顺序固定：取消 → 重置 → 提交）。
- `operationPosition`：默认 `bottom-center` 即够用；仅当面板布局需要（如页内表单放右下）才改。
- `operationAffix`：默认关；仅当长表单提交区需要吸底固定才开（`true`=吸底 `position: "bottom"`，对象=ElAffix 原样透传）。
- `submitBtnProps`：默认 primary 即够用；仅当需改提交按钮形态（size / 其他 ButtonProps）才设。
- `#cancelBtn` / `#resetBtn` / `#submitBtn` 三插槽：默认关；仅当按钮需完全自定义时开（`#submitBtn` 接内置校验 + 序列化 + 提交管线）。
- `divider` / `bare` / `rootClass`：默认即够用；仅当面板视觉定制（去分割线 / 去内边距 / 根类定向）才动。
- **完整能力演示**（操作区三态 + 插槽替换 + 图钉）：`apps/reference/src/pages/form/submit-panel/showcase/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（泛型 `PO` 解析 / `SO` 格式化，`FormSubmitPanelProps<PO, SO>` = `Omit<FormMainProps, "data">` + 提交相关）

| name                        | type                                                                         | 默认              | 语义                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| `list`                      | `FormItemConfigList`（必填）                                                 | —                 | 透传 FormMain                                                                                   |
| `layout`                    | `Partial<ColProps>`                                                          | `{span: 24}`      | 透传（默认单列）                                                                                |
| `rowGutter` / `layoutScale` | 同 FormMain                                                                  | —                 | 已声明 prop 不入 attrs 且未显式转发——**实际被丢弃**（layoutScale / layoutByContainer 均不生效） |
| `stringifyData`             | `ExcludeNeverProperties<ExtractFormStringifyRawFromObject<PO, SO>>`          | 未设              | 序列化数据作初值（优先 `parseFormData` 回填，否则 `generateFormData` 初始化）                   |
| `submitText`                | `string`                                                                     | 未设              | 提交按钮文本                                                                                    |
| `submitFn`                  | `(stringifyData) => Promise<unknown>`（必填）                                | —                 | 提交方法                                                                                        |
| `submitBtnProps`            | `Omit<FormSubmitBtnProps, "submitText" \| "submitFn" \| "formMainInstance">` | 未设              | 内置 FormSubmitBtn 的额外 ButtonProps（如 `{ type: 'primary' }`）                               |
| `labelPosition`             | `"right" \| "left" \| "top"`                                                 | `"right"`         | 标签位置                                                                                        |
| `labelWidth`                | `string`                                                                     | `"auto"`          | 标签宽度                                                                                        |
| `cancelBtn`                 | `string`                                                                     | 未设              | 取消按钮文字（空则不展示；同名插槽优先）                                                        |
| `resetBtn`                  | `string`                                                                     | 未设              | 重置按钮文字（警告色；同名插槽优先）                                                            |
| `operationPosition`         | `"bottom-center" \| "bottom-right" \| "top-right"`                           | `"bottom-center"` | 操作区位置                                                                                      |
| `operationAffix`            | `boolean \| AffixProps`                                                      | `false`           | 操作区图钉（`true`=吸底 `position: "bottom"`；对象=原样透传 ElAffix）                           |
| `divider`                   | `boolean`                                                                    | `true`            | 操作区分隔线 + 圆角                                                                             |
| `bare`                      | `boolean`                                                                    | `false`           | 去操作区内边距（与 divider 正交）                                                               |
| `rootClass`                 | `string \| string[] \| Record<string, boolean>`                              | 未设              | 根面板自定义 class（`inheritAttrs: false` 下 class 会透传内层 FormMain，本 prop 是显式根出口）  |

### Emits

| 事件              | 载荷                            | 语义                                                                |
| ----------------- | ------------------------------- | ------------------------------------------------------------------- |
| `cancel`          | —                               | 取消触发                                                            |
| `fail`            | `error: any`                    | 提交失败（submitFn reject）                                         |
| `success`         | `FormDataInfo["stringifyData"]` | 提交成功（submitFn resolve，透传 stringifyData 载荷）               |
| `parseDataChange` | `PO`                            | 内部 parseData 变化（reset 只内部 set parseData，经此事件通知外部） |

### Slots

| 槽              | scope                    | 语义                                                         |
| --------------- | ------------------------ | ------------------------------------------------------------ |
| `#cancelBtn`    | `{ cancel }`             | 替换取消按钮（cancelBtn 为空时也可经此插自定义取消）         |
| `#resetBtn`     | `{ reset }`              | 替换重置按钮                                                 |
| `#submitBtn`    | `{ submit, submitting }` | 替换提交按钮（接内置校验 + 序列化 + 提交管线，可全替换按钮） |
| `#<config.key>` | FormItem 内部 mainProps  | 覆盖单项（透传 FormMain）                                    |

### Expose

无（表单实例内置，不对外暴露 ref 方法）。

## 反模式 / 注意

- **外部传 `data`**：类型已 Omit（`Omit<FormMainProps, "data">`）——表单值由 `stringifyData` 初值内部管理，外部回填走 `stringifyData`，联动走 `@parse-data-change`
- **`layoutByContainer` / `layoutScale` 无效**：已声明 prop 不入 attrs 且未显式转发——确定不生效；容器断点场景用 FormMain 或 FormSearch（其 layoutByContainer 显式转发）
- **手工拼提交载荷**：`submitFn` 收的即是序列化形态，`@success` 同载荷透传——提交 / 回传 / 回填三段共用同一 `stringifyData`，勿在中间自造转换
- **reset 语义**：reset 只内部 set parseData（回到初值快照，初值来自 `stringifyData` 或缺省 `generateFormData`），非清空到空白——需要空白态直接重给 `stringifyData`

## 关联

- 表单族：`FormMain`（底座）、`FormSubmitBtn`（内置提交按钮，经 `submitBtnProps` 定制）、`FormSearch`（搜索面）
- 类型：`FormDataInfo<PO, SO>` = `{ parseData, stringifyData }`（success / parseDataChange 载荷）；`ExtractFormStringifyRawFromObject`（类型级提取）
- 范式页：`apps/reference/src/pages/form/submit-panel/showcase/`

> 目录迁移：实现与配套收纳到 `components/form/form-submit-panel`，包根 API 与演示能力保持。

## bridge 事件

| 事件          | 触发时机                                            | 载荷 |
| ------------- | --------------------------------------------------- | ---- |
| `form-submit` | 默认按钮或 submitBtn slot 调用提交管线，validate 前 | 无   |
| `form-reset`  | 默认按钮或 resetBtn slot 调用重置                   | 无   |
| `form-cancel` | 默认按钮或 cancelBtn slot 调用取消                  | 无   |

三者都是意图事件，不表示业务成功；校验失败仍有一条 form-submit，不新增 success/fail 总线事件。默认与 slot 各只接本路径的 onSubmitStart，不双发。默认 submitBtnProps.onSubmitStart 原回调保留；slot 不额外调用该默认按钮回调。原 success/fail/cancel emits、submitFn 参数与 Promise 管线不变。

复用 core `useBridgeReport`；无订阅且 signal 镜像关闭时不求值 data thunk，不新增监听或定时任务。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-form`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
