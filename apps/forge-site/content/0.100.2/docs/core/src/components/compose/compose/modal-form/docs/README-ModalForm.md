# ModalForm（配置化表单弹窗 / 抽屉）

> 「ModalConfirm 外壳 + FormMain 表单」组合件：配置驱动渲染表单，提交走 Promise 契约（reject 不关窗 / resolve 关窗 + submitSuccess）。
> 范式页：`apps/reference/src/pages/feedback/modal/form-modal/showcase/`（独立原语用法）

## 定位

- **空间一等公民**：弹窗表单空间首选（非 CRUD 的表单弹窗）
- **何时用**：弹窗/抽屉内配置化表单提交（新增反馈、编辑资料等单表单场景）
- **何时不用**：完整 CRUD 弹窗（新增/编辑/查看三态 + 双 api）用 `ModalDetail`；确认类交互用 `ModalConfirm`；纯弹窗体系管理用 `ModalShelf` + `ModalPorter`
- 内部链路：`show` 变 true → FormMain `validate()` → `stringify()` → `submitFn(data)`；`show` 变 false 时 `clearValidate()`
- 泛型：`PO` 模型 / `SO` 序列化——`submitFn` 收到的是 `ExtractFormStringifyFromObject<PO,SO>`（序列化后数据）

## 快速上手（最小可用）

单表单弹窗零配置——默认 modal 形态 + 宽 600 + 布局 `{span:24}`：

```vue
<ModalForm
  v-model:show="show"
  title="提交反馈"
  :list="feedbackFormList"
  :data="formData"
  :submit-fn="submitFeedback"     <!-- resolve → 关窗 + submitSuccess -->
  @submit-success="onSubmitSuccess"
/>
```

**要点**：

- 三必传：`show`（v-model）、`data`（表单模型数据）、`list`（form 族配置 `FormItemConfigList<PO,SO>`）
- `submitFn` 走 ModalConfirm confirmHandler 契约：reject → 不关窗（错误留在原地展示）；resolve → 关窗 + emit `submitSuccess`（载荷 = 序列化结果）

## 能力边界 / 按需使用

- **默认即够用：modal 形态 + 宽 600 + 布局 `{span:24}` + 带分割线**——常规单表单弹窗（新增反馈/编辑资料）只传 `show`/`data`/`list`/`submitFn`。
- `layerType="drawer"`：仅当表单需要抽屉形态（侧滑、大尺寸表单）时开；`direction` 仅 drawer 生效。
- `formLayout`/`formRowGutter`/`labelWidth`/`formProps`：默认即够用；仅当表单需要栅格布局（span 分栏）、紧凑排列或 elForm 定制行为时配——均透传 FormMain。
- `headerDivider`/`footerDivider`：ModalForm 族默认 `true`（带分割线，与 ModalConfirm 默认相反）；仅需关掉时显式传 `false`。
- `#header`/`#footer` 插槽：仅当需要整体替换头部/底部区域时用。
- **完整能力演示**（独立原语 + 双形态 + 分割线切换）：`apps/reference/src/pages/feedback/modal/form-modal/showcase/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（类型 `ModalFormProps<PO,SO>`）

| name            | type                                                                         | 默认        | 语义                                                                                                 |
| --------------- | ---------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| `show`          | `boolean`（必传）                                                            | —           | 可见性                                                                                               |
| `data`          | `PO`（必传）                                                                 | —           | 表单模型数据                                                                                         |
| `list`          | `FormItemConfigList<PO,SO>`（必传）                                          | —           | 表单配置（form 族类型）                                                                              |
| `submitFn`      | `(data: ExtractFormStringifyFromObject<PO,SO>) => Promise<any>\|any`（必传） | —           | 提交方法；走 ModalConfirm confirmHandler 契约：reject → 不关窗 / resolve → 关窗 + emit submitSuccess |
| `title`         | `string \| (() => VNode[])`                                                  | —           | 标题（透传 ModalConfirm）                                                                            |
| `width`         | `number \| string`                                                           | `600`       | 宽度 / drawer 尺寸                                                                                   |
| `layerType`     | `ModalLayerType`                                                             | `"modal"`   | 弹层形态                                                                                             |
| `direction`     | `ModalDirection`                                                             | `"rtl"`     | drawer 方向                                                                                          |
| `formLayout`    | `FormMainProps<PO,SO>["layout"]`                                             | `{span:24}` | 表单整体布局                                                                                         |
| `formProps`     | `Partial<FormProps>`                                                         | —           | elForm 其他属性                                                                                      |
| `formRowGutter` | `number`                                                                     | —           | 表单行 gutter                                                                                        |
| `labelWidth`    | `string`                                                                     | `"auto"`    | 表单 label 宽度                                                                                      |
| `headerDivider` | `boolean`                                                                    | `true`      | header 分割线（ModalForm 族默认带）                                                                  |
| `footerDivider` | `boolean`                                                                    | `true`      | footer 分割线                                                                                        |

### Emits

| 事件            | 载荷                        | 语义                            |
| --------------- | --------------------------- | ------------------------------- |
| `update:show`   | `boolean`                   | 可见性同步（v-model）           |
| `submitSuccess` | `data: FormMain 序列化结果` | 提交成功（submitFn resolve 后） |

### Slots

| 槽        | 语义                                       |
| --------- | ------------------------------------------ |
| `#header` | 头部（映射到 ModalConfirm 的 main-header） |
| `#footer` | 底部（映射到 ModalConfirm 的 main-footer） |

### Expose

无。内部持有 FormMain 实例走 validate → stringify → submitFn；`show` 变 false 时 `clearValidate()`。

## 反模式 / 注意

- **submitFn 别忘 Promise 语义**：返回 `false` 或 reject 都会**不关窗**——写同步返回时注意别让 falsy 值意外吞掉关闭（走 ModalConfirm confirmHandler 契约）
- **`data` / `list` 必传缺一即崩**：类型必传，运行时也依赖二者驱动 FormMain
- **分割线默认与 ModalConfirm 相反**：ModalForm 族默认 `true`（带分割线）；想在 ModalConfirm 内自绘表单时注意两族默认不一致
- **序列化后提交**：`submitFn` 收到的是 `ExtractFormStringifyFromObject<PO,SO>` 而非 PO 原形——日期/枚举等 stringify 转换先发生
- **宽度默认 600 而非 420**：表单弹窗默认更宽，别按 ModalConfirm 默认想当然

## 关联

- 外壳：`ModalConfirm`（Promise 契约 / 分割线 / $attrs 透传语义同源）
- 表单引擎：`FormMain`（form 族，`formLayout`/`formProps` 等均透传）
- CRUD 预设：`ModalDetail`（内部强制 `headerDivider:false`/`footerDivider:false` 委托本组件）
- 命令式弹窗体系：`ModalShelf` + `ModalPorter`（ModalForm 亦可作 modalList item）
- 范式页：`apps/reference/src/pages/feedback/modal/form-modal/showcase/`

## 内部分层（30mf7k / 3a7k03）

表单弹层归 pro（L3），经 modal/form 桶提供；依赖 form 和 modal/confirm，FormModal 别名不变。

仅调整内部引用；组件位置、props、插槽、样式及行为不变。浏览器回归由复核者执行。

> 目录迁移：实现与配套归入 `components/compose/compose/modal-form`；公开契约、兼容别名与 panel 废弃时间点不变。

## C 源码迁移

本组件及配套类型/hooks/测试/API迁至 `packages/forge-compose/src/components`，去掉 pro 重复层。应用消费 `@done-coding/forge`；组件 API、槽与事件不变，Panel已由pn1031退役（C拆包时曾保留）。
