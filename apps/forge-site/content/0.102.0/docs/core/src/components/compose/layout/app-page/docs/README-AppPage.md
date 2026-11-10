# AppPage（页面容器·撑满视口 + 四向悬浮插槽）

> 页面主体容器：默认 slot 按视口高变量撑满（min-height/height 双模式），#top/#bottom/#left/#right 四向 fixed 悬浮插槽（shim 呼吸 + gap 间距），超宽屏内容限宽居中，**页面级 navbar（返回 / 标题 / ⋮ / tabbar）**。
> 范式页：`apps/reference/src/pages/layout/app-layout/page-slots/`（四向悬浮槽 + ChainReadout 高度链互动面板）

## 定位

- **何时用**：每个路由页面的内容根——ListLayout/FormMain 等页面骨架的宿主（`<AppPage><ListLayout .../></AppPage>`）
- **何时不用**：无需容器几何（纯组件局部）时直接用裸组件
- 默认 slot 内容经 ModalShelf page 层包裹（弹层挂载点）
- 四向悬浮插槽为 fixed 定位（z-index `APP_PAGE_SLOT_Z_INDEX`=1），top/bottom 通栏量高、left/right 量宽，尺寸几何由 `app-page-geometry` 纯函数计算
- **让位量恒为 `槽尺寸 + 外圈档`，三处同式**：① 默认内容（`app-page-shim` padding）② `left`/`right` 竖向让过 `top`/`bottom`（槽 ↔ 槽）③ 对后代重 provide 的可用高 / 宽。无该方向插槽时恒 0（[MUST NOT] 给不存在的方向留间隔）。🔴 改其中任一处 [MUST] 三处同步——只改一处会出现「内容让了、槽之间没让」这种同页两套口径
- `contentCentered` 开启后默认 slot 内容限宽居中（超宽屏适配，默认 1200px）——**四向悬浮槽与 `background` 仍通栏**（chrome / 底色通栏、只有内容列限宽，超宽下两侧留白露出页面底色）

## 快速上手（最小可用）

常规页面零配置——默认即最佳（撑满 + 页面主体 + ModalShelf page 层）：

```vue
<AppPage>
  <ListLayout ... />
</AppPage>
```

需要视口高度硬撑满时（全屏页面/顶部自撑 tab 页）：

```vue
<AppPage fullViewport>
  <ListLayout ... />
</AppPage>
```

超宽屏（2K / 4K）下内容限宽居中（默认 1200px，窄屏自动无感）：

```vue
<AppPage content-centered>
  <FormMain ... />
</AppPage>
```

## 能力边界 / 按需使用

- **四向悬浮插槽（`#top`/`#bottom`/`#left`/`#right`）：默认全关、常规页面不需要。** 仅当页面需要「悬浮于内容之上的固定补充区」（通栏操作条 / 侧边抽屉 / 浮动提示）才开对应槽——判据：内容必须 fixed 悬浮且不参与文档流（top/bottom 通栏量高 → padding 让位，left/right 量宽）。列表/表单/详情常规页一律不开。**`#left`/`#right` 内放列表时用 scope 的 `listLayoutRecommended`（见 API）拿窄栏推荐配置，[MUST NOT] 自行拍脑袋配窄栏列表形态。**
- **`showNavBar`（页面级 navbar）：默认关。** 仅移动端形态 / 需要页头返回与 ⋮ 的页面才开。
  🔴 **navbar 归 `AppPage` 不归内容容器**（`vq3mzn`）：它是 **page chrome**，一页恒一个；
  做在 `ViewLayout` / `ListLayout` 上会出「一页两个 navbar」（split 档同页两个容器）、
  且只盖住自己那半边。`ViewLayout.appBar` 已因此**摘除**（v0.32.0 breaking，见 migrations）。
- **`contentCentered`（超宽屏限宽居中）：默认关，按页面类型开。** 表单页 / 详情页 / 阅读型页开（超宽屏下内容整行铺满，label↔控件、行首↔行尾视线跨度过长）；**列表 / 表格页 [MUST NOT] 开**——表格列本就挤，限宽后更挤（业界同解：GitHub 对 diff / 表格页保留全宽）。`contentMaxWidth` 仅在需要非 1200 时设。
- `topBg`/`bottomBg`/`leftBg`/`rightBg`：**默认已是面色**（`--el-bg-color`），不用设。
  只在要**换色**（品牌色条）或要**关掉面**（`"transparent"`，让底透上来）时才传。
