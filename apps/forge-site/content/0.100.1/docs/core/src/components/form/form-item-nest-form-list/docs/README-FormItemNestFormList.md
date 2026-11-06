# FormItemNestFormList（嵌套行列表 C4）

> 多行同构子表单列表：一行一个子 FormMain（v-model 数组真源），min / max 行数约束 + 新增 / 删除（可二次确认）+ render-fn 头部 / 底部自定义。
> 范式页：`apps/reference/src/pages/form/nest-form-list/showcase/`

## 定位

- **何时用**：一对多子表（联系人列表、地址列表…），行内字段同构，可增删
- **何时不用**：单层嵌套用 `FormItemNestForm`（C1）；行内字段需再异构嵌套时 C4 行内再套 C1
- 内部机制：`useNestFormList` 注册 **1 个聚合 expose**（fan-out 遍历各行）进父 `FORM_NEST_REGISTRY_KEY`——父 `validate()` 级联校验每一行
- 组件自身无 emits / slots / expose；推荐经 `nestFormItemList` helper 织入配置

## 快速上手（最小可用）

配置面走 helper（单层 C4 即完整；`nestFormItemList` 织入普通 FormMain.list）：

```ts
import {
  FormMain,
  swiftFormItemConfig,
  nestFormItemList,
  generateFormData,
} from "@done-coding/forge";
const list: FormItemConfigList = [
  swiftFormItemConfig({
    key: "name",
    label: "姓名",
    type: "input",
    required: true,
    render: ElInput,
  }),
  nestFormItemList({
    key: "addresses",
    label: "地址列表",
    list: addressList,
    min: 1,
    max: 2,
  }),
];
const data = ref(generateFormData(list));
```

```html
<FormMain :list="list" :data="data" />
```

**要点**：

- v-model 是**数组真源**：push / splice 原地改即增删行；行数约束叠加在增删动作上——删到 `min` 禁删、达 `max` 禁新增
- `nestFormItemList` 自动织入 render / init / stringify / parse + `rules`（min / max 长度规则与自动织入合并）——`generateFormData(list)` 即按配置产出完整嵌套结构
- 两层防线各管一段：min / max 硬约束（禁删 / 禁新增）在交互层，长度硬校验走父 item `rules`（不补数据）
- `removeConfirm` 默认开：行删除二次确认（`true`=默认 popconfirm「确认删除该项？」；`false`=直删；对象=自定义）
- **视觉 = 去框化双档背景分层**（批次 e9dzn4）：容器 = page 档凹陷井（`--el-bg-color-page`）、
  每行 = 面档卡片（`--el-bg-color`），零描边零投影——嵌套层级靠明度差表达，多层嵌套时
  井/卡自然交替，[MUST NOT] 回补每层描边+投影（框中框反模式）。`shadowColor` 显式传值
  仍走内联覆盖（消费方自负跨主题适配）。
- **删除按钮不占行内列**：绝对定位行卡片右上角（卡片顶部预留按钮带），行内容体吃满整行宽
  （验收判据：行容器宽 − 内容体宽 ≤ 2px）。

## 能力边界 / 按需使用

