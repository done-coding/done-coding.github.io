# FormMain（配置化表单主体）

> 配置化表单核心容器：`list` 配置驱动渲染 / 校验 / 序列化，`data` 同引用绑定，generate / parse / stringify 三方法做数据 round-trip。
> 范式页：`apps/reference/src/pages/form/guide/`（最佳实践）

## 定位

- **何时用**：任何配置化表单页的主体——搜索类前缀走 FormSearch、提交类面板走 FormSubmitPanel，本组件是两者与嵌套子表单（FormItemNestForm / FormItemNestFormList）的底座
- **何时不用**：搜索表单用 `FormSearch`（自带折叠 + 操作区）；带提交/取消操作区的用 `FormSubmitPanel`；嵌套子表用 C1 / C4 组件族
- 内部组合：单项渲染由 `FormItem` 完成（未导出，仅 FormMain 内部）；内部 provide `FORM_NEST_REGISTRY_KEY`（嵌套子表单 expose 注册，级联 validate/clear/reset）与 `NEST_LAYOUT_SCALE_KEY`（嵌套布局 rebase）
- 根节点为 ElForm，`inheritAttrs: true`（class / attrs 自然落 ElForm 根）

## 快速上手（最小可用）

最小表单 + 校验提交（默认值即够用）：

```html
<FormMain ref="formMain" :list="list" :data="data" />
```

```ts
const formMain = ref<FormMainInstance>();
const data = ref(generateFormData(list));
const submit = async () => {
  await formMain.value?.validate(); // 校验不通过即 reject，闸住提交
  const payload = stringifyFormData(data.value, list); // 序列化为提交形态
  await saveApi(payload);
};
```

**要点**：

- `list` 配置驱动渲染 / 校验 / 序列化；`data` 是 v-model 语义、**同引用绑定**——改 data 对象属性即改表单值
- 提交 = `validate()` 通过 → `stringifyFormData` 序列化 → 发 API；搜索（FormSearch）/ 提交面板（FormSubmitPanel）已内置此管线，裸用本组件只需两条裸函数 + 一行 validate
- 单项渲染可被具名槽 `#<config.key>` 覆盖；默认 slot 可整体接管栅格

## 能力边界 / 按需使用

- **三方法 round-trip（generate / parse / stringify）：最小形态只用两条裸函数路——`generateFormData` 建初值 + `stringifyFormData` 序列化提交，即够用。** 仅当页面有「新增 / 编辑」双模式（编辑回填走 `parseFormData` + 留存分支编排）才需要三方法完整编排。
- `layout` / `rowGutter`：默认即够用（rowGutter=8，单项自带 layout）；仅当需要整体栅格统一（如多列 span）才设 `layout`——单项 `layout` 优先。
- 具名槽 `#<config.key>`：默认关（单项由配置 render / props 驱动）；仅当单一项需要完全自定义渲染（复杂组合控件）才开。
- `#default` 整体接管栅格：默认关、少用；仅当整个栅格结构需重构时开。
- `layoutByContainer`：缺省使用 bridge 配置，核内默认 true（按容器宽）；显式 false 可回到 window 媒体查询。
- `labelHide`（单项）：默认关；标签不显示也不占位、控件顶满整行。**不分是否给 `labelWidth`**（见下）。
- **完整能力演示**（新增 / 编辑双模式三方法编排 + 校验提交）：`apps/reference/src/pages/form/guide/`——能力展示，非推荐默认。

## `labelHide` —— 两种 label DOM 形态都要藏

EP 的 label **有两种结构**，取决于 `label-width`：

| `label-width`      | DOM                                                  | 谁落在这一半                                          |
| ------------------ | ---------------------------------------------------- | ----------------------------------------------------- |
| `auto`             | `.el-form-item__label-wrap` > `.el-form-item__label` | `FormSearch` / `FormSubmitPanel`（各自默认了 `auto`） |
| 其余（含**不给**） | 只有 `.el-form-item__label`                          | **裸 `FormMain`**                                     |

🔴 **v0.32.0 之前只藏了 wrap** ⇒ 裸 `FormMain` 下 `labelHide` **静默失效**：
`form-item-label-hide` 这个类确确实实挂在 DOM 上、devtools 里一切正常，
消费方的 `vue-tsc` / `eslint` / `vite build` / 单测全绿 —— 只是那条 CSS 规则匹配不到任何元素
（消费方 示例消费应用 实测四个 label 各占 40–51px，把控件挤窄；ncl4rj）。现已两条都藏。