- `*ObserveResize`：仅当槽内内容有 CSS 过渡折叠 / 异步撑开（不触发重渲染的尺寸变化）才开对应 RO；普通槽内容（v-if/v-show/静态）不开。
- `fullMode`：默认 `"min-height"` 即够用；`"height"` 仅当页面内子级依赖硬高撑满（如顶级自撑 TabsMain）时选。
- **完整能力演示**（四槽全开 + 背景 + RO 互动面板）：`apps/reference/src/pages/layout/app-layout/page-slots/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name                                        | type                       | 默认                             | 语义                                                                                                                                                              |
| ------------------------------------------- | -------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fullViewport`                              | `boolean`                  | `false`                          | 撑满视口                                                                                                                                                          |
| `fullMode`                                  | `"min-height" \| "height"` | `"min-height"`                   | 撑满方式                                                                                                                                                          |
| `nextViewportMaxHeight`                     | `string`                   | `var(--app-viewport-max-height)` | shim 内视口高变量覆写                                                                                                                                             |
| `background`                                | `string`                   | 无                               | 根盒背景（通栏，不受限宽影响）                                                                                                                                    |
| `contentCentered`                           | `boolean`                  | `false`                          | 默认 slot 内容限宽居中（超宽屏适配）；同步收窄对后代公布的内容几何（见下）                                                                                        |
| `leftWidth` / `rightWidth`                  | `string?`                  | —                                | `#left` / `#right` 槽的**显式宽度**（CSS 长度串）。缺省不写 ⇒ 槽宽跟内容走（shrink-to-fit，老行为）。🔴 **槽内内容要用百分比宽时 [MUST] 改用本 prop**，见下       |
| `contentMaxWidth`                           | `number`                   | `1200`                           | 限宽值（px），仅 `contentCentered` 开启时生效                                                                                                                     |
| `gap`                                       | `number`                   | `8`                              | 间距基数 px（缺省读 bridge `APP_LAYOUT_GAP_CONFIG.size`）。**槽 ↔ 内容**与**槽 ↔ 槽**都取由它派生的「外圈档」（`基数 × 2`，随密度缩放），两处同式同源           |
| `topBg` / `bottomBg` / `leftBg` / `rightBg` | `string`                   | `var(--el-bg-color)`（面色）     | 各槽 shim 背景；传 `"transparent"` 可关。**shim 自带圆角**（`--dc-core-radius`，随主题；无 bg 的槽透明、圆角无视觉影响）。⚠️ **显式传值会关掉「面下放」**（见下） |

> **五个背景 prop 的契约（分两组，判据是「块」还是「容器」）**
>
> | prop                   | 默认                     | 为什么                                                   |
> | ---------------------- | ------------------------ | -------------------------------------------------------- |
> | 四个 `*Bg`（悬浮槽）   | **面色 `--el-bg-color`** | 槽是 **chrome 小块**，本就该浮在底上成一块面             |
> | `background`（页面根） | **无（透明）**           | 根是**容器**，容器一律不铺底 —— 底由全局 `html` 一处接手 |
>
> 🔴 **[MUST NOT] 用任何一个去「对齐全局底色」**。给**块**上面色，和给**缝 / 容器**补一层
> 「与底同色」的面，是两件事：后者把一个会变的值复制到第二处 —— 今天两处同色看不出来，
> 哪天全局底换成渐变 / 背景图 / 换主题，那层补色就成了糊在上面的一块实色补丁 ——
> **不报错、不红、没有任何测试会失败，只是变丑**。
> 同理 [MUST NOT] 要求「给缝隙上色」的 prop：**缝不是一块要上色的面，是真空**。
>
> **默认插槽恒透明**，且没有给它上色的 prop —— 它是主内容区，必须让底透上来。
> | `topObserveResize` / `bottomObserveResize` / `leftObserveResize` / `rightObserveResize` | `boolean` | 均 `false` | 逐槽 WatchSize RO 观测（CSS 过渡折叠等非重渲染尺寸变化时开） |
> | `showNavBar` | `boolean` | `false` | 开启**页面级 navbar**（返回 / 标题 / ⋮ / tabbar），见下 |
> | `back` | `() => void` | — | 给了才渲染左侧返回箭头（热区 ≥44×44）。**仅 `showNavBar` 开启时** |
> | `moreOptions` | `AppPageNavBarMoreOption[]` | — | ⋮ 的下拉菜单项；给了即点击开菜单 |
> | `onMoreSelect` | `(item) => void` | — | 菜单项点选回调 |
> | `onMore` | `() => void` | — | 无菜单时 ⋮ 的直接点击回调 |
> | `navBarObserveResize` | `boolean` | `false` | navbar 的 WatchSize RO 观测（tabbar 有过渡折叠等非重渲染高度变化时开） |

