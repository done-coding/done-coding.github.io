# ModalConfirm（配置化确认弹窗 / 抽屉）

> 确认型弹层原语：modal / drawer 双形态一键切换，确认/取消走 Promise 契约（返回 false 不关、resolve 关）。
> 范式页：`apps/reference/src/pages/feedback/modal/confirm/showcase/`（双形态 + $attrs 透传实证）

## 定位

- **何时用**：操作确认、轻量表单提交、任意「弹窗/抽屉外壳 + 自定义内容」场景
- **何时不用**：复杂表单提交用 `ModalForm`；完整 CRUD 用 `ModalDetail`；「架子 + 注册表」命令式弹窗体系用 `ModalShelf` + `ModalPorter`
- 关键机制：`onClose`/`onCancel`/`onConfirm` 是 **props 不是 emits**（onXxx props 约定），确认/取消回调返回 `Promise<boolean|void>` 时——返回 `false` 不关闭、reject 不关闭、resolve 关闭
- `inheritAttrs: false` + 全量 `v-bind $attrs` 透传底层 ElDialog/ElDrawer：未声明 EP prop（如 `draggable` / `destroy-on-close`）直达底层

## 快速上手（最小可用）

常规确认弹窗零配置——默认 modal 形态 + 宽 420 + 自动关窗：

```vue
<ModalConfirm
  v-model:show="show"
  title="操作确认"
  :on-confirm="onConfirm"     <!-- 异步 → 自动 loading 转圈，resolve 关窗 -->
/>
```

**要点**：

- `show` 必传（`v-model:show`）；关闭路径：点确认/取消/遮罩/ESC/右上角关闭 → 统一收敛到 `onClose(status)`，`status=true` 表示因确认关闭
- 提交类确认让 `onConfirm` 返回 Promise 并配 `use-loading`：等待期按钮自动转圈，reject 不关窗（错误留在原地展示）、resolve 关窗

## 能力边界 / 按需使用

- **默认即够用：modal 居中 + 宽 420 + 确认/取消自动关窗**——绝大多数确认弹窗只传 `show`/`title`/`onConfirm`。
- `layerType="drawer"`：仅当确认内容需要抽屉形态（侧滑、大尺寸自绘内容）时开；drawer 下 `width` 语义变为抽屉尺寸（size），`direction` 控制开合方向（仅 drawer 生效）。
- `modalReserve`：默认 `200`（弹层可用高 = innerHeight − 200）即够用；仅当弹层内嵌表格/表单需要更高可用视口时调小（联动 TableMain 高度链）。
- `use-loading`：仅当 `onConfirm` 返回 Promise 时配；同步确认无需。
- `headerDivider`/`footerDivider`：默认随形态（drawer=true / modal=false）；仅需显式覆盖时传。
- `#footer` 自绘操作区：仅当默认底部按钮不满足（需要自绘布局/额外内容）时用，scoped 提供 `{cancelHandler, confirmHandler, loading}`。
- **完整能力演示**（双形态切换 + 异步确认 + 分割线 + $attrs 透传）：`apps/reference/src/pages/feedback/modal/confirm/showcase/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（内联 defineProps，无 types.ts）

| name                 | type                                   | 默认                              | 语义                                                                                                                                                                                                                                                                                                      |
| -------------------- | -------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `show`               | `boolean`（必传）                      | —                                 | 可见性（v-model:show）                                                                                                                                                                                                                                                                                    |
| `showClose`          | `boolean`                              | `true`                            | 右上角关闭按钮                                                                                                                                                                                                                                                                                            |
| `onClose`            | `(status?: boolean) => void`           | —                                 | 关闭回调，status = 是否因确认关闭                                                                                                                                                                                                                                                                         |
| `onCancel`           | `() => void \| Promise<boolean\|void>` | —                                 | 取消回调；返回 false 则不关闭                                                                                                                                                                                                                                                                             |
| `onConfirm`          | `() => void \| Promise<boolean\|void>` | —                                 | 确认回调；返回 false 不关闭、reject 不关闭，resolve 关闭并传 status=true                                                                                                                                                                                                                                  |
| `title`              | `string \| (() => VNode\|VNode[])`     | —                                 | 标题                                                                                                                                                                                                                                                                                                      |
| `content`            | `string \| (() => VNode)`              | —                                 | 正文                                                                                                                                                                                                                                                                                                      |
| `cancelText`         | `string \| (() => VNode)`              | `"取消"`                          | 取消按钮文案                                                                                                                                                                                                                                                                                              |
| `confirmText`        | `string \| (() => VNode)`              | `"确定"`                          | 确认按钮文案                                                                                                                                                                                                                                                                                              |
| `hiddenCancel`       | `boolean`                              | `false`                           | 隐藏取消按钮                                                                                                                                                                                                                                                                                              |
| `hiddenFooter`       | `boolean`                              | `false`                           | **整块隐藏 footer**（操作区容器一并不渲染）。用于「只要弹层容器、不要确认-取消」的场景（如列表详情范式的详情抽屉）。EP 的 dialog / drawer 都按 footer 插槽存在与否渲染容器，故这里是**真不渲染**；[MUST NOT] 改用「传空 `#footer` 插槽」绕——那会留一条带 padding 的空条（drawer 实测 56px）               |
| `hiddenHeader`       | `boolean`                              | `false`                           | **整块隐藏 header**（标题区 + 关闭按钮）。两形态实现不同（EP 使然）：`drawer` 走 EP 原生 `with-header=false` → 节点真不渲染；`modal` 的 `el-dialog__header` **无条件渲染**，只能由 `dc-confirm-modal_hidden-header` 类 `display:none` 兜。⚠️ 隐藏后失去关闭按钮，[MUST] 自备关闭入口（遮罩 / ESC / 自绘） |
| `width`              | `number \| string`                     | `420`                             | modal = 弹窗宽度 / drawer = 抽屉尺寸（size）                                                                                                                                                                                                                                                              |
| `reverse`            | `boolean`                              | `false`                           | 反转按钮位置                                                                                                                                                                                                                                                                                              |
| `closeOnPressEscape` | `boolean`                              | `true`                            | ESC 关闭                                                                                                                                                                                                                                                                                                  |
| `closeOnClickModal`  | `boolean`                              | `true`                            | 点击遮罩关闭                                                                                                                                                                                                                                                                                              |
| `useLoading`         | `boolean`                              | —                                 | 确认按钮 loading（onConfirm 返回 Promise 时转圈）                                                                                                                                                                                                                                                         |
| `type`               | `ButtonProps["type"]`                  | `"primary"`                       | 确认按钮 type                                                                                                                                                                                                                                                                                             |
| `layerType`          | `"modal" \| "drawer"`                  | `"modal"`                         | modal = ElDialog 居中弹窗 / drawer = ElDrawer                                                                                                                                                                                                                                                             |
| `direction`          | `"rtl"\|"ltr"\|"ttb"\|"btt"`           | `"rtl"`                           | drawer 方向（仅 drawer 生效）                                                                                                                                                                                                                                                                             |
| `headerDivider`      | `boolean`                              | 按形态：drawer=true / modal=false | header 下分割线                                                                                                                                                                                                                                                                                           |
| `footerDivider`      | `boolean`                              | 按形态：drawer=true / modal=false | footer 上分割线                                                                                                                                                                                                                                                                                           |
| `modalReserve`       | `number`                               | `200`                             | modal 形态弹层体可用高视口预留 px（provide SCOPE_VIEWPORT_MAX_HEIGHT = innerHeight − modalReserve）                                                                                                                                                                                                       |

