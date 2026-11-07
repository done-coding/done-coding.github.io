# FormSearch（搜索表单）

> FormMain 的搜索前缀：自带折叠（maxRows 按真实几何换行）+ 内置操作区（展开更多 / 重置 / 查询），search emit 自动并入静态参数。
> 范式页：`apps/reference/src/pages/nav/menu/showcase/`（独立裸用）；ListLayout 内嵌场景见 `apps/reference/src/pages/layout/list-layout/guide/`

## 定位

- **空间一等公民是 `ListLayout` 的搜索侧**：常规列表页 [MUST] 走 `ListLayout`（内部即「FormSearch + TableMain」组合，搜索侧 props 双子扁平化、`staticQuery` 提升为直属 prop）——**FormSearch 一般不直接使用**
- **独立裸用仅当**：纯搜索区页面/组件（无表格，配合外部触发查询）
- **何时不用**：普通录入表单用 `FormMain`；带提交 / 取消操作区的用 `FormSubmitPanel`
- 与 FormMain 的差异：`rowGutter` 默认 14（FormMain 为 8）、`layout` 默认 `{xs:24, sm:12, md:12, lg:8, xl:6}`、`maxRows` 折叠、内置操作区按钮、`staticQuery` 并入 emit、expose 增 trigger 与折叠控制
- 根节点为 WatchSize 包裹的 `.form-search`，`inheritAttrs: false`（attrs 显式转发内层 FormMain）

## 快速上手（最小可用）

最小搜索表单（list / data / @search 即完整）：

```html
<FormSearch :list="list" :data="data" @search="(q: any) => (query = q)" />
```

**要点**：

- `@search` 载荷 = 表单序列化结果 `ExtractFormStringifyFromObject<PO, SO>` **并上 `staticQuery`**——静态参数天然并入，无需手工拼接
- 折叠（`maxRows` 默认 2 收起）+ 展开更多 / 重置 / 查询操作区内置默认即生效，零配置
- 单项覆盖走具名槽 `#<config.key>`，scope 是 FormItem 内部 mainProps——`v-bind="scope"` 直透给组件即可

## 能力边界 / 按需使用

- **默认即够用：`list` + `data` + `@search` 即为完整搜索形态**（折叠 + 操作区内置）。以下全部按需开：
- `staticQuery`：默认未设即够用；仅当有非表单静态参数（如固定状态筛选）需并入搜索载荷才设。
- `maxRows`：默认 `2`（收起折叠）即够用；`0`=不折叠全展开，仅当搜索项少 / 页面想全显才设。
- 具名槽 `#<config.key>`：默认关（单项由配置驱动）；仅当单项需要完全自定义渲染（复杂组合控件）才开。
- `compact`：默认关；仅当搜索区落入受限窄栏（独立侧栏搜索）才开——窄栏场景优先容器断点系（`compact` / `layoutByContainer`），而非给单项 layout 写死 span。
- `layoutByContainer`：默认关；仅当容器断点折叠几何需要切到容器档才开。
- expose `triggerSearch()` / `triggerReset()` / `toggleCollapse()`：默认不需要（操作区按钮内置）；仅当外部需程序化触发（如 ListLayout 列插槽注入）才用。
- **AI 填充（trsf36 起默认自动档）**：api 可用（bridge 注册 `aiFillApi` ∥ `aiFillApi` prop）
  即出悬浮触点；`aiFill: false` 关（ListLayout 经 `formSearchProps` 透传）。`description`
  prop 描述本搜索面向的业务（如「用户列表的筛选条件」），组件透传时**自报家门**——
  自动拼接「列表筛选条件表单：把用户意图映射为筛选条件字段，未提及的条件留空」形态语义。
  填充只落条件值，[MUST NOT] 自动触发搜索（查询仍由用户点）。
