# ModalDetail（配置化 CRUD 弹窗 / 抽屉）

> CRUD 预设薄壳：`type`（add/edit/read）决定标题前缀与提交分支，内部委托 ModalForm 渲染配置化表单。
> 范式页：`apps/reference/src/pages/layout/list-layout/guide/`（DetailModalItem 作 ModalPorter item 的薄适配器）、`apps/reference/src/pages/feedback/modal/guide/`

## 定位

- **空间一等公民**：CRUD 弹窗空间首选（add / edit / read 语义内置），经 ModalPorter evoke 使用
- **何时用**：新增/编辑/查看三态表单弹窗，一套 `list` 配置三态复用（标题自动带前缀）
- **何时不用**：只有提交没有三态语义的单表单用 `ModalForm`；确认类用 `ModalConfirm`
- 结构：CRUD 预设薄壳内部委托 ModalForm（强制 `headerDivider:false`/`footerDivider:false`），只留 add/edit 语义——`type` 决定标题前缀与提交走哪个 api
- 泛型：`PO` 模型 / `SO` 序列化；提交分支在 `detailSubmitFn` 中——`type !== "add"` 都走 `editApi`

## 快速上手（最小可用）

作 ModalPorter item 的薄适配器（`list-layout/guide/DetailModalItem.vue`——`show`/`closeFn`/`payload` 来自架子注入，add/edit 动态取自 payload）：

```ts
const modalProps = computed(() => ({
  show: props.show,
  type: props.payload.type, // add / edit 动态取自 payload
  data: props.payload.data,
  list: userBaseFormList, // 静态配置直接 import，不进 payload
  addApi: addUserApi,
  editApi: editUserApi,
  "onUpdate:show": (v: boolean) => {
    if (!v) props.closeFn();
  },
  onAfterAdd: () => {
    props.payload.onDone?.();
    props.closeFn();
  },
  onAfterEdit: () => {
    props.payload.onDone?.();
    props.closeFn();
  },
}));
```

**要点**：

- 四必传：`show`（v-model）、`data`、`list`、`type`（`"add"|"edit"|"read"`）
- 标题自动态：不传 `title` 时回退「新增[subTitle] / 编辑[subTitle]」；传 `title`（`() => VNode[]`）则整体替换内置标题
- 薄适配器模式（ModalPorter item）：架子注入的 `closeFn` 挂在 `onUpdate:show` 上（v 为 false 时关闭），`payload.onDone` 在 after\* 里回调——业务 [MUST] 自己把「关窗 + 刷新」接上，壳不代劳

## 能力边界 / 按需使用