### Emits

| 事件          | 载荷      | 语义                  |
| ------------- | --------- | --------------------- |
| `update:show` | `boolean` | 可见性同步（v-model） |

⚠️ `onClose`/`onCancel`/`onConfirm` 是 props 不是 emits（onXxx props 约定）。

### Slots

| 槽             | scope                                      | 语义                                  |
| -------------- | ------------------------------------------ | ------------------------------------- |
| 默认           | 无                                         | 正文（content prop 之外的自绘内容区） |
| `#title`       | 无                                         | 标题                                  |
| `#main-header` | 无                                         | 头部区域（含标题）                    |
| `#main-footer` | 无                                         | 底部区域（含按钮）                    |
| `#footer`      | `{cancelHandler, confirmHandler, loading}` | 完全自绘操作区                        |

### Expose

无。`inheritAttrs: false` + 全量 `v-bind $attrs` 透传底层 ElDialog/ElDrawer（未声明 EP prop 如 `draggable`/`destroy-on-close` 直达）；provide `BODY_CONTENT_VIEWPORT_HEIGHT`（老 key）+ `SCOPE_VIEWPORT_MAX_HEIGHT`（新 key）。

## 抽屉的 chrome 面貌（v0.32.0）

三段结构的观感由三样东西撑起来，**[MUST] 一起看**：

| 项                       | 取值                                                                     | 为什么                                                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **分割线**               | `var(--dc-core-border-color, var(--el-border-color))`                    | 走规则 14 的两类来源 ⇒ **切主题 / 切亮暗时跟着变**。此前是**裸 `--el-border-color-lighter`**：主题系的 `borderColor` 映射到 `--el-border-color`，它读的是另一个变量 ⇒ 换主题时这条线纹丝不动 |
| **header / footer 面色** | `var(--dc-core-surface, var(--el-bg-color))`                             | 与正文分出层次                                                                                                                                                                               |
| **三处 padding**         | 横向三处同取**外圈档**；纵向正文取**外圈档**、header/footer 取**呼吸档** | 接回间距阶梯（原先写死 `16/20/12 + 20`，改 gap 基数 / 密度档时一律不动）                                                                                                                     |

🔴 **面色与分割线互为保底，[MUST] 两个都要**：单靠色差在暗色下不够 ——
本仓实测 `ground ↔ surface` 色差**亮 18 / 暗仅 10**。
🔴 **[MUST NOT] 把分割线改成阴影**：本仓去框化那次的原话「暗色下投影不可见、只剩灰框」。
🔴 **横向三处同值不可拆**：标题 / 正文 / footer 的**左缘恒对齐** ——
让 chrome 取呼吸档而正文取外圈档会差一档，本仓为这条对齐专门返工过。