### v-model

| 名      | type                  | 语义                                                                                                                            |
| ------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `title` | `string \| undefined` | navbar 标题。子层经 `titleField.changeTitle()` 写回，消费方经本 model 拿得到。⚠️ **不开 `showNavBar` 时值照改、只是没有显示位** |

### Emits

无（`onMoreSelect` / `onMore` 是 props 形态的回调，见上）

### Slots

| 槽                 | scope                       | 语义                                                                                        |
| ------------------ | --------------------------- | ------------------------------------------------------------------------------------------- |
| `default`          | 无                          | 页面主体（ModalShelf page 层包裹）                                                          |
| `#top` / `#bottom` | 无                          | 通栏悬浮槽（量高 → padding-top/bottom）                                                     |
| `#left` / `#right` | `{ listLayoutRecommended }` | 侧向悬浮槽（量宽）——scope 携带窄栏 ListLayout 推荐配置（见下）                              |
| `#navTitle`        | `{ title }`                 | navbar 标题位自定义（缺省渲染 `title`）。仅 `showNavBar` 开启时                             |
| `#more`            | 无                          | ⋮ 的图标位自定义（缺省 `MoreFilled`）。⚠️ 点击绑在**外层 `span`** 上 ⇒ 本槽 [MUST] 放哑内容 |
| `#tabbar`          | 无                          | navbar **第二行**（标签栏）。🔴 [MUST NOT] 改放 `#header` —— 见下                           |

## 页面级 navbar（`showNavBar`）

```vue
<AppPage
  v-model:title="title"
  show-nav-bar
  :back="() => router.back()"
  :more-options="[
    { label: '分享', value: 'share' },
    { label: '删除', value: 'remove' },
  ]"
  :on-more-select="(item) => handle(item.value)"
>
  <template #tabbar><ElTabs v-model="tab">…</ElTabs></template>
  <ViewLayout :api="api" />
</AppPage>
```

### 🔴 为什么 navbar 归 `AppPage`，不归内容容器

navbar 是 **page chrome**：**一页恒一个**、横跨整页、在内容滚动之外。
早先做在 `ViewLayout` 的 toolbar 上（`x2bfq9` / `pfdnd7`），当时的依据是「toolbar 已支持
title、很平滑」—— **那只回答了「省事吗」，没回答「属于谁」**。三条代价都已发生或必然发生：

| #   | 代价                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- |
| ①   | **N 个族各做一遍** —— `ListLayout` 也要 navbar 时就是第二份实现、第二份漂移                                                        |
| ②   | **一页多容器时语义崩** —— 列表详情 split 档同页既有 `ListLayout` 又有 `ViewLayout`，两个都开 ⇒ 一页两个 navbar，而真 navbar 恒一个 |
| ③   | **覆盖范围不对** —— `ViewLayout` 的 toolbar 只在它自己那个盒内不滚，split 档右侧开 appBar 只盖住右半边                             |

与 `AppHeader`（布局四区之一的**全局**顶栏：品牌 / 用户）**不同层级**：
`AppHeader` 管整个应用，navbar 管**这一页**。

### 🔴 [MUST NOT] 拿 `#top` 槽自己拼一个

`#top` 是**方位槽**（`fixed` + 自带面色 / 圆角 / padding，且有空壳误用检测），
放消费方自己的东西。navbar 塞进去就没有共享实现可言 —— 等于把拼装成本推给每个消费方。

### 🔴 tabbar 是 navbar 的一部分，[MUST NOT] 塞进 `#header`