🔴 **[MUST NOT] 改成「给 `FormMain` 也默认 `labelWidth: auto`」**：那会改掉**所有**裸
`FormMain` 的标签对齐方式，可见变更面比 `labelHide` 自己大得多。

⚠️ **仍只在 `label` 有值时生效** —— 无 `label` 时 EP 会给 content 加 `margin-left` 留白，
那一档要改用 `labelWidth: 0`。

⚠️ **加用例时断言 [MUST] 落在渲染结果上**（label 是否占位 / 宽是否为 0），
[MUST NOT] 只断类名在不在 —— 本现象的全部症状就是「类名在、规则不命中」，
断类名的用例在出 bug 时也是全绿的。且样例里 [MUST] 有一条**裸 `FormMain`**。
范式页：`apps/reference/src/pages/form/label-hide/`（裸用 / `auto` / 阴性三栏对照）。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（泛型 `PO` 解析模型 / `SO` 格式化模型，`FormMainProps<PO, SO>`）

| name                | type                                 | 默认                          | 语义                                                                     |
| ------------------- | ------------------------------------ | ----------------------------- | ------------------------------------------------------------------------ |
| `list`              | `FormItemConfigList<PO, SO>`（必填） | —                             | 表单项配置数组（驱动渲染/校验/序列化）                                   |
| `data`              | `PO`（必填）                         | —                             | 表单数据模型（v-model 语义，直接同引用绑定——改 data 对象属性即改表单值） |
| `layout`            | `Partial<ColProps>`                  | 未设（不传则单项各自 layout） | 表单整体栅格布局，单项 layout 优先                                       |
| `rowGutter`         | `number`                             | `8`                           | ElRow 横向列间距                                                         |
| `layoutScale`       | `number`                             | `1`                           | P3 嵌套 rebase 累乘因子（缺省 1=顶级行为不变，由联结薄壳算后传入）       |
| `layoutByContainer` | `boolean`                            | `false`                       | 按容器断点校准响应式 span（默认按 window 媒体查询）                      |

### Emits

| 事件            | 载荷                 | 语义                                                |
| --------------- | -------------------- | --------------------------------------------------- |
| `loadingChange` | `boolean`            | 表单项变更 loading 状态变化（如上传在途）           |
| `visibleChange` | `boolean`            | 显隐（hide 驱动）变化                               |
| `submit`        | `FormItemSubmitType` | 表单项触发提交（`"blur"` / `"change"` / `"enter"`） |

> 🔴 **原生表单提交恒被阻止**（`ElForm` 上 `@submit.prevent`）。
> `ElForm` 渲染的是真 `<form>`，而 HTML 的**隐式提交**规则是「表单里恰好只有一个文本类输入控件时，
> 在该控件按 Enter 即提交表单」—— 不拦就是**整页刷新 + 用户输入全丢**，且只在「恰好一个输入框」
> 的表单上出现，多字段表单看着一切正常（这正是它能长期潜伏的原因）。
> 本组件的提交管线（`use-form-submit`）本就全走 JS，从不依赖原生提交。
> 需要「回车即提交」时，由业务在输入控件上自行接 `@keyup.enter`，或用表单项的 `submit` 事件
> （载荷含 `"enter"`）—— [MUST NOT] 指望原生提交。

### Slots

| 槽              | scope                                                                                  | 语义                 |
| --------------- | -------------------------------------------------------------------------------------- | -------------------- |
| `#<config.key>` | FormItem 内部 mainProps（`modelValue` / `onUpdate:modelValue` / `placeholder` / 事件） | 覆盖单项渲染         |
| `#default`      | `{ mergeLayout }`                                                                      | 整体接管栅格（少用） |

### Expose（`FormMainInstance<PO, SO>`）

`validate(): Promise<void>`（本层 + 隐藏项过滤 + 嵌套子表单级联）、`resetFields()`、`clearValidate(key?)`、`generate(): PO`、`parse(stringifyData): PO`、`stringify()`（序列化对象）——三方法 round-trip。

AI 填充数据层两方法（详见下节「AI 填充（数据层）」）：

- `getAiSchema(): Promise<FormAiSchema>` —— 导出本表单的机器可读描述（按 OpenAI strict 限制裁剪的 JSON Schema）。async 因 `getOptions` 型选项需异步拉取后并入 enum。
- `setValues(partial: Partial<PO>): void` —— 按 key **就地 patch** 表单值。[MUST NOT] 换 `data` 容器引用（PO 容器父子同引用贯通，换引用当场断链）；只写配置内非 ignore 的 key，`undefined` / `null` 跳过（= 留空语义）。

