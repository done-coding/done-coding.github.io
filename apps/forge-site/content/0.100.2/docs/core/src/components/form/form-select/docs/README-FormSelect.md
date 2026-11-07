# FormSelect（选择器）

> el-select 包装（本地 options / 远程搜索 remoteMethod / 异步 getOptions）+ option 插槽自定义渲染 + 影分身（`shadowClone` 表头漏斗，点击 popover 弹选择器，同一 v-model 同源同步）。
> 范式页：`apps/reference/src/pages/layout/list-layout/sort/`（状态列表头漏斗弹选择器）。

## 定位

- **配置化表单的选择字段**：FormMain / FormSearch 配置接入（`render: FormSelect`），options 业务注入
- **远程搜索**：`remoteMethod` 传入即自动开 filterable + remote（输入触发远程查询）
- **异步取选项**：`getOptions` 挂载后拉取
- **何时不用**：静态小选项集用原生 el-select 即可

## 快速上手（最小可用）

```html
<FormSelect
  v-model="status"
  :options="[{ label: '启用', value: 1 }, { label: '禁用', value: 0 }]"
/>
```

**要点**：

- `options`（本地静态）/ `remoteMethod`（远程搜索）/ `getOptions`（异步拉取）三选一提供选项源
- `modelValue` = `OptionItem["value"]`；选中项经 `detailChange` 上抛完整选项（immediate 首发）
- `option` 插槽自定义选项渲染（`{ data }` 作用域）
- 其余 props / 事件全量 `$attrs` 透传 el-select（placeholder / clearable / size 等）

## 能力边界 / 按需使用

- **默认即够用：options + v-model 即为完整选择器**。以下按需开：
- `remoteMethod`：远程搜索（自动 filterable + remote，输入触发查询）
- `getOptions`：挂载后异步拉取选项
- `itemCls`：选项类名
- **影分身（表头漏斗）用 `FormSelectShadowClone`**（本组件 + 影分身包装，薄包装纯粹性）：列表页表格头预埋容器内显示漏斗图标，点击 popover 弹选择器，同一 v-model 与本体同源同步（与 FormInputShadowClone 统一漏斗语义：「表头漏斗 = 点这里筛选」）

## 依赖关系

- form 族内部组件，无跨族依赖（仅透传 el-select）；影分身版 `FormSelectShadowClone` 依赖内部件 `FormShadowCloneDispatch` → display 族 `ShadowClone`（详见 README-FormShadowCloneDispatch.md）

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name           | type                                | 默认 | 语义                                                              |
| -------------- | ----------------------------------- | ---- | ----------------------------------------------------------------- |
| `modelValue`   | `OptionItem["value"]`               | —    | v-model                                                           |
| `options`      | `OptionItem[]`                      | `[]` | 本地选项集                                                        |
| `remoteMethod` | `(query?) => Promise<OptionItem[]>` | —    | 远程搜索（自动 filterable + remote）                              |
| `itemCls`      | `string`                            | —    | 选项类名                                                          |
| `getOptions`   | `() => Promise<OptionItem[]>`       | —    | 挂载后异步拉取选项                                                |
| 其余           | —                                   | —    | 全量 `$attrs` 透传 el-select（placeholder / clearable / size 等） |

### FormSelectShadowClone（影分身版）

> 内部经 `FormShadowCloneDispatch` 实现：default 与 clone 两插槽各写一份 `<FormSelect v-model="同一值" />` 同源绑定驱动双处视图一致；高亮判定在**本组件内部**（默认规则 + `isHighlighted` 覆盖）→ 经 dispatch `highlighted` 展示在漏斗 + 插槽作用域暴露。

| name            | type                          | 默认     | 语义                                                                                                                   |
| --------------- | ----------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `modelValue`    | `OptionItem["value"]`         | —        | v-model（透传 FormSelect；本体与分身弹层同源）                                                                         |
| `shadowClone`   | `boolean`                     | `false`  | 影分身开关（本体 + 分身 label+漏斗，点击 popover 弹选择器，同一 v-model 同源同步）                                     |
| `teleportTo`    | `string \| Element`           | —        | 分身目标容器（表头预埋唯一选择器；`shadowClone` 时生效，未配置不分身）                                                 |
| `label`         | `string`                      | —        | 分身位字段文字（表头列名；label + 漏斗整块展示、高亮整块——表格 headerRender 只需留 teleportTo 容器，列名由分身自带）   |
| `isHighlighted` | `(value: unknown) => boolean` | 默认判定 | 分身高亮判定方法（非必传），入参 modelValue；默认 = 非 `null` / 非 `undefined` / 非空字符串 → 高亮（label + 漏斗整块） |
| 其余            | —                             | —        | 全量 `$attrs` 透传 FormSelect（options/remoteMethod/option 插槽等能力完整继承）                                        |

### Emits

| name                | 载荷                      | 语义                               |
| ------------------- | ------------------------- | ---------------------------------- |
| `update:modelValue` | `OptionItem["value"]`     | v-model 上抛（本体与分身弹层同源） |
| `detailChange`      | `OptionItem \| undefined` | 选中项详情变更（immediate 首发）   |
| 其余                | el-select events          | `$attrs` 透传（change / blur 等）  |

### Slots

| name     | 语义                                                            |
| -------- | --------------------------------------------------------------- |
| `option` | 选项自定义渲染（`{ data }` 作用域；本体与分身弹层内选择器共用） |

> 目录迁移：实现与配套收纳到 `components/form/form-select`，包根 API 与演示能力保持。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-form`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