`#header` 是**内容区的标题行**（`ViewLayout` / `ListLayout` 各有一个），
navbar 是**页面 chrome** —— **同名不同物**，与 `#bottom`（页面级）vs `#detailBottom`
（详情区内部）是同一类坑。一个槽兼两种语义，下游第一天就会搞混。

### 几何：navbar 是第五条固定带

navbar 贴内容矩形上沿，`#top` 槽与左右槽依次**下移**。让位量与四向槽**同式同源**
（`槽高 + 外圈档`）⇒ 四处出口（槽几何 / 重 provide 的可用高 / `APP_PAGE_CONTENT_INSET` /
默认内容 `padding-top`）自动一致。

- **间距取「外圈档」（`基数 × 2`，默认 16）而非模块档**：间距阶梯对外圈档的定义原文就是
  「**内容 ↔ chrome**」，navbar 正是 page chrome；且四向槽全走同一式 ——
  取模块档会让**同一页上 navbar 与 `#top` 槽两种让位口径并存**。
- **横向 keyline = 外圈档（默认 16）**，移动端 header 侧距惯例。
  🔴 [MUST NOT] 沿用内容容器那一份（8）—— `9dabaj` 统一 `padXPx` 时把 appBar 那份**有依据的
  16 一起砍了**，返回图标因此落在 8px（甲方报「太靠边」）。
- **返回图标 `margin-left: -13px`** = `(热区 44 − 图标 18) / 2`：让图标**视觉左缘**正好压在
  keyline 上（Material nav-icon keyline 同法）。⚠️ 改图标字号或热区尺寸都要**重推这个数**。
- **高度 `min-height: 44px`**，不是固定高：内容（含 tabbar）超出照常撑高。
- **贴视口边的那几边不画圆角**（`is-flush-top/left/right`）：内容矩形某边离视口为 0（典型 = 路由
  `meta.layout` 开 `noViewportPadding` + `noBodyPadding`）时 navbar 成通栏标题栏；未贴边保持浮起的圆角卡片。
  下边缘投影保留（与内容的分隔）。判定取与 navbar 定位**同源**的内容矩形。

## 子层回写页面标题：`useAppPageTitleField`（能力令牌）

**问题**：`ViewLayout` / `ListLayout` 拿到详情数据后才有真标题，要推给页面级 navbar。
**约束**：要能**防止其他地方乱改**标题 ⇒ 能力令牌 —— 不给令牌就够不着这个通道。

```vue
<script setup>
import { useAppPageTitleField } from "@done-coding/forge";

const title = ref();
const titleField = useAppPageTitleField();
</script>

<template>
  <!-- 同一个句柄同时给页面与子件：给了才够得着 -->
  <AppPage v-model:title="title" show-nav-bar :title-field="titleField">
    <ViewLayout :api="api" :title-field="titleField" />
  </AppPage>
</template>
```

```ts
interface AppPageTitleField {
  changeTitle: (t: string | undefined) => void;
  /** Teleport 目标：直接给**元素**，[MUST NOT] 返回 class 字符串 */
  titleBoxRef: Readonly<ShallowRef<HTMLElement | undefined>>;
}
```

### 三条容易走反的口径

| #   | 口径                                                                     | 为什么                                                                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ①   | **单句柄**（不拆 `secret` / `remoter`）                                  | 接线点 3 → 2；同名同值传两处，令牌性不丢（不给就够不着），但不会传串、不用分「给页面的那半 / 给子件的那半」                                                                                                                                                                         |
| ②   | 失败 = **dev 期点名 `console.warn`**，[MUST NOT] 返回静默 `false` / 空串 | 「标题没变」正是本仓连修四个缺陷的同一形态（`labelHide` 类挂上规则打不中 / 方位槽误用 / 徽标静默 / 引导卡死）。句柄没被任何 `AppPage` 认领 ⇒ 点名                                                                                                                                   |
| ③   | 🔴 **[MUST NOT] 校验「子件是 AppPage 的直系子元素」**                    | 本仓已两次付过代价：`useContextDefaults` 读**直系父 DOM**，消费方在插槽里**包一层 `<div>` 就断链且静默**。`provide/inject` 按**组件树**走、不关心 DOM 层数，那是它的优点；令牌已经管住「谁能改」，DOM 层数管的是另一件事**且管不准**（包一层 div 的人并没有越权，他只是写了个 div） |