### 🔴 抽屉正文取**底色**，modal 正文仍是**面**（v0.32.0）

三段层次：**chrome 面 / 正文底 / 正文里的卡再成面**。

| 形态       | 正文底                         | 正文里的组件（`TableMain` / `DataGridView` / `InfiniteListView` / `FormSubmitPanel`） |
| ---------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| **drawer** | **底色**（`--dc-core-ground`） | **自持面**（v0.32.0 起恢复）                                                          |
| **modal**  | 面（EP 的 overlay 档）         | **不二次成面**（逐字不变）                                                            |

这靠**两个不同的槽位标**实现：`SlotRegion.ModalConfirm_Body`（modal）与
`SlotRegion.ModalConfirm_DrawerBody`（drawer）。
🔴 **[MUST NOT] 合成一个标再反转它的含义** —— 那个标的语义一直是「**你脚下是一块面**」，
抽屉正文改成底之后它就不再是那个意思了；反转含义会把 modal 形态一起改掉，
而 modal 那儿的自动关面是**对的**。

⚠️ **两档都 provide 有界可用高** ⇒ `ViewLayout` / `TabsMain` 的 `refine` 默认
**两个档都列**，漏一个就是「抽屉里掉回自然流」。

⚠️ **暗色下单靠色差不够**（`ground ↔ surface` 实测亮 18 / 暗仅 10）——
三段层次 [MUST] 与 header/footer 的**分割线一起**看，[MUST NOT] 因为加了底色就撤线。

### 下游：既有的显式 `surface: false` 要撤

抽屉 → `ListLayout` → `TableMain` 这种**隔了容器**的场景，此前自动关面**够不着**
（`useContextDefaults` 只读直系父 DOM）⇒ 使用方得手动传 `surface: false` 兜着。
正文改底色后**那份手动补偿反过来了**：现在传 `false` 会让内容**摊在底色上**。
⇒ **撤掉它**（撤了就是对的）。

### padding 为什么必须落在 `.el-drawer__body`

被观测的正是 `__body`（内容可用高 = 它的 `contentRect.height`，已扣其 padding）
⇒ 改它的 padding，provide 出去的可用高**自动跟上、零 JS 改动**。

🔴 **[MUST NOT] 挪到 `.confirm-modal__content`（子元素）**：那份 padding 在被量的盒子
**里面**、不会从可用高里扣 ⇒ 内部 `ListLayout` / `ViewLayout` 拿到的可用高多出 2×padding
⇒ **每个抽屉恒溢出**（v0.28 修过的「refine 四类恒定溢出」第三类）。

ℹ️ 值经 `:style` 以 CSS 变量挂在弹层元素上，**[MUST NOT] 改用 `v-bind()`** ——
打这些 EP 结构类的样式块是**非 scoped** 的、目标元素被 teleport 到了 body，
而 `v-bind()` 的变量挂在**组件根**上，够不着。

## 反模式 / 注意

- **关闭回调命名三件套是 props**：`onClose`/`onCancel`/`onConfirm` 走 props 传（`:on-confirm="..."`），不是 `@confirm`；emit 侧只有 `update:show`
- **onConfirm 的 false / reject 语义**：返回 `false` 不关闭、reject 不关闭（错误留窗内展示）、resolve 关闭——三条路径别写混
- **`closeOnClickModal` / `closeOnPressEscape` 默认开**：误触遮罩/ESC 即关，需要「不可轻易关闭」的强确认场景显式关掉
- **`headerDivider` / `footerDivider` 默认随形态**：drawer=true / modal=false；直接不传会得到形态默认值，别以为「没传就是没有」
- **`direction` 只在 drawer 生效**：modal 形态传了不报错也不生效
- **老 key 并存**：`BODY_CONTENT_VIEWPORT_HEIGHT`（老）+ `SCOPE_VIEWPORT_MAX_HEIGHT`（新）双 provide，消费新 key 即可

## 关联

- 弹层族：`ModalForm`（组合 ModalConfirm + FormMain 做表单提交）、`ModalDetail`（CRUD 预设薄壳，内部委托 ModalForm）
- 命令式弹窗体系：`ModalShelf`（架子 + level 层级）+ `ModalPorter`（modalList 注册表）
- 视口可用高链：`modalReserve` → provide `SCOPE_VIEWPORT_MAX_HEIGHT`（新 key）/ `BODY_CONTENT_VIEWPORT_HEIGHT`（老 key），TableMain `viewportHeight`/`parentChannel` 同链消费
- 范式页：`apps/reference/src/pages/feedback/modal/confirm/showcase/`

## 内部分层（30mf7k / 3a7k03）

确认原语归 core（L1），经 modal/confirm 桶提供，包含 ModalLayerType / ModalDirection；ConfirmModal 别名不变。

仅调整内部引用；组件位置、props、插槽、样式及行为不变。浏览器回归由复核者执行。

> 目录迁移：本组件及配套归入 `components/feedback/modal-confirm`；仅源码位置变化，包根导入、props、slots 与实例契约保持。