### 关键类型

- `FormItemConfig<PO, SO, PK, PV, SV>`：单表单项配置——`key` / `label` / `labelHide` / `tip` / `layout` / `wrapProps` / `props` / `render` / `rules` / `init` / `parse` / `stringify` / `ignore` / `hide` / `beLink` / `extra`，以及 AI 填充三个可选字段 `type`（数据类型）/ `description`（选型描述，复用 `CoreConfigDescription`）/ `aiIgnore`（schema 导出排除）
- `FormItemConfigList<PO, SO>`：表单项配置数组（`FormMain.list` 的类型）
- `FormItemConfigExtra`：`extra` 快捷项——`isInput` / `isSelect`（OnlyOneKey 互斥）+ `enterSubmit` / `blurSubmit` / `changeSubmit`
- `FormItemLinkConfig<K, BV, OV>`：`beLink` 联动配置——`key` + `getValue(hostValue, ownValue, attachInfo)`
- `FormScope<PO, SO, ...>`：渲染 / 函数式配置的作用域——`{ data, config }`
- `ExtractFormStringifyFromObject` / `FromList`：从 `PO`+`SO` 提取序列化提交形态（类型级提取，剔除 symbol / never 键）

## AI 填充（数据层）

> 给「自然语言 → 自动填表」提供的机器可读出入口。**core 只做数据层**：schema 导出 + 值写回；
> 与模型对话 / 按钮入口 / 建议态与撤销等交互层归 bridge 注册的能力方（另期）。

### 配置字段（全部可选，存量配置零改动即可用）

| 字段          | 类型                                                                | 语义                                                                                                                                |
| ------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `type`        | `"string" \| "number" \| "integer" \| "boolean" \| "array"`         | 数据类型。解析优先级：**显式 > `init` typeof 推导 > 兜底 `"string"`**。语义类型（人名/金额）写进 `description`，[MUST NOT] 另开字段 |
| `description` | `CoreConfigDescription`（`{suitable?, unsuitable?}`，复用主题那套） | 选型描述精调位，拼进 schema property 的 description                                                                                 |
| `aiIgnore`    | `boolean`                                                           | 本项不出现在导出 schema（隐私面：label / 选项可能携客户名单、内部编码）                                                             |

### `getAiSchema()` 导出规则（OpenAI strict 裁剪）

- **property key = 配置 key**（key 是身份，description 是语义；`setValues` 按同一 key 写回，零映射环节）。
- **所有字段进 `required`**；每字段形如 `anyOf: [载荷, { type: "null" }]`——`null` = 留空通道（模型不确定就留空，[MUST NOT] 幻觉填值）。
- `additionalProperties: false`；嵌套 ≤5 层、属性 ≤100（超出截断 + console.warn）。
- **description 拼装** = `label`（必有）+ `tip`（**仅 string 形态**，`() => VNode` 序列化不了）+ `description.suitable / unsuitable` + 选项 label 清单。
- **选项三形态**（读取解析后的 item `props`）：`options`（静态）与 `getOptions`（异步一次性，故本方法 async）→ 导出 `enum` + 选项 label；`remoteMethod`（搜索驱动）无法穷举 → **不导出 enum**，退化为带 description 的 string。enum 仅在选项值类型均一（全 string / 全 number）时挂。
- **过滤**：`ignore`（含 `__` 全大写 key 约定，判据同 `checkFormItemIsIgnore` 单一真相源）、`hide` 为真（隐藏字段用户看不见，AI 填值 = 用户不知情提交）、`aiIgnore` 为真的项均不导出。
- **期一只支持标量 + 字符串数组**：显式 `type:"array"` 或 init 推导为非空全字符串数组 → `items:{type:"string"}`；嵌套结构（`FormItemNestForm` / `FormItemNestFormList`，init 为对象 / 对象数组）**暂不支持**、不导出。
- 🔴 `pattern` / `format` / `minLength` 等校验关键字**不被模型执行** ⇒ 校验 [MUST NOT] 指望 schema，一律回落表单自己的 `rules`（AI 填完照常走 `validate()`）。

### `setValues(partial)` 写回规则