### 其余口径

- `v-model:title` **非必须**：`AppPage` 内部走 `defineModel<string>("title")`，
  子层 `changeTitle` 经它写回 ⇒ 消费方拿得到。
- **只有 `showNavBar` 才看得见**：不开时值照改、只是**没有显示位**
  （[MUST] 记住这条，否则会以为「没生效」）。
- `titleBoxRef` 的用途 = 放**自定义标题**：

  ```vue
  <script setup>
  const { titleBoxRef } = useAppPageTitleField(); // 解构后模板自动解包
  </script>
  <template>
    <Teleport :to="titleBoxRef"><MyFancyTitle /></Teleport>
  </template>
  ```

### `#left` / `#right` scope：`listLayoutRecommended`（窄栏 ListLayout 推荐配置）

**性质**：固定内置推荐值（写死、非运行时开关、不做响应式探测），仅经 `#left`/`#right` 插槽 scoped 带出。面向「列表放进 left/right 窄栏」的展示形态推荐；消费者拿到后直接 `v-bind` 展开进 ListLayout，可按需 spread 覆盖（`v-bind="{ ...listLayoutRecommended, customView: false }"`）。

> ⚠️ **`tableMainProps` 部分已自动**：`#left` / `#right` 内直接放 `ListLayout` 时，分页窄栏化（`pageLayout` / `paginationBackground`）已由 `ListLayout` 的 `useContextDefaults` 直系父上下文默认自动提供，无需再经本推荐配置传 `tableMainProps`；仍需要 `customView: true`（卡片形态）才显式 `v-bind="listLayoutRecommended"`（或只取 `customView`）。

**形状**（与 ListLayout props 平铺对齐）：

| 字段                                  | 类型      | 固定值                | 语义                                                                                                                              |
| ------------------------------------- | --------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `customView`                          | `boolean` | `true`                | 开启自定义视图（DataListView 卡片形态替代 ElTable——窄栏过窄表格必然崩，卡片更优）。需配套 ListLayout `#custom-view-item` 定义单项 |
| `tableMainProps.pageLayout`           | `string`  | `"prev, pager, next"` | 分页器最简形态——去 total/sizes/jumper，仅页码（`« 1 2 3 4 5 »`）                                                                  |
| `tableMainProps.paginationBackground` | `boolean` | `false`               | 页码不带背景框（透传 ElPagination `background=false` 纯数字链接形态；TableMain 默认 `true` 带框）                                 |

**消费示例**（`#left`/`#right` 内放列表）：

```vue
<AppPage>
  <template #left="{ listLayoutRecommended }">
    <ListLayout
      v-bind="listLayoutRecommended"
      :api="leftApi"
      :columns="leftColumns"
    >
      <template #custom-view-item="{ item }">
        <!-- 窄栏卡片单项 -->
      </template>
    </ListLayout>
  </template>
  <template #default>
    <!-- 主内容区 -->
  </template>
</AppPage>
```

**类型**：`AppPageListLayoutRecommended`（`app-layout/types.ts` 导出，非泛型——与 ListLayout 泛型 props 无关的平铺子集）。

### `contentCentered` / `contentMaxWidth`（超宽屏内容限宽居中）

**意图**：超宽屏（2K / 4K / 带鱼屏）下默认 slot 内容整行铺满会让视线跨度过长（表单 label↔控件、正文行首↔行尾），开启后内容列限宽居中、两侧留白露出页面底色。窄屏（可用宽 ≤ `contentMaxWidth`）留白为 0，**与关闭态逐字节一致**，无需断点判断。

**机制**：**不新增 DOM 节点**——在既有 `.app-page-shim` 的左右 padding 上各叠一份「超宽留白」`gutter`：

```
gutter = max(0, (内容可用宽 − contentMaxWidth) / 2)
paddingLeft  = 左槽让位量 + gutter
paddingRight = 右槽让位量 + gutter
```

「内容可用宽」= AppPage 盒宽扣四向槽让位（即 `computeAppPageReducedViewportWidth`）。因此**居中基准是「两个侧槽之间那段区域」而非整个窗口**——`#left`/`#right` 只开单侧时内容仍精确居中于剩余可用区，不会被槽压偏。