- **默认即够用：`nestFormItemList({ key, label, list })` 即完成增删行列表**（min/max 不约束、删除带默认确认）。以下全部按需开：
- `min` / `max`：默认 `0` / `Infinity` 即够用（不约束）；仅当业务要求行数上下限才设——[MUST] 同时配 `rules`（长度硬校验走父 item `rules`，min / max 只是交互层禁删 / 禁增）。
- `removeConfirm`：默认开（删除需确认）；仅当删除属低风险 / 高频操作（或外层已有更强确认层）才设 `false` 直删；对象 = 自定义文案。
- `itemFactory`：默认 `generateFormData(list)` 即够用；仅当新增行需要特殊初始值才设。
- `rowKey`：默认内部 WeakMap 自增 rowId 即够用（组件生命周期内行身份稳定）；仅当行身份需跨会话稳定（对应后端 id）才显式传字段名。
- `headerRender` / `footerRender`：默认不设（内置新增按钮）；仅当列表头尾需要自定义内容（计数 / 汇总 / 定制按钮）才用 render-fn（非 slot）。
- 行内再嵌套（C4 套 C4 / 行内套 C1）：按需，行 `list` 内再织 `nestFormItem` / `nestFormItemList`。
- **完整能力演示**（C4 套 C4 / C1 三层嵌套 + hide 联动）：`apps/reference/src/pages/form/nest-form-list/showcase/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（内联 defineProps）

| name                     | type                                          | 默认                     | 语义                                                                                  |
| ------------------------ | --------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `nestKey`                | `string`（必填）                              | —                        | 父 item key（聚合 expose 注册索引）                                                   |
| `list`                   | `FormItemConfigList`（必填）                  | —                        | 每行子表单配置                                                                        |
| `rowKey`                 | `string`                                      | 未设                     | 行稳定 id 字段（缺省内部 WeakMap 自增 rowId）                                         |
| `itemFactory`            | `() => T`                                     | `generateFormData(list)` | 新增行工厂                                                                            |
| `min`                    | `number`                                      | `0`                      | 最少行（删到 min 禁删；硬约束走父 item rules 长度校验，不补数据）                     |
| `max`                    | `number`                                      | `Infinity`               | 最多行（达上限禁新增）                                                                |
| `layout` / `rowGutter`   | —                                             | —                        | 每行子 FormMain 布局 / 行距                                                           |
| `addText` / `removeText` | `string`                                      | `"新增"` / `"删除"`      | 按钮文案                                                                              |
| `headerRender`           | `({ count, max }) => VNodeChild`              | 未设                     | 顶部自定义渲染（render-fn，非 slot）                                                  |
| `footerRender`           | `({ count, max, canAdd, add }) => VNodeChild` | 未设                     | 底部自定义渲染（缺省=内置新增按钮）                                                   |
| `shadowColor`            | `string`                                      | 未设                     | 外环 + 每行阴影色（默认零投影·去框化；显式传值才内联加投影）                          |
| `parentSpan` / `rebase`  | —                                             | rebase `true`            | 同 C1（父 item 代表 span / 是否叠嵌套 rebase）                                        |
| `removeConfirm`          | `boolean \| ActionBtnConfirmConfig`           | `true`                   | 行删除二次确认（`true`=默认 popconfirm「确认删除该项？」；`false`=直删；对象=自定义） |

### v-model

`modelValue: T[]`（defineModel，默认 `() => []`）——数组真源，push / splice 原地改。

### Emits / Slots / Expose

无（`useNestFormList` 注册 1 个聚合 expose，fan-out 遍历各行）。

### 配套 helper：`nestFormItemList(options: NestFormItemListOptions)`

自动织入 render / init / stringify / parse + `parentSpan`；options 另含 `rules`（与自动织入的 min / max 长度规则合并）。

## 反模式 / 注意

- **根盒恒占整行**（`width:100%` + `min-width:0`）：它落在 EP 的 `.el-form-item__content` flex 容器里，不显式给宽会收缩到内容宽 —— 行内只有窄内容（如 148px 方卡）时右边会留一大片空白。[MUST NOT] 在消费方用 `wrapProps` 补 `width:100%`（已由组件自带）

- **手写行子表单配置**：绕过注册机制则多行级联校验断裂——[MUST] 用 `nestFormItemList` / 本组件
- **只靠 min / max 交互约束**：禁删 / 禁新增是交互层防线，长度硬校验走父 item `rules`——需要提交时兜底校验（如绕过 UI 直接改数据）必须配 `rules`
- **headerRender / footerRender 是 render-fn 不是 slot**：在配置内以函数形式提供，不能当插槽模板使用
- **rowKey 稳定性**：缺省走内部 WeakMap 自增 rowId（组件生命周期内行身份稳定）；行身份需跨会话稳定（如对应后端 id）时显式传 `rowKey` 字段名

## 关联

- 表单族：`FormItemNestForm`（C1 单层嵌套）、`FormMain`（底座与注册容器）、`FormSubmitPanel`（提交面）
- helpers：`nestFormItemList`（C4 配置生成）、`useNestFormList`（聚合 expose 注册）、`nestFormItem`（C1）、`useNestLayoutScale`（布局 rebase）
- 内部 provide：`FORM_NEST_REGISTRY_KEY`（FormMain）、`NEST_LAYOUT_SCALE_KEY`（FormMain）
- 范式页：`apps/reference/src/pages/form/nest-form-list/showcase/`

> 目录迁移：实现与配套收纳到 `components/form/form-item-nest-form-list`，包根 API 与演示能力保持。

## bridge 事件

| 事件               | 触发时机                         | 载荷                                         |
| ------------------ | -------------------------------- | -------------------------------------------- |
| `nest-list-add`    | max 守卫通过且实际 push 后       | `{ count: number }`（新增后的总行数）        |
| `nest-list-remove` | min 守卫通过且实际 splice 删除后 | `{ index: number }`（删除前从 0 起的行索引） |

自定义 footer 的 add 与默认按钮共用入口；达到限制、factory 抛错或取消删除确认不发增删事件。直接由外部改 model 不冒充组件增删。确认框自身仍按 ActionBtn 契约发 confirm-open/close。

复用 core `useBridgeReport`；无订阅且 signal 镜像关闭时不求值 data thunk，不新增监听或定时任务。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-form`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