- **完整能力演示**（staticQuery + 多 slot 覆盖 + 折叠回调）：`apps/reference/src/pages/nav/menu/showcase/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（泛型 `PO` 解析 / `SO` 格式化 / `SQ` 静态参数，`FormSearchProps<PO, SO, SQ>` = FormMainProps + 以下）

| name                | type                                 | 默认                                     | 语义                                                                                            |
| ------------------- | ------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `list`              | `FormItemConfigList<PO, SO>`（必填） | —                                        | 同 FormMain，透传                                                                               |
| `data`              | `PO`（必填）                         | —                                        | 同 FormMain，透传                                                                               |
| `layout`            | `Partial<ColProps>`                  | `{xs: 24, sm: 12, md: 12, lg: 8, xl: 6}` | 同 FormMain，默认值不同（搜索三列感）                                                           |
| `rowGutter`         | `number`                             | `14`                                     | 同 FormMain，默认值不同（FormMain 为 8）                                                        |
| `layoutScale`       | `number`                             | `1`                                      | 已声明 prop 不入 attrs 且未显式转发——**实际不传递**（内层 FormMain 恒吃默认 1），消费方传了无效 |
| `layoutByContainer` | `boolean`                            | `false`                                  | 开启时折叠几何引擎断点源一并切到容器档                                                          |
| `labelPosition`     | `"right" \| "left" \| "top"`         | `"right"`                                | 标签位置                                                                                        |
| `labelWidth`        | `string`                             | `"auto"`                                 | 标签宽度                                                                                        |
| `staticQuery`       | `SQ`                                 | 未设                                     | 静态参数（非表单非分页），并入搜索 emit 结果                                                    |
| `maxRows`           | `number`                             | `2`                                      | 收起态最多渲染视觉行数（含操作区行），0=不折叠全展开；按真实几何换行计算                        |
| `compact`           | `boolean`                            | `false`                                  | 受限窄栏模式：统一单列 span24 + label 置顶，maxRows 仍外部可控                                  |

### Emits

| 事件            | 载荷                                                                              | 语义                                                                                     |
| --------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `search`        | `data: ExtractFormStringifyFromObject<PO, SO> & SQ`；`type: FormSearchSearchType` | 查询 / 重置 / 单项提交触发（`"search"` / `"reset"` / `"blur"` / `"change"` / `"enter"`） |
| `heightChange`  | `number`                                                                          | 折叠 / 展开容器高度变化                                                                  |
| `visibleChange` | `boolean`                                                                         | 显隐变化                                                                                 |

### Slots

| 槽              | scope                   | 语义                                                                        |
| --------------- | ----------------------- | --------------------------------------------------------------------------- |
| `#<config.key>` | FormItem 内部 mainProps | 覆盖搜索单项（透传 FormMain）                                               |
| `#default`      | —                       | ⚠️ 被内置操作区按钮（展开更多 / 重置 / 查询）占用，消费方默认插槽不会被转发 |

### Expose（`FormSearchInstance<PO, SO>`，extends `Omit<FormMainInstance, "generate" \| "parse" \| "stringify">`）

继承：`validate()` / `resetFields()` / `clearValidate(key?)`（无三方法——搜索无 round-trip 需求）；新增：`triggerSearch()` / `triggerReset()` / `toggleCollapse(nextValue?)` / `isCollapsed: ComputedRef<boolean>`。

## 反模式 / 注意

- **用 `#default` 插自定义按钮**：默认槽被内置操作区占用，不会渲染——自定义操作走 expose 的 trigger 方法，或交给 ListLayout / 外层编排
- **`@search` 后手工再并 staticQuery**：载荷已含静态参数，再拼一次会重复
- **class 定向落点**：`inheritAttrs: false` + attrs 显式转发内层 FormMain——消费方 class 落在内层 ElForm，而非 `.form-search` 根（WatchSize 包裹）；定向样式按实际落点写选择器
- **窄栏场景改 layout 硬撑**：`compact`（或 `layoutByContainer`）走容器断点几何，与 ElCol 的视口响应式不同源——窄栏挤崩场景优先容器断点系，而非给单项 layout 写死 span

## 关联

- 表单族：`FormMain`（底座，本组件为其搜索前缀）、`FormSubmitPanel` / `FormSubmitBtn`（提交面）、`FormItemNestForm` / `FormItemNestFormList`（嵌套）
- 组合页：`ListLayout`（内部即「FormSearch + TableMain」，搜索侧 props 双子扁平化；`staticQuery` 被扁平提升为直属 prop，禁放 formSearchProps 内）
- 类型：`FormSearchSearchType` = `"search" \| "reset" \| FormItemSubmitType`；`FormSearchInstance<PO, SO>`
- 范式页：`apps/reference/src/pages/nav/menu/showcase/`、`pages/layout/list-layout/guide/`

> 目录迁移：实现与配套收纳到 `components/form/form-search`，包根 API 与演示能力保持。

## bridge 事件

| 事件            | 触发时机                       | 载荷                                               |
| --------------- | ------------------------------ | -------------------------------------------------- |
| `search`        | 查询/字段提交入口，validate 前 | `{ type }`（search / change / enter 等原提交类型） |
| `search-reset`  | 重置入口，resetFields 前       | 无                                                 |
| `search-toggle` | 展开/收起状态实际改变后        | `{ collapsed: boolean }`                           |

程序 triggerSearch/triggerReset/toggleCollapse 同样覆盖；初始化及重复设置相同折叠值不发。重置只发 search-reset，不额外发 search；业务 search emit 仍携带 query 与 reset。查询意图不等于校验或业务成功，原方法返回与错误传播不变。

复用 core `useBridgeReport`；无订阅且 signal 镜像关闭时不求值 data thunk，不新增监听或定时任务。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-form`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