> 选型：本能力**刻意不套限宽容器**。`.app-page-shim` 上挂着 `data-dc-slot`（默认槽区域标记），`useContextDefaults` 读的是**直系父 DOM**——中间插一层容器会让 ListLayout 窄栏默认、ViewLayout/TabsMain `refine` 上下文默认静默失效。padding 方案与套容器行为等价，且零 DOM 变更、零失效风险。

**对后代公布的几何同步收窄**（开启后下列三者一致，下游零改动即对）：

| 出口                                       | 开启后                                                      |
| ------------------------------------------ | ----------------------------------------------------------- |
| `.app-page-shim` 左右 padding              | 各 `+ gutter`（内容盒宽 = `contentMaxWidth`）               |
| `APP_PAGE_CONTENT_INSET` 的 `left`/`right` | 各 `+ gutter`（fixed / 悬浮元素贴真实内容列边，而非页面边） |
| `--dc-page-content-viewport-width`         | `min(原值, contentMaxWidth)`                                |

高度链（`SCOPE_VIEWPORT_MAX_HEIGHT` / `BODY_CONTENT_VIEWPORT_HEIGHT`）、四向悬浮槽几何、`background` 均**不受影响**——限宽是纯横向能力，chrome 与底色通栏。

**`contentMaxWidth` 只接受 `number`（px）**：几何链三处出口都要拿它参与数值运算（gutter 求差、`min` 比较），CSS 字符串（`80rem` / `50%`）无法参与，会让样式与公布几何脱钩。需要相对单位请自行换算成 px 传入。

### Expose

无

### 方位槽空壳检测（dev-only，每槽只报一次）

四向槽是 **fixed 悬浮区**：槽一旦渲染，即使里面的东西「不占版面」，
**槽本身**照样铺 padding + 背景、照样从默认内容里扣掉让位高度（实测一条 16px 空白带）。

⇒ dev 下（`import.meta.env.DEV`）挂载时检查每个方位槽渲染出的内容：
若**全是不占版面的节点**（注释 / teleport 锚点 / 空文本）⇒ 一条 `console.error`，
**同一个槽只报一次**（不刷屏）：

```
[AppPage] #top 槽里没有占版面的内容，但槽本身照样渲染（fixed + padding + 背景）
并从默认内容里扣掉让位高度 —— 白占一条。
· 若放的是 ModalPorter：移到**默认槽**（page 架子就住在默认槽里，与 AppPage 并列同样够不到，evoke() 一样恒为 null）；
· 若放的是自己 teleport 走、不需要 page 架子的弹窗：移到默认槽或与 AppPage 并列均可；
· 若是 v-if 条件渲染的内容：此刻恰好为空，忽略本条。
```

| 情形                                        | 是否报                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| 槽里只有 `ModalPorter` / 已 teleport 的弹窗 | ✅ 报（正是要防的）                                                        |
| 槽里内容被 `v-if` 暂时关掉                  | ⚠️ 会报 —— **合法动态状态**，靠 dev-only + 去重 + 文案给出口兜住，忽略即可 |
| 槽里有正常内容                              | ❌ 不报                                                                    |
| 生产构建                                    | ❌ 不报（dev-only）                                                        |

🔴 **只「报出来」，[MUST NOT] 顺手改成「空槽就不渲染」** —— 那是行为变更、会动已有页面布局，
与检测是两件事；真要做得单独一版、走 migrations 说清楚。

## 面下放：槽里放 `ListLayout` 时，槽自己不再成面

**槽内容里有 `ListLayout` ⇒ 该槽撤面 / 撤圆角 / padding 归 0。**

### 为什么

`ListLayout` 自带**两张卡**（chrome 卡 + 数据区卡，`huhyx7` 的两卡模型）。
槽再铺一层面，就是**面套面** —— 与 `p4wrtn`（卡片与容器同色）是同一个病换了一层楼：
白槽 + 白卡，卡不成其为卡。

撤掉之后，侧槽里的卡与**默认内容区**的卡**同口径**（都贴各自盒边），两边反而更一致。

### 🔴 判定走 VNode 递归，且 [MUST NOT] 只看直系子