- 按 key **就地 patch**：`data[key] = value` 逐 key 写，[MUST NOT] 整体替换 `data` 容器（引用贯通命脉）。
- 只写配置内非 ignore 的 key（AI 幻觉出的未知 key 不落容器）；`undefined` / `null` 跳过 = 留空语义（要清空传该字段类型的空值 `""` / `[]`）。
- 写回后 [MUST NOT] 自动提交——校验 / 提交仍由消费方显式触发。

## AI 填充（交互层，批次 e9dzn4）

数据层（`getAiSchema` / `setValues`）之上的开箱交互。**gf9z3w 控制反转终态**：
core 只出「插座 + 落表」——挂点（DragFloat 可拖拽）+ 显隐 + `getSchema` 组装 +
`onData` 落表/高亮/撤销机制；**全部 AI 交互 UI（popup / prompt / LLM 调用 / 错误 /
撤销按钮）归 bridge 注册的触发组件**（如 forge-agent `LlmJsonTrigger`，或任何满足
duck 契约的组件）。

- **入口**：bridge 注册的触发组件经 `DragFloat` 挂载在根表单右上——**可在表单矩形内
  拖拽避让**（trsf36）、自带呼吸光影。显隐 = 「触发组件可用（bridge `aiFillTrigger`
  响应式 ∥ `aiFillTrigger` prop 局部覆盖）&& 非嵌套实例 && `aiFill !== false`」。
  - **嵌套实例恒关**（C1 / C4 内的子 FormMain 经父 registry 自判）——嵌套结构本就
    不进 schema，出 N 个入口只会误导。
  - **`FormSearch` 自 trsf36 起默认同自动档**（api 可用即出；透传时自动拼接
    「筛选条件表单」形态语义），`aiFill: false` 可关；填充后 [MUST NOT] 自动触发搜索。
  - 组件级 `aiFill: false` 局部否决。
  - **description 策略位**：bridge `aiFillRequireDescription: true` 时，未配
    `description` 的表单不出触点（默认 false = 照出 + console.warn 一次提示补描述；
    `FormSearch` 自报家门天然豁免）。
- **表单目标描述 `description`**（trsf36）：`string | CoreConfigDescription`——
  告诉 AI 这个表单是做什么的，落 `getAiSchema()` 产出的 **schema 顶层 `description`**
  （string 直用；对象形态拼「适用：…／不适用：…」；缺省不输出该字段）。
  `FormSearch` 同名 prop 透传并**自报家门**（组件补形态语义，用户描述管业务）。
- **duck 契约（core 喂给触发组件）**：`getSchema`（= `getAiSchema()`，含 description
  组装）+ `onData(data) → { appliedCount, undo }`——core 按 `setValues` 同判据落表、
  实际写入项背景闪烁高亮、建撤销快照后回执；撤销按钮由触发组件展示。
- **填充 = 直接写入 + 高亮 + 整体撤销**（甲方拍定；逐字段建议态不做）。**绝不自动提交**。
- 通道详见 bridge 文档「AI 填充触发组件」；demo：`/form/ai-fill`。

## 分组 / 分割线 / 折叠（伪 item，批次 e9dzn4）

**机制 = 伪 item**：`ignore` 语义（key `__` 前缀全大写天然命中 `checkFormItemIsIgnore`）让它
**数据层被忽略**（不进 generate / parse / stringify / AI schema），视觉照常渲染。
配置数组里**标题与组内项同级扁平**，仅视觉呈父子——转换全在工具方法层，不改数据结构。

```ts
import {
  swiftFormItemGroup,
  swiftFormItemDivider,
} from "@done-coding/forge";

const list = [
  ...基础字段,
  swiftFormItemDivider(),
  ...swiftFormItemGroup("高级选项", [advA, advB], { defaultCollapsed: true }),
];
```

- `swiftFormItemGroup(title, items, options?)` → `[标题伪 item, ...items]`（扁平展开）。
  - 标题伪 item **恒 `span: 24` 不可配**；分割线同理。
  - `options`：`defaultCollapsed`（默认 `false`）/ `collapsible`（默认 `true`）/ `key`
    （伪 item key 覆盖，[MUST] `__` 前缀全大写；缺省内部自增 `__GROUP_<n>`）。
  - **折叠 = 组内项 `hide` 置真**（复用「隐藏 + 跳校验」完整语义：折叠区必填项不拦提交、
    错误自动清除），[MUST NOT] 另造 display 显隐通道。成员原有 `hide`（布尔 / 函数）与
    折叠态**或**合成。
  - 折叠态**按 FormMain 实例隔离**（内部按 `data` 对象身份建态）——同一份配置喂多个表单
    （如 C4 行列表）互不串态；非受控为主，无受控口。
  - **嵌套分组（组里再套组）一期不支持。**
