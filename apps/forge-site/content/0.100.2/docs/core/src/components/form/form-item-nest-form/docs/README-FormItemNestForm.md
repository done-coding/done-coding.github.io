# FormItemNestForm（嵌套子表单 C1）

> 单层嵌套子表单：父 item 内嵌一个子 FormMain（modelValue 同引用绑定父 `data[key]`），级联校验 / 重置经父 FormMain 注册表自动贯通。
> 范式页：`apps/reference/src/pages/form/nest-form/showcase/`（C1 单独场景）、`pages/form/nest-form-list/showcase/`（C4 行内套 C1）

## 定位

- **何时用**：一个字段下挂一组子字段（如「扩展信息」内含多字段），或 C4 行列表内每行再嵌套子表单
- **何时不用**：同层平铺字段直接用 FormMain.list；多行同构子表用 `FormItemNestFormList`（C4）
- 内部机制：子 FormMain 的 expose 经 `useNestForm` 注册进父 `FORM_NEST_REGISTRY_KEY`（`nestKey` 作索引）——父 `validate()` / `resetFields()` / `clearValidate(key?)` 自动级联到子表
- 组件自身无 emits / slots / expose；推荐经 `nestFormItem` helper 织入配置，而非手写组件用法

## 快速上手（最小可用）

配置面走 helper（`nestFormItem` 是推荐姿势，织入普通 FormMain.list）：

```ts
import {
  FormMain,
  swiftFormItemConfig,
  nestFormItem,
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
  nestFormItem({ key: "extra", label: "扩展信息", list: extraList }), // 子表单零配置织入
];
const data = ref(generateFormData(list));
```

```html
<FormMain :list="list" :data="data" />
```

**要点**：

- `nestFormItem` 自动织入 `render`（markRaw 组件引用）+ `init`（缺省 `generateFormData(list)`）+ `stringify` / `parse`（缺省递归子 list）+ `parentSpan`——配置面只写 `{ key, label, list }` 即完成
- v-model 语义：modelValue 是父 `data[key]` 对象，同引用 in-place——按此语义改属性，父 data 即子表数据
- 级联校验零接线：父 FormMain `validate()` 穿透到子表单（nestKey 注册进 exposeMap）

## 能力边界 / 按需使用

- **默认即够用：`nestFormItem({ key, label, list })` 即完成嵌套**（render / init / stringify / parse / parentSpan 自动织入，级联校验零接线）。以下全部按需开：
- `layout` / `rowGutter`：默认未设 = 吃父级布局；仅当子表单需要独立布局才设。
- `rebase`：默认 `true` 叠本层嵌套布局 rebase（配合 `parentSpan` 算因子）；仅当不需要层级缩放（layout 原样直透）才设 `false`。
- **视觉 = 去框化**（批次 e9dzn4）：容器 = page 档凹陷井（`--el-bg-color-page`），零描边
  零投影——嵌套层级靠明度差表达（在面档父容器上凹一档），[MUST NOT] 回补描边+投影。
- `shadowColor`：默认零投影（去框化）；显式传值才内联加外环阴影（消费方自负跨主题适配）。
- 多行同构子表（一对多）→ 不走本组件，用 `FormItemNestFormList`（C4）。
- **完整能力演示**（C1 单独场景 / C4 行内套 C1）：`apps/reference/src/pages/form/nest-form/showcase/`、`pages/form/nest-form-list/showcase/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（内联 defineProps）

| name          | type                         | 默认   | 语义                                                                                   |
| ------------- | ---------------------------- | ------ | -------------------------------------------------------------------------------------- |
| `nestKey`     | `string`（必填）             | —      | 所属父 item key（注册进父 FormMain exposeMap 的索引，供级联 validate / clear / reset） |
| `list`        | `FormItemConfigList`（必填） | —      | 子表单配置                                                                             |
| `layout`      | `Partial<ColProps>`          | 未设   | 子 FormMain 布局                                                                       |
| `rowGutter`   | `number`                     | 未设   | 子行间距                                                                               |
| `shadowColor` | `string`                     | 未设   | 外环阴影色（默认零投影·去框化；显式传才内联加投影）                                    |
| `parentSpan`  | `number`                     | 未设   | 父 item 代表 span（P3 rebase 算因子）                                                  |
| `rebase`      | `boolean`                    | `true` | 是否叠本层嵌套布局 rebase（`false`=layout 原样直透）                                   |

### v-model

`modelValue: Record<string, any>`（defineModel，默认 `() => ({})`）——等于父 `data[key]` 对象，同引用 in-place。

### Emits / Slots / Expose

无（子 FormMain expose 经 `useNestForm` 注册到父 registry）。

### 配套 helper：`nestFormItem(options: NestFormItemOptions): FormItemConfig`

自动织入：`render`（markRaw 组件引用）、`init`（缺省 `generateFormData(list)`）、`stringify` / `parse`（缺省递归子 list）、`parentSpan`。

`NestFormItemOptions` 含：`key` / `label` / `list` / `layout` / `rowGutter` / `shadowColor` / `init` / `stringify` / `parse` / `rebase`。

## 反模式 / 注意

- **根盒恒占整行**（`width:100%` + `min-width:0`）：它落在 EP 的 `.el-form-item__content` flex 容器里，不显式给宽会收缩到内容宽 —— 行内只有窄内容（如 148px 方卡）时右边会留一大片空白。[MUST NOT] 在消费方用 `wrapProps` 补 `width:100%`（已由组件自带）

- **手写嵌套子表单配置**：直接手写 render 挂子 FormMain 会绕过注册机制，级联校验断裂——[MUST] 用 `nestFormItem` / 本组件
- **nestKey 与父 key 不一致**：nestKey 是父 item key，注册索引对不上则级联失效
- **shadowColor 显式传才内联覆盖**：默认零投影（去框化，层级靠背景明度差）；除非确需跨主题固定投影，别传
- **rebase 语义**：默认 `true` 叠本层嵌套布局 rebase（配合 `parentSpan` 算因子）；`false` 时 layout 原样直透

## 关联

- 表单族：`FormItemNestFormList`（C4 多行同构）、`FormMain`（底座与注册容器）、`FormSearch` / `FormSubmitPanel`（上层形态）
- helpers：`nestFormItem`（C1 配置生成）、`useNestForm`（expose 注册）、`useNestLayoutScale`（布局 rebase）
- 内部 provide：`FORM_NEST_REGISTRY_KEY`（FormMain）、`NEST_LAYOUT_SCALE_KEY`（FormMain）
- 范式页：`apps/reference/src/pages/form/nest-form/showcase/`、`pages/form/nest-form-list/showcase/`

> 目录迁移：实现与配套收纳到 `components/form/form-item-nest-form`，包根 API 与演示能力保持。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-form`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