```
app-page-slot-shim
  └ dc-app-page-list-detail-split__list   ← 列表详情门面自己插的 wrapper
      └ ListLayout
```

「左槽放列表」最常见的场景**就是经门面进来的**，而门面自己插了一层 wrapper
⇒ **直系子判定在主战场上恒不命中**。这与 `useAppPageTitleField` 那条
「[MUST NOT] 校验直系子元素」是同一条教训（本仓已为此付过三次代价）。

| 决定                                                     | 为什么                                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 按**组件 `name`** 匹配，[MUST NOT] 按组件对象 `===`      | dev 读 `core/src`、prod 走 `core/es` 可能是**两个 module instance** ⇒ 恒等匹配**永不命中且不报错**                 |
| 判定是**每次渲染求值的函数**，[MUST NOT] 写成 `computed` | 插槽不是响应式依赖，`computed` 恒吃首次缓存 ⇒ 槽内容换掉时判定不跟                                                 |
| 走 **VNode**，[MUST NOT] 走 DOM / 类名                   | 槽的背景是**内联**的，DOM 读到时样式已经落上去了，要改只能 `!important` 硬顶；VNode 侧是在**算样式之前**就知道答案 |
| 命中**多个** ⇒ dev 点名 + **按不命中处理**               | 面该归谁无法判定，[MUST NOT] 猜                                                                                    |

### 出口与边界

- **显式传 `leftBg` / `rightBg` 等恒优先**：消费方自己要了面就给面，自动下放让路。
- **槽内不是 `ListLayout` ⇒ 逐字不变**（面 / 圆角 / padding 都在）。
- 槽内层 shim 的 padding 取**间距阶梯的模块档**（原先写死 `8px`，不随 gap 基数 /
  密度档变）——默认基数下仍解出 8，**零视觉变化**。

⚠️ **[MUST NOT] 给 `ListLayout` 的根投射 padding**：它的**根是透明的**（面在内部两张卡上）
⇒ 给根留白只会露出**页面底**，比面套面更糟。

## 侧槽宽度：内容要用百分比时 [MUST] 用 `leftWidth` / `rightWidth`

### 🔴 为什么槽内的百分比宽会留下死白

`#left` / `#right` 是 **`position: fixed` 且只给了 `left` / `right`** ——
没有 `width`、没有对边 ⇒ 宽度**跟内容走**（shrink-to-fit）。

槽内内容若写百分比宽，浏览器两趟算下来自相矛盾：

1. 算**内在尺寸**时百分比按 `auto` 处理 ⇒ 槽被撑到内容的 **max-content**；
2. 之后百分比才解析，基数是**刚被内容撑出来的那个宽** ⇒ 解出来往往远小于槽；
3. ⇒ **槽里剩一大片死白**，且**随内容变丰富而变大**。

实测（1280 视口，列表详情 split 档，`width: clamp(280px, 28%, 420px)` 写在槽内内容上）：
槽 **517** / 内容 **280** ⇒ 死白 **229px**。

### 处置：把宽度放到**槽这一层**

```vue
<AppPage :leftWidth="listWidth">
  <template #left>
    <div style="width: 100%">…</div>   <!-- 内容只吃满槽 -->
  </template>
</AppPage>
```

槽是 `fixed` ⇒ 包含块是**视口**（初始包含块）⇒ 百分比有**稳定且不循环**的基数。
实测 `28%` 在 1280 下精确得 **358px**，死白降到 **8px**（= shim padding），
且**加长内容后不再恶化**。

🔴 **[MUST NOT] 改用 `--dc-page-content-viewport-width` 当百分比基数**：
那个变量是**内容区**宽（已扣掉左右槽），语义本就不对，而且**它本身就在循环链上**
（内容区宽 ← 侧槽宽 ← 槽内内容宽）。

⚠️ 写在这里的宽度照常被 `WatchSize` 量到、回写进内容区的让位 padding（实测跟得上），
几何链不受影响。`#top` / `#bottom` 是**通栏**（`left` + `right` 双边定位），
不存在这个问题、也没有对应 prop。

## 反模式 / 注意

