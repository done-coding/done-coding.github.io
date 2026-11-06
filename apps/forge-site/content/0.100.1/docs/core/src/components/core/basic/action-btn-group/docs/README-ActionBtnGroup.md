# ActionBtnGroup（配置驱动按钮组）

> 配置驱动按钮组：一个 configs 数组渲染一列按钮——`actionBtnProps` 走 ActionBtn（带确认闸门）或 `props` 走 ElButton（无闸门），`show` 控制显隐、`render` 自由接管。
> 范式页：`apps/reference/src/pages/basic/action-btn-group/showcase/`

## 定位

- **何时用**：表格操作列 / 工具栏堆按钮——按配置项数组驱动，多按钮零手写
- **何时不用**：单按钮直接用 `ActionBtn`
- 渲染三态（`ActionBtnConfigItem<Ctx>`）：`actionBtnProps`（走 ActionBtn，带 confirm/beforeOpen，与 props 二选一优先）/ `props`（走 ElButton，无闸门）/ `render`（对标 FormItem.render 三态，完全接管）

## 快速上手（最小可用）

挂载（`action-btn-group/showcase/Index.vue`）：

```html
<ActionBtnGroup :configs="scene1Configs" :ctx="row" />
```

单项配置（popconfirm 默认模式 + ctx 入参）：

```ts
{
  key: "1a",
  label: "1A：popconfirm（默认模式）",
  actionBtnProps: (c) => ({
    type: "warning",
    confirmConfig: { title: `归档 ${c.row.name}?`, type: "warning" },
    onClick: () => {
      lastAction.value = `1A popconfirm 归档：${c.row.name}`;
      ElMessage.success("已归档(popconfirm)");
    },
  }),
},
```

**要点**：

- `actionBtnProps` 与 `props` 二选一，`actionBtnProps` 优先（走 ActionBtn，带 confirm/beforeOpen）
- `ctx` 透传给每项 actionBtnProps/props/render/show——函数态统一入口
- Fragment 多根，[MUST NOT] 直接传 style attr（外层 [MUST] 包 div）

## 能力边界 / 按需使用

- **`actionBtnProps` 分支（走 ActionBtn，带闸门）：默认推荐。** 绝大多数操作按钮走它（confirm / beforeOpen / 自动 loading 白拿）；`props` 分支（裸 ElButton 无闸门）仅当按钮确实无需闸门且无需 ActionBtn 能力时才用——同项二选一（`actionBtnProps` 优先）。
- **`render`（完全接管）：默认不用。** 仅当按钮内容 / 结构超出 props 表达（自定义复合内容、非按钮形态）才用——对标 FormItem.render 三态（string / Component / (props) => VNode）。
- **`show`（显隐过滤）：默认全显（缺省 true）。** 仅当按钮需按上下文动态显隐（如选中行才出现的操作）才配 `(ctx) => boolean`。
- **`defaultSize`：默认不强加。** 仅当整组按钮需统一基础 size 时传；业务侧显式 size 优先（spread 在后覆盖）。
- **完整能力演示**（渲染三态 + show 过滤 + 多场景组合）：`apps/reference/src/pages/basic/action-btn-group/showcase/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（泛型 `Ctx` = 渲染上下文）

| name          | type                                            | 默认        | 语义                                                              |
| ------------- | ----------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| `configs`     | `ActionBtnConfigItem<Ctx>[]?`                   | `[]`        | 按钮配置列表                                                      |
| `ctx`         | `Ctx`（必填）                                   | —           | 渲染上下文，透传给每项 actionBtnProps/props/render/show           |
| `defaultSize` | `ActionBtnSize?`（"large"\|"default"\|"small"） | 不传=不强加 | 基础 size 注入；业务侧返回对象内显式 size 优先（spread 在后覆盖） |

**ActionBtnConfigItem\<Ctx\> 渲染三态**：

| 字段             | type                                                      | 语义                                                     |
| ---------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `key`            | `string`（必填）                                          | 项唯一键                                                 |
| `actionBtnProps` | `(ctx) => Record<string, any>`                            | 走 ActionBtn，带 confirm/beforeOpen；与 props 二选一优先 |
| `props`          | `(ctx) => Record<string, any>`                            | 走 ElButton，无闸门                                      |
| `label`          | `string?`                                                 | render 缺省时回退文案                                    |
| `render`         | `string \| Component \| ((props: { ctx: Ctx }) => VNode)` | 对标 FormItem.render 三态，完全接管渲染                  |
| `show`           | `(ctx) => boolean`                                        | false 跳过，缺省 true                                    |

### Emits

无

### Slots

无

### Expose

无

## 反模式 / 注意

- **直接给 Fragment 传 style attr**：[MUST NOT]——多根 Fragment 无法落 style，外层包 div
- **同项同配 actionBtnProps 与 props**：二选一（actionBtnProps 优先），语义混用易困惑
- **defaultSize 覆盖**：业务侧显式 size 覆盖注入（spread 在后），无需担心注入污染
- **无闸门语义**：`props` 分支是裸 ElButton——需要确认的按钮 [MUST] 走 actionBtnProps

## 关联

- 内部组件：`ActionBtn`（actionBtnProps 分支）
- 上游：`ListLayout.toolbar`（leftExtraButtons 即 ActionBtnGroup 配置形态）
- 范式页：`apps/reference/src/pages/basic/action-btn-group/showcase/`

> 目录迁移：本组件及配套归入 `components/basic/action-btn-group`；仅源码位置变化，包根导入、props、slots 与实例契约保持。

## bridge 事件（v0.35.0）

两分支都能报告 action-click。ActionBtn 分支传入 `{...显式groupMeta,key,index}` 并委托子组件，原生 ElButton 分支旁路发射、保持原组件及回调的返回值和异常。key 来自配置项，index 为过滤 show 后的渲染序号；rowKey 不从 ctx 猜测，只接受显式 groupMeta。隐藏或禁用项不发；Group 不重复报告子 ActionBtn。确认事件见 ActionBtn 文档。完整演示：`/other/integration/event-bus`。
