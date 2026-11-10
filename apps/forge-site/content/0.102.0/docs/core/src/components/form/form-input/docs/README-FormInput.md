# FormInput（输入框原语）

> el-input 全透传包装 + password 形态浏览器自动填充治理（`passwordAutoComplete` prop）。除治理点外 props / slots 全量透传 el-input，零收窄。
> 范式页：`apps/reference/src/pages/form/input/showcase/`（五形态对照 + 组合链路）。

## 定位

- **password 形态的浏览器自动填充治理点**：apiKey / 账号密码录入等非登录表单字段被 Chrome 误填时，用 `passwordAutoComplete` 治理
- **独立裸用当**：需要密码形态且与浏览器密码管理器交互受控的输入框
- **何时不用**：普通输入直接用 el-input；真登录页**接受**浏览器填充（用户主动保存 = 期望被填，拦它违背设计意图）

## 快速上手（最小可用）

```html
<FormInput v-model="secret" type="password" password-auto-complete="api-key" />
```

**要点**：

- 字符串值（`api-key` / `new-password` / `off`）→ 密码输入框 `autocomplete` 设为此值。**默认推荐 `api-key`**——规范外词条 Chrome 不识别，实测全程未触发直接填充；`off` 是 el-input 密码形态默认值、Chrome 有意无视（不可靠）；`new-password` 实测出现过直接填充
- `number N` → 不设置 autocomplete；透传 el-input 的 type 初始 `text`（无密码语义不触发填充），延迟 N ms 后恢复 `password`（避开 Chrome 加载期 autofill 探测窗口；点击填充拦不住，属浏览器正常交互）。text 窗口内组件内部屏蔽 EP `show-password` 强制坑（EP `showPassword=true` 会强制 type=password，恢复后显隐照常）
- 不传 → 不设置 autocomplete（保持 el-input 默认行为）

## 能力边界 / 按需使用

- **默认即够用：`passwordAutoComplete` 不传即为普通 el-input 包装**。以下按需开：
- `passwordAutoComplete="api-key"`：非登录表单密码字段防填充首选（规范外词条最可靠）
- `passwordAutoComplete={N}`（number）：需要连「加载填充」也拦截时（api-key 词条已拦不住时）；N=0 即挂载即切
- `show-password`：显隐切换照常透传（number 延迟窗口内被组件内部屏蔽、恢复后可用）
- **影分身（表头漏斗）用 `FormInputShadowClone`**（本组件 + 影分身包装，薄包装纯粹性——影分身能力不内嵌本组件）：列表页表格头预埋容器内显示漏斗图标，点击 popover 弹输入框，同一 v-model 与本体同源同步（与 FormSelectShadowClone 统一漏斗语义；「表头漏斗 = 点这里筛选」）
- 实测反模式（[MUST NOT] 重复踩）：`autocomplete="off"`（Chrome 有意无视）/ `new-password`（有过直接填充记录）/ text→mounted 立即切换（Chrome 异步 autofill 补填）/ trap input（Chrome 可见性检查穿透）——全部实测证伪，组件只提供上述两个可靠机制

## 依赖关系

- form 族内部组件，无跨族依赖（仅透传 el-input）；影分身版 `FormInputShadowClone` 依赖内部件 `FormShadowCloneDispatch` → display 族 `ShadowClone`（详见 README-FormShadowCloneDispatch.md）

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name                   | type                                             | 默认 | 语义                                                                      |
| ---------------------- | ------------------------------------------------ | ---- | ------------------------------------------------------------------------- |
| `type`                 | `string`                                         | —    | 透传 el-input（显式声明以判定密码形态）                                   |
| `showPassword`         | `boolean`                                        | —    | 透传 el-input 显隐切换（同上）                                            |
| `passwordAutoComplete` | `"api-key" \| "new-password" \| "off" \| number` | —    | 密码形态自动填充治理（见上）                                              |
| 其余                   | —                                                | —    | 全量 `$attrs` 透传 el-input（v-model / placeholder / clearable / 插槽等） |

### FormInputShadowClone（影分身版）

> 内部经 `FormShadowCloneDispatch` 实现：default 与 clone 两插槽各写一份 `<FormInput v-model="同一值" />` 同源绑定驱动双处视图一致；高亮判定在**本组件内部**（默认规则 + `isHighlighted` 覆盖）→ 经 dispatch `highlighted` 展示在漏斗 + 插槽作用域暴露。

| name            | type                          | 默认     | 语义                                                                                                                   |
| --------------- | ----------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `modelValue`    | `string \| number`            | —        | v-model（透传 FormInput；本体与分身弹层同源）                                                                          |
| `shadowClone`   | `boolean`                     | `false`  | 影分身开关（本体 + 分身 label+漏斗，点击 popover 弹输入框，同一 v-model 同源同步）                                     |
| `teleportTo`    | `string \| Element`           | —        | 分身目标容器（表头预埋唯一选择器；`shadowClone` 时生效，未配置不分身）                                                 |
| `label`         | `string`                      | —        | 分身位字段文字（表头列名；label + 漏斗整块展示、高亮整块——表格 headerRender 只需留 teleportTo 容器，列名由分身自带）   |
| `isHighlighted` | `(value: unknown) => boolean` | 默认判定 | 分身高亮判定方法（非必传），入参 modelValue；默认 = 非 `null` / 非 `undefined` / 非空字符串 → 高亮（label + 漏斗整块） |
| 其余            | —                             | —        | 全量 `$attrs` 透传 FormInput（密码治理等能力完整继承）                                                                 |

### Slots

| name | 语义                                                        |
| ---- | ----------------------------------------------------------- |
| 全部 | 透传 el-input 插槽（prefix / suffix / prepend / append 等） |

> 目录迁移：实现与配套收纳到 `components/form/form-input`，包根 API 与演示能力保持。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-form`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