- **`type` 三态判据**：`"add"` 新增（标题「新增…」+ 走 `addApi`）/ `"edit"` 编辑（标题「编辑…」+ 走 `editApi`）/ `"read"` 只读（`type !== "add"` 都走 `editApi`——read 态建议 `editApi` 传空/同 edit，只读不应触发真实提交）。一套 `list` 配置三态复用。
- `addApi`/`editApi`：不传也 resolve → 仍 emit after\*——纯 UI 闭环（暂不接后端）可不传；真接后端时传，提交成功以真实响应为准。
- `title`/`subTitle`：默认标题（新增/编辑 + 前缀）即够用；仅需定制标题（如带图标）时传。
- `formLayout`/`labelWidth` 等布局 props：默认即够用；仅栅格/紧凑需求时配。
- `layerType="drawer"`：仅当 CRUD 表单需要抽屉形态时开。
- **完整能力演示**（薄适配器 + 自定义标题 + 提交闭环）：`apps/reference/src/pages/layout/list-layout/guide/`、`apps/reference/src/pages/feedback/modal/guide/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（类型 `ModalDetailProps<PO,SO>`）

| name            | type                                                            | 默认        | 语义                                                               |
| --------------- | --------------------------------------------------------------- | ----------- | ------------------------------------------------------------------ |
| `show`          | `boolean`（必传）                                               | —           | 可见性                                                             |
| `data`          | `PO`（必传）                                                    | —           | 表单数据                                                           |
| `list`          | `FormItemConfigList<PO,SO>`（必传）                             | —           | 表单配置                                                           |
| `type`          | `DetailType = "add"\|"edit"\|"read"`（必传）                    | —           | 表单类型：决定标题前缀与用哪个 api                                 |
| `title`         | `() => VNode[]`                                                 | —           | 自定义标题整体替换内置标题；不传回退 新增[subTitle]/编辑[subTitle] |
| `subTitle`      | `string`                                                        | —           | 标题后缀                                                           |
| `addApi`        | `(data: ExtractFormStringifyFromObject<PO,SO>) => Promise<any>` | —           | 新增 api；未传也 resolve → 仍 emit afterAdd                        |
| `editApi`       | `(data: ExtractFormStringifyFromObject<PO,SO>) => Promise<any>` | —           | 编辑 api；未传也 resolve → 仍 emit afterEdit                       |
| `width`         | `number \| string`                                              | `600`       | 宽度                                                               |
| `formLayout`    | `FormMainProps<PO,SO>["layout"]`                                | `{span:24}` | 表单布局                                                           |
| `formProps`     | `Partial<FormProps>`                                            | —           | elForm 属性                                                        |
| `formRowGutter` | `number`                                                        | —           | 行 gutter                                                          |
| `labelWidth`    | `string`                                                        | `"auto"`    | label 宽度                                                         |
| `layerType`     | `ModalLayerType`                                                | `"modal"`   | 弹层形态                                                           |
| `direction`     | `ModalDirection`                                                | `"rtl"`     | drawer 方向                                                        |

### Emits

| 事件          | 载荷       | 语义                               |
| ------------- | ---------- | ---------------------------------- |
| `update:show` | `boolean`  | 可见性同步（v-model）              |
| `afterAdd`    | 序列化数据 | 新增提交成功（addApi resolve 后）  |
| `afterEdit`   | 序列化数据 | 编辑提交成功（editApi resolve 后） |

### Slots

| 槽        | 语义                                       |
| --------- | ------------------------------------------ |
| `#header` | 头部（映射到 ModalConfirm 的 main-header） |
| `#footer` | 底部（映射到 ModalConfirm 的 main-footer） |

### Expose

无。

## 反模式 / 注意

- **`type="read"` 无独立提交语义**：`detailSubmitFn` 中 `type !== "add"` 都走 `editApi`——read 态建议 editApi 传空/同 edit（只读态不应触发真实提交分支）
- **薄适配器要自己接关窗/刷新**：作 ModalPorter item 时，`closeFn` 挂 `onUpdate:show`、`payload.onDone` 挂 after\*——壳不代劳「关窗 + 列表刷新」闭环
- **addApi/editApi 未传也 resolve**：仍 emit after\*——「未接 api 的假成功」可能掩盖接入遗漏，确认表单提交成功以真实响应为准
- **`title` 传了就是整体替换**：自定义标题替换内置前缀标题，而不是追加；只想要后缀用 `subTitle`
- **分割线强制关**：壳内部强制 `headerDivider:false`/`footerDivider:false`，外部传值不生效（无需传）

## 关联

- 委托链：`ModalDetail` → `ModalForm` → `ModalConfirm`（Promise 契约 / $attrs 透传 / 分割线语义同源）
- 表单引擎：`FormMain`（form 族）
- 命令式弹窗体系：`ModalShelf` + `ModalPorter`（薄适配器模式范式见 `list-layout/guide/DetailModalItem.vue`）
- 类型：`DetailType`、`ModalLayerType`、`ModalDirection`（modal/types.ts）
- 范式页：`apps/reference/src/pages/layout/list-layout/guide/`、`apps/reference/src/pages/feedback/modal/guide/`

## 内部分层（30mf7k / 3a7k03）

详情薄壳归 pro（L3），经 modal/form 桶提供并继续委托 ModalForm；DetailModal 别名不变。

仅调整内部引用；组件位置、props、插槽、样式及行为不变。浏览器回归由复核者执行。

> 目录迁移：实现与配套归入 `components/compose/compose/modal-detail`；公开契约、兼容别名与 panel 废弃时间点不变。

## C 源码迁移

本组件及配套类型/hooks/测试/API迁至 `packages/forge-compose/src/components`，去掉 pro 重复层。应用消费 `@done-coding/forge`；组件 API、槽与事件不变，Panel已由pn1031退役（C拆包时曾保留）。