- **悬浮槽尺寸变化来自 CSS 过渡/异步撑开 → 必须开对应 `observeResize`**（onUpdated 只读渲染后瞬时值，过渡动画读起点漏最终）
- 四向槽 fixed 定位——内容滚动时悬浮不动，属设计语义，勿误当普通 inline 槽
- **运行时动态增减插槽（在槽模板上挂 `v-if`）不生效**——`hasTop/hasBottom/hasLeft/hasRight` 取 `!!slots.x`，`slots` 非响应式对象、computed 无依赖恒吃首次结果。插槽集 [MUST] 当静态结构写死；确需切换整套槽形态由调用方给 AppPage 换 `:key` 重挂载
- **[MUST NOT] 把 `ModalPorter` / 弹窗放进方位槽**：方位槽是页面内置 `ModalShelf` 的**兄弟**不是后代，`provide` 够不到（`evoke()` 恒 null），且槽本身白占版面。两条检测都会在控制台点名（见上）
- 槽尺寸/inset 几何由 `app-page-geometry` 纯函数计算导出，[MUST NOT] 手写自造
- `listLayoutRecommended` 开 `customView` 后 [MUST] 配套 ListLayout `#custom-view-item`，否则窄栏卡片渲染为空
- **在 `#left`/`#right` 槽内写百分比宽**：[MUST NOT]——槽是 shrink-to-fit，百分比没有稳定基数，会留下大片死白且随内容变大；宽度放 `leftWidth` / `rightWidth`
- **列表 / 表格页开 `contentCentered`** —— 表格列本就挤，限宽后更挤；限宽只服务表单 / 详情 / 阅读型页
- `contentMaxWidth` 传 CSS 字符串（`"80rem"`）—— 只收 `number`（px），字符串会让样式与公布几何脱钩
- [MUST NOT] 在业务侧改写 `.app-page-shim` padding 自造限宽 —— 会与槽让位量打架且不同步 `APP_PAGE_CONTENT_INSET`；限宽一律走 `contentCentered`。子级确需破框全宽（full-bleed）时用负 margin 主动逃逸，属逃生舱
- `listLayoutRecommended` 是 AppPage → ListLayout 的**定向耦合**（AppPage 持有 ListLayout prop 形状子集），属本能力设计使然；若 ListLayout 该子集发生 breaking，[MUST] 同步更新 `app-layout/types.ts` 与本 README

## 关联

- 超宽限宽留白：`use-content-box.ts`（`useAppPageContentBox` → `contentGutter`，core 内部组合函数不出桶）
- 几何纯函数：`app-page-geometry.ts`（computeAppPageReducedViewportHeight/Width、computeAppPageContentInset、computeAppPageSlotStyles、computeAppPageSlotShimStyles + `APP_PAGE_SLOT_Z_INDEX`=1）
- 高度链：AppBody provide 的 `BODY_CONTENT_VIEWPORT_HEIGHT` / `BODY_CONTENT_VIEWPORT_RECT` / `BODY_CONTENT_VIEWPORT_INSET` / `SCOPE_VIEWPORT_MAX_HEIGHT`
- 范式页：`apps/reference/src/pages/layout/app-layout/page-slots/`（含 ChainReadout 高度链互动面板）
- 超宽限宽范式页：`apps/reference/src/pages/layout/app-layout/content-box/`（开关 / 限宽值 / 槽组合 + 公布几何实时读数）
- 窄栏列表范式：`apps/reference/src/pages/layout/app-layout/narrow-list/`（#left/#right 放 ListLayout + `listLayoutRecommended`，与裸用对照）

## 内部分层（30mf7k / 3a7k03）

AppLayout 按职责从 `modal/preview` 与 `modal/infrastructure` 消费媒体和架子；AppPage 只消费 infrastructure。私有 Porter Symbol 仍保持单一定义、不进公开桶。

本次仅调整内部引用，组件位置、props、插槽、行为与样式不变；浏览器回归由复核者执行。

> 目录迁移：实现与配套归入 `components/compose/layout/app-page`；公开契约、兼容别名与 panel 废弃时间点不变。

## C 源码迁移

本组件及配套类型/hooks/测试/API迁至 `packages/forge-compose/src/components`，去掉 pro 重复层。应用消费 `@done-coding/forge`；组件 API、槽与事件不变，Panel已由pn1031退役（C拆包时曾保留）。