- `swiftFormItemDivider()` → 分割线伪 item（`ElDivider`，恒整行）。
- 伪 item 已调掉表单项校验预留（`margin-bottom` 收敛）与 label 占位。

## 反模式 / 注意

- **手写嵌套子表单 render**：嵌套子表单（C1 / C4）与 `nestFormItem` / `nestFormItemList` helper 是既定通道，`FormItem` 未导出（仅 FormMain 内部）——[MUST NOT] 手写内联子表单 render 绕开注册机制（会失去级联 validate / clear / reset）
- **变更 loading 中提交**：表单项处于变更 loading（`FORM_ITEM_CHANGE_LOADING` Symbol 标记，如上传在途）时，`validate()` 直接 reject——提交被闸住，[MUST NOT] 绕过 validate 直发提交
- **`layout` 与单项 `layout` 关系**：整体 layout 是兜底，单项 `layout` 优先（单项未设才吃整体）
- **三方法成对使用**：初值 / 回填 / 提交永远走 `generateFormData` / `parseFormData` / `stringifyFormData`（或 expose 三方法），避免手工拼对象破坏 round-trip

## 关联

- 表单族：`FormSearch`（搜索前缀，折叠 + 操作区）、`FormSubmitPanel`（提交面板）、`FormSubmitBtn`（提交按钮）、`FormItemNestForm`（C1 嵌套子表单）、`FormItemNestFormList`（C4 行列表）、`FormSelect` / `FormRadioGroup` / `FormTree` / `FormVerifyImage` / `FormVerifyCode`（单项形态）
- utils 公共函数：`generateFormData` / `parseFormData` / `stringifyFormData`、`getVModelSugar`、`getPlaceholder`、`getEnterSubmit` / `getBlurSubmit` / `getChangeSubmit`、`getDatePickerShortcuts`、`swiftFormItemConfig`、`resolveFormLayout`、`resolveLayoutSpan`、`ceilToTier`、`NEST_LAYOUT_TIERS`、`setInputComponent` / `setSelectComponent`、`FORM_ITEM_CHANGE_LOADING`（Symbol）
- helpers：`nestFormItem`（C1 配置生成）、`nestFormItemList`（C4）、`createNestFormExposeMap`、`useNestForm`、`useNestFormList`、`useNestLayoutScale`
- 内部 provide：`FORM_NEST_REGISTRY_KEY`（嵌套 expose 注册）、`NEST_LAYOUT_SCALE_KEY`（布局 rebase）
- 范式页：`apps/reference/src/pages/form/guide/`、`pages/form/nest-form/`（C1）、`pages/form/nest-form-list/`（C4）

## 内部契约整理（30mf7k 第一批）

嵌套注册协议在底座 `types/nest-form.ts` 定义：validate 返回 `Promise<void>`，clearValidate 接收可选 key，resetFields 无参；`FormMainInstance` 的对应方法沿用该协议。根导出和 FORM_NEST_REGISTRY_KEY 的 Symbol.for 字符串不变。

> 目录迁移：实现与配套收纳到 `components/form/form-main`，包根 API 与演示能力保持。

## bridge 事件

| 事件           | 触发时机                              | 载荷                   |
| -------------- | ------------------------------------- | ---------------------- |
| `form-valid`   | 本实例完整 validate（含子表单）成功后 | 无                     |
| `form-invalid` | 本实例规则校验失败，过滤隐藏项后      | `{ fields: string[] }` |

fields 仅包含本实例的错误字段 key；子表单自行报告，父层不拼路径或重复报告子错误。上传中、实例未就绪等异常不作为字段错误报告。程序调用 validate 同样覆盖；不改变原 Promise 与 reject 对象。

复用 core `useBridgeReport`；无订阅且 signal 镜像关闭时不求值 data thunk，不新增监听或定时任务。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-form`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。

## 回车与失焦提交

`extra.enterSubmit` 与默认开启的 `extra.blurSubmit` 可共存。回车提交后由该次回车触发的失焦只跳过一次，之后重新聚焦再失焦仍提交。`enterSubmit` 仅允许写入 extra；FormItemConfig 顶层定点禁止此键，其余扩展键兼容保持。
