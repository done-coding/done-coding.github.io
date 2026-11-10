# ViewLayout（展示布局）

> 展示空间布局壳：`props.api` 数据拉取（内部 `useActivated` 激活拉取）+ toolbar 对齐 `TableToolbar`（左/右 `ActionBtnGroup` extra 按钮 + 右侧 `AutoRefreshGroup` 自动刷新 / 手动刷新）+ 默认插槽自由内容 + `#bottom` 底部区 + 精细流高度链（refine 上下文默认：AppPage#default / TabsMain 页签内容内开）。
> 范式页：`apps/reference/src/pages/layout/view-layout/guide/`

## 定位

- **空间一等公民**：展示空间布局首选（页级数据展示的布局壳）——承接 PanelMain 废弃的页级展示场景
- **何时用**：页级数据展示（详情 / 预览 / 摘要展示）——api 拉数 + 自动刷新 + 内容自由编排
- **何时不用**：结构化只读详情在默认槽用 Descriptions；编辑走明确Form/Modal流程；列表用 `ListLayout`
- 内部组合：`ActionBtnGroup`（左/右 extra 按钮，`default-size="small"` 对齐 table-toolbar 视觉惯例）+ `AutoRefreshGroup`（右侧，refreshFn=api 拉取，toolbar 经 `HeightProvider` #header 槽 WatchSize 量高）+ 默认插槽（`{ data, loading, refresh, viewportHeight, fetchSeq }` 注入）+ `#bottom` 底部区（精细流进 `HeightProvider` #footer 槽，同样量高扣减）

## 快速上手（最小可用）

```vue
<ViewLayout :api="fetchDetail">
  <template #default="{ data, loading, refresh, viewportHeight }">
    <div v-loading="loading" :style="{ maxHeight: viewportHeight + 'px' }">
      <!-- 纯展示自由编排：Descriptions 或直接写内容均可；超高内容内滚 -->
      <pre>{{ data }}</pre>
    </div>
  </template>
</ViewLayout>
```

**要点**：

- `api` 必传：`(params?: P) => Promise<R>`，params 来自 `props.params`（不传则 api 收 undefined）
- 激活即拉取：首访 mounted / KeepAlive 重新激活自动拉取，失活不拉（数据保留）
- 右上角 AutoRefreshGroup 自动接管刷新按钮 / 自动刷新开关（`showAutoRefresh` / `showRefresh` 控制显隐）
- toolbar 对齐 `TableToolbar` 结构：`leftExtraButtons` / `rightExtraButtons`（`ActionBtnGroup` 配置，`default-size="small"`）左右分栏；不含表格特有能力（导出 / 批量下载 / 视图切换）
- **refine 上下文默认**：置于 AppPage `#default` / TabsMain 页签内容内默认开（精细流）——内容区可用高 = 视口高 − toolbar 高 − `#bottom` 高 − 内容区自身纵向 padding（`scope.viewportHeight` + 容器 max-height 双出口）——超高内滚；其余容器 / 独立使用回落自然流（按自身尺寸）

## 能力边界 / 按需使用

- **默认即够用**：`api` + 默认插槽即得完整展示布局——refine 精细流 + 自动刷新开关/刷新按钮默认开。
- **refine（精细流）：上下文默认。** 置于 AppPage `#default` / TabsMain 页签内容内默认 `true`（精细流）；其他容器 / 独立使用默认 `false`（自然流，scope viewportHeight 为 undefined）。需精细流而上下文未命中时显式补 `refine`；展示内容无需视口高度预算（按自身尺寸渲染即可）时显式关。显式传 `refine` 恒优先。
- `viewportHeight` / `channel` / `parentChannel`：默认不用。仅当 ViewLayout 需要参与可用高 scope 链（显式视口高 / 作为父提供 scope / 作为子定向消费祖先 scope）才配；⚠️ 每级 [MUST] 显式 `refine`、channel 名 [MUST NOT] 响应式变更。
- `params`：仅当 api 需要拉取参数时传；⚠️ **响应式变化不自动重拉**（需要时调 `scope.refresh()`）。
- `showAutoRefresh` / `showRefresh`：仅当不需要自动刷新或手动刷新时关。
- `leftExtraButtons` / `rightExtraButtons`：仅当 toolbar 需要业务操作按钮时配——配置为 `ActionBtnGroup` 单项（`key` / `label` / `actionBtnProps` / `render` / `show`），ctx 注入 `{ loading, refresh }`（刷新与右上角同源）；按钮默认 `size="small"` 对齐 table-toolbar。
- **`#bottom`（底部区）：不传即完全不存在。** 传了才渲染（[MUST NOT] 传空 `<template>` 占位）——精细流下它**固定在底部、不随内容滚**，自然流下**平铺在内容之后**。典型用途：合计行 / 固定操作条 / 状态摘要。
- **插槽内容自由编排**：结构化字段用 Descriptions，自由内容直接写；原Panel就地编辑/嵌套能力没有等价兼容替代。
- **完整能力演示**：`apps/reference/src/pages/layout/view-layout/guide/`——能力展示，非推荐默认。

## 上下文默认值（直系父上下文）

置于特定父容器槽位时，`ViewLayout` 的 `refine` 自动获得上下文默认值（`useContextDefaults` 解析直系父 DOM 的 `data-dc-slot`），消费方零传参；显式传 `refine` 仍优先。

| 场景                | prop     | 自动默认                            |
| ------------------- | -------- | ----------------------------------- |
| AppPage `#default`  | `refine` | `true`（精细流）                    |
| TabsMain 页签内容内 | `refine` | `true`（精细流）                    |
| 其他容器 / 独立使用 | `refine` | 不处理（undefined ≡ false，自然流） |

> ⚠️ 需上下文动态默认的 prop 不写 `withDefaults` 默认（详见 spec：`docs/specs/2026-08-14-080509-moderate-usecontextdefaults直系父上下文默认/spec.md`）。

## 标题行（`title` / `#header`）

标题渲染在**操作条之上的独立一行**，与 `ListLayout` 的 header 槽结构对齐 ——
列表页与详情页头部一致，主题 persona 也只需定向一个锚点 `.dc-view-layout__header`。

**优先级：`#header` 插槽 > `title` prop > 不渲染**（不渲染 = 不留空盒占高）。

```vue
<!-- 常见场景：一个字符串 -->
<ViewLayout :api="api" title="订单详情" />

<!-- 标题跟着详情数据走：用插槽，scope 带 data / loading -->
<ViewLayout :api="api">
  <template #header="{ data }">{{ data?.name ?? "加载中" }}</template>
</ViewLayout>
```

🔴 为什么标题要交给容器、[MUST NOT] 在内容插槽里自画一个 div：自画的标题是
「内容的第一行」而非「容器的标题位」——位置与 `ListLayout` 对不齐，主题也无从定向。
`AppPageDetail` 原先即如此，已归位（见 migrations）。

标题本身只给字号 / 字重，[MUST NOT] 自带背景与描边 —— 它坐在 toolbar 这条**分区条**里，
底色由条统一给。

**toolbar 是「条」(bar) 不是「卡」(card)**（甲方 2026-09-16 定性）：底色直接取**面色那一档**
（`var(--dc-core-surface, var(--el-bg-color))`，亮暗自动跟随），
但守两条纪律 —— **通栏**（零圆角）· **零上下呼吸**（[MUST NOT] 加纵向 padding/margin）。
此前「工具条成卡」被否的根因不是「有面」，而是面顺带塞进 12px 内呼吸把 32px 的条撑到 56px。

⚠️ **v0.32.0（m5tvq8 ②）起不再用 `color-mix`**：原先取「面与底的中点」，而本主题
ground↔surface 色差实测**亮 18 / 暗仅 10** ⇒ 中点在暗色只剩 Δ5、条与内容几乎分不开
（这条风险当时就登记了，甲方批注「最后我验收时再调整都来得及」）。取满面色即那次调整，
[MUST NOT] 退回中点、[MUST NOT] 改用真 alpha 透明（两者不重叠，透明只是多一层合成开销）。

### 背景面与主色条（甲方 2026-09-29 裁定，c1oj1d）

**色条与背景面强绑定**：它是「有面但左侧空」时给这块面的视觉配重，不是标题的附属品 ⇒ **有面才画、无面不画**。

```
有面：
toolbar 左缘
│
█┆←─ x ─→ 标题                                 [按钮] [↻] ←─ x ─→│
█┆                                                                 │
↑└ 色条 margin-right = x（不着色）
└ 色条 width = y，着色，贴左缘，全高；toolbar padding-left = 0 ⇒ 标题左缘 = y + x

无面：            标题 …                        [按钮] [↻]     ← padding: 0 x，无色条
```

- x = `padXPx`（gap 阶梯派生，与内容区共用，[MUST NOT] 写死）；y = **3px**（甲方给定的色条宽）。
- 有面：toolbar `padding-left: 0` · `padding-right: x`；色条是第一个 flex 项（`::before`），`width: y` + **`margin-right: x`**，
  `align-self: stretch` 全高，左缘**贴** toolbar 左缘。
  🔴 着色只有 y：[MUST NOT] 改用 `padding-right` + `background-clip`；[MUST NOT] 负偏移挂到盒外（`ViewLayout` 与宿主各层左缘同线，盒外没有余量）。
- 🔴 **标题左缘 = y + x，比正文（x）右移 y** —— 甲方已接受，本处取代 9dabaj「标题与正文左缘严格对齐」，[MUST NOT] 为对齐正文改回 x − y。
- 无面：`padding: 0 x` 左右对称，标题与正文左缘对齐。

**有没有面**：`toolbarSurface` prop（显式优先）；不传时 **位于开了 `showNavBar` 的 `AppPage` 内 ⇒ 无面**
（navbar 已是页面 chrome，下方再铺一层面读起来是第二条标题栏），其余有面。判定走 `AppPage` 的 inject（任意层级祖先，非直系父）。

## 底部区（`#bottom`）

```vue
<ViewLayout :api="api" title="订单详情">
  <template #default="{ data }">…长内容…</template>
  <!-- refine：固定在底部，内容再长也压不到它；自然流：跟在内容之后 -->
  <template #bottom="{ data, loading }">
    <ElButton type="primary" :loading="loading">保存</ElButton>
  </template>
</ViewLayout>
```

| 档                    | 行为                                                                                                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `refine` 开（精细流） | **固定在底部** —— 进 `HeightProvider` 的 `#footer` 槽，经 `WatchSize` 量高并从内容区可用高里扣掉，内容再长也不滚走。要它**贴容器底**（内容稀疏时也不浮在半空）再开 `fillHeight`（见下） |
| `refine` 关（自然流） | **平铺在底部** —— 跟在内容之后按自身尺寸排布，无固定定位                                                                                                                                |

- scope：`{ data, loading, fetchSeq }`（底部区常要跟着详情数据走，而这三者都在 setup 里取不到）。
  比 `#header` 多一个 `fetchSeq` —— 底部区是**放操作条**的地方，提交后常要判「详情真的重拉成功了」
  （失败不递增，[MUST NOT] 用 `loading` 的 `true→false` 代替）；也让
  `AppPageListDetailLayout` 的 `#detailBottom` 能原样复用 `#detail` 那份 scope、
  [MUST NOT] 为凑类型编一个恒 0 的假值。
- **不传 = 不渲染**：[MUST NOT] 留空盒——那会白占一段 reserve（精细流下内容区凭空少一截）。
- 🔴 **随内容滚的尾部内容 [MUST NOT] 放这里**：凡进 `#bottom` 的都从可用高里扣。要跟着滚就写在默认插槽末尾。
- 本槽**不自带面 / 不自带呼吸**：它与内容区之间的间隔由内容区自己的下 padding 给出（见下），装什么面由使用方决定。
- **自然流下它只是「排在内容之后」**，没有底可贴（那一档本就没有高度预算）。

## 间距归属（谁给的呼吸）

| 段                                                          | 归属                                             | 值                   |
| ----------------------------------------------------------- | ------------------------------------------------ | -------------------- |
| toolbar ↔ 内容                                             | **内容区的上 padding**                           | 一份                 |
| 内容区上 / 下                                               | 内容区自己的 padding（`box-sizing: border-box`） | 一份                 |
| **组件横向留白**（toolbar 与内容区**共用**一个值 `padXPx`） | 两者各自的左右 padding                           | 一份（**左右同值**） |

「一份」= 间距阶梯的**模块档**（`APP_LAYOUT_GAP_CONFIG.size` × 密度系数 × 1，默认 **8px**），
随 `bridge.APP_LAYOUT_GAP_CONFIG.size` 与主题密度档自动缩放，[MUST NOT] 在消费侧写死像素补偿。

🔴 **为什么间隔一律做成「各自盒内的 padding」，[MUST NOT] 用根的 flex `gap` / `margin`**：
精细流的 reserve 是量 toolbar 的 `clientHeight` 得出的，而 `gap` 跨在两个盒**之间**、
`margin` 会穿透父盒 —— 两者都不计入 `clientHeight`，量不到 ⇒ **每页恒溢出一段**
（实测 846 的可用高被占到 854，甲方报障过）。

⚠️ 内容区的纵向 padding **在喂给 `HeightProvider` 之前就先扣掉了**，故 `scope.viewportHeight`
与向后代 provide 的可用高**恒等于内容盒真正的内高**——嵌套 `ListLayout` / `TabsMain` 直接吃它即可，
[MUST NOT] 再自行减一遍 padding（那是双扣）。

## `fillHeight` —— 让 `#bottom` 贴容器底（opt-in）

内容盒默认只有 **`max-height` 上限**：内容多短盒子就多矮，于是内容稀疏时 `#bottom` 会
**跟在内容屁股后面浮在半空**（它没滚走，只是没贴底）。开 `fillHeight` 额外补一条同值
`min-height` ⇒ 上下界重合 = 定高，底边恒落在预算下沿（抽屉里就是抽屉底、页面里就是内容视口底）。

```vue
<!-- 详情页底部要钉一条提交栏 -->
<ViewLayout :api="api" fill-height>
  <template #default>…可能很短的内容…</template>
  <template #bottom><ElButton type="primary">提交</ElButton></template>
</ViewLayout>
```

|                 | 内容短                           | 内容长                         |
| --------------- | -------------------------------- | ------------------------------ |
| 默认（关）      | 盒子矮，`#bottom` 跟在内容后     | 盒内滚，`#bottom` 停在预算下沿 |
| `fillHeight` 开 | **盒子占满预算，`#bottom` 贴底** | 同左（长内容下两者无差别）     |

- **默认关，且 [MUST] 保持 opt-in**：定高的一体两面是「内容短时盒内留白」。
  [MUST NOT] 改成默认开、更 [MUST NOT] 把 `max-height` 直接换成 `height` ——
  那会让**所有** refine 页面一起定高（甲方 2026-09-17：不应波及其他 refine 页面）。
- 仅 `refine=true` 有意义；自然流没有高度预算，本 prop 无声忽略。
- 同名同义于 `TableMain.fillHeight`（那边是让分页器被顶到容器底），两处认同一套心智。
- `AppPageListDetailLayout` 的 `#detailBottom` **自动开**（用了那个槽就是要贴底），
  仍可经 `viewLayoutProps.fillHeight` 关掉。

## ⛔ `appBar` 已摘除（v0.32.0 breaking）—— navbar 归位到 `AppPage`

`appBar` 随 v0.31.0 发过一版，**v0.32.0 摘除**。navbar 是 **page chrome**（一页恒一个、
横跨整页），做在内容容器上有三条代价：N 个族各做一遍 · 一页多容器时出两个 navbar ·
只盖住自己那半边。⇒ 整套原语（返回热区 / 光学对齐 / ⋮ 四形态 / 下边缘阴影）
**整体搬到 `AppPage`**，[MUST NOT] 在本组件重建。

| 旧（≤0.31.x）                                        | 新（≥0.32.0）                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| `<ViewLayout app-bar :back="…" :more-options="…" />` | `<AppPage show-nav-bar :back="…" :more-options="…"><ViewLayout … /></AppPage>`  |
| `#more` 槽在 `ViewLayout` 上                         | `#more` 槽在 `AppPage` 上                                                       |
| 标题走 `ViewLayout.title`                            | navbar 标题走 `AppPage` 的 `v-model:title`（子层回写见 `useAppPageTitleField`） |

详见 [README-AppPage](../../app-page/docs/README-AppPage.md) 与 `migrations/v0.32.0.md`。

⚠️ **本组件的 toolbar 仍在**，只是回到单一形态：标题行 + 操作区（有面时左缘带主色条，见「背景面与主色条」）。
`min-height: 44px` 是 toolbar 的**常驻纪律**（它当初就不是 appBar 专属），
[MUST NOT] 因为 appBar 没了就把它删掉。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（泛型 `P` 拉取参数 / `R` 数据）

| name                | type                                 | 默认       | 语义                                                                                                                                                                                                                                         |
| ------------------- | ------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api`               | `(params?: P) => Promise<R>`（必填） | —          | 数据拉取函数；每次拉取（激活 / 手动刷新 / 自动刷新）传入 props.params（未传收 undefined）                                                                                                                                                    |
| `params`            | `P?`                                 | —          | 拉取参数；响应式变化不自动重拉（调 `scope.refresh()`）                                                                                                                                                                                       |
| `refreshToken`      | `string \| number?`                  | —          | **外部重拉触发口**：值变化即重拉一次，且不进 `params`（不发给后端）。变为 `undefined` 不触发；挂载时已有值也不额外拉（首拉由激活态承担）。默认不传 = 老行为逐字节不变                                                                        |
| `refine`            | `boolean?`                           | 上下文默认 | 精细流：包 HeightProvider 精确扣 toolbar reserve（WatchSize 量高），内容区可用高 + scope viewportHeight；false=自然流。默认由 `useContextDefaults` 按直系父解析：AppPage `#default` / TabsMain 页签内容内 `true`，否则 `false`；显式传值优先 |
| `viewportHeight`    | `number?`                            | —          | 显式视口高，优先级最高；未传降级 inject SCOPE_VIEWPORT_MAX_HEIGHT scope 链                                                                                                                                                                   |
| `channel`           | `string?`                            | —          | 作为父时的 scope 标识。⚠️ 与 parentChannel 均 [MUST NOT] 响应式变更（setup 期快照）；且仅 refine=true 路径生效                                                                                                                               |
| `parentChannel`     | `string?`                            | —          | 作为子时定向消费的祖先 scope 标识（沿对象链 parent 找匹配）                                                                                                                                                                                  |
| `minHeight`         | `number?`                            | `100`      | 内容区可用高兜底下限（对齐 ListLayout/TabsMain 惯例）                                                                                                                                                                                        |
| `fillHeight`        | `boolean?`                           | `false`    | 内容盒撑满可用高（额外补同值 `min-height` = 定高）。用途 = 让 `#bottom` **贴容器底**；仅 `refine` 下有意义。同名同义于 `TableMain.fillHeight`                                                                                                |
| `toolbarSurface`    | `boolean?`                           | 上下文默认 | toolbar 是否铺背景面（主色条随面出现）。不传：位于开了 `showNavBar` 的 `AppPage` 内 ⇒ `false`，否则 `true`；显式传值优先                                                                                                                     |
| `showAutoRefresh`   | `boolean?`                           | `true`     | 是否显示自动刷新开关（透传 AutoRefreshGroup）                                                                                                                                                                                                |
| `showRefresh`       | `boolean?`                           | `true`     | 是否显示手动刷新按钮（透传 AutoRefreshGroup）                                                                                                                                                                                                |
| `showNavigation`    | `boolean?`                           | `true`     | 是否显示内置「上一条 / 下一条」导航。⚠️ **真正的显隐判据是可选 inject 探测**：只有置于 `AppPageListDetailLayout` 内才渲染，单独使用 ViewLayout 时无论本值为何都不渲染（老用法零变化）；本 prop 用于在门面内显式关掉                          |
| `leftExtraButtons`  | `ViewLayoutButtonConfig[]`           | `[]`       | 左侧额外按钮（`ActionBtnGroup` 配置，ctx = `{ loading, refresh }`，`default-size="small"` 对齐 table-toolbar）                                                                                                                               |
| `rightExtraButtons` | `ViewLayoutButtonConfig[]`           | `[]`       | 右侧额外按钮（置于 AutoRefreshGroup 之前）                                                                                                                                                                                                   |

### Slots

| 槽        | scope                                                                          | 语义                                                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 默认      | `{ data, loading, refresh, viewportHeight, fetchSeq }`（`ViewLayoutScope<R>`） | 展示内容；Descriptions 或自由编排皆可；viewportHeight refine 时给可用高（**已扣内容区自身 padding**）、自然流 undefined；`fetchSeq` = **成功**拉取次数（失败不递增），供下游懒加载块判「该重拉了」 |
| `#header` | `{ data, loading, title }`                                                     | 标题行（见上「标题行」段）；不传且无 `title` 时不渲染。**scope 带 `title`**（v0.32.0 补）⇒ 插槽接管后仍拿得到原标题，不必再从外面透一遍                                                         |
| `#bottom` | `{ data, loading, fetchSeq }`                                                  | 底部区：refine 固定在底部（计入 reserve）/ 自然流平铺在内容之后；不传不渲染。比 `#header` 多 `fetchSeq`（本槽放操作条，提交后要判「真的重拉成功了」）                                           |

### 内置上/下一条导航（仅列表详情范式内出现）

置于 `AppPageListDetailLayout` 内时，toolbar 右侧自动出现「上一条 / 下一条」+「第 N / M 条」读数。

- 位置 = **`rightExtraButtons` 之前（最靠左）**，`AutoRefreshGroup` 恒最右 —— 导航是**位置指示**不是业务动作，与业务按钮分档。
- 显隐 = **可选 inject 探测**（注入到才渲染）；单独使用 ViewLayout 时完全不渲染，`hasToolbarContent` 判定也不受影响。
- 已纳入 `hasToolbarContent`：「只有上下条、其余全关」的页面 toolbar 仍可见。
- `ViewLayoutButtonContext` 同步扩展导航句柄（`hasPrev` / `hasNext` / `index` / `total` / `goPrev` / `goNext` / `refreshList`，**门面外恒为 `undefined`**），业务自定义按钮可据此做「保存并下一条」等组合动作。

### Expose

无

## 反模式 / 注意

- **继续依赖已退役Panel**：改为默认槽自由编排只读内容，编辑使用明确表单流程
- **channel / parentChannel 响应式变更**：[MUST NOT]——setup 期快照，后续变更无效；缺 refine 的 channel 链静默失效
- **api 抛错不吞**：api 内部自行处理错误（ViewLayout 只保证 loading 复位，不拦截异常）
- **[MUST NOT] 用 `loading` 的 `true→false` 当「拉完了」的信号**：失败也会落回 `false`。要判「成功拉到新数据」用 `fetchSeq`（只在成功返回时 +1）
- **要重拉不要改 `params` 指望它自动生效**：`params` 响应式变化**刻意**不重拉（防请求风暴的既有设计）。「换了参数要重拉」= 改 `params` **并**动 `refreshToken`（或调 `scope.refresh()`）
- **[MUST NOT] 把触发值塞进 `params` 当刷新开关**：那会把纯前端的令牌发给后端、污染 API 契约——这正是 `refreshToken` 独立成 prop 的原因
- **[MUST NOT] 用 `:key="token"` 重建来实现重拉**：会连 toolbar / 按钮一起重建，连续切换时闪烁，且语义错位（chrome 不该随内容重建）——用 `refreshToken`
- **把随内容滚的东西塞进 `#bottom`**：[MUST NOT]——它是固定区，凡进此槽的都从内容可用高里扣
- **指望 `#bottom` 默认就贴容器底**：默认不贴（内容盒只有上限、不定高）——要贴底开 `fillHeight`
- **为了贴底把 `max-height` 改写成 `height`**：[MUST NOT]——那波及所有 refine 页面，是本 prop 存在的理由掉
- **在消费侧写死像素补偿 toolbar / 内容区的间距**：[MUST NOT]——间距由 gap 阶梯派生，写死会在改 `gap` / 换密度档时脱钩
- **在本组件上找 `appBar` / `back` / `moreOptions`**：[MUST NOT]——**已于 v0.32.0 摘除**，navbar 归位到 `AppPage`（`showNavBar`），见上
- **往 `#more` 插槽里塞带点击的组件**：[MUST NOT]——点击绑在外层 `span`，会与 `onMore` / 菜单双触发；插槽内容按哑内容设计
- **指望 navbar 自动在窄屏打开**：[MUST NOT]——只由消费方显式开（甲方：「是开启，不是检测是移动端」）；分栏详情 / 侧栏 / 弹窗里都窄，「窄 = 移动端」不成立。该口径随 navbar 一起搬到了 `AppPage`
- **让 `ViewLayout` 去关宿主的圆角**：[MUST NOT] 跨组件伸手，也 [MUST NOT] 用负 margin 挣脱宿主 padding；`AppPage` 四向槽的圆角由消费方把该槽 `*Bg` 传 `"transparent"` 自行处理
- **toolbar 不含表格能力全集**：对齐的是 table-toolbar 的**结构与视觉惯例**（左右分栏 + extra 按钮 + AutoRefreshGroup），[MUST NOT] 期待导出 / 批量下载 / 视图切换等表格特有能力出现在 ViewLayout——需要表格能力用 `ListLayout` / `TableMain`

## 关联

- 内部组合：`ActionBtnGroup` + `HeightProvider` + `WatchSize`（display 族）/ `AutoRefreshGroup`（misc 族）/ `useActivated` / `useChannelViewportHeight`（hooks 桶）
- 高度链：`SCOPE_VIEWPORT_MAX_HEIGHT` scope 链（viewportHeight / parentChannel 消费侧）
- 定位衔接：PanelMain整族已退役——ViewLayout 承接页级展示
- 范式页：`apps/reference/src/pages/layout/view-layout/guide/`

> 目录迁移：实现与配套归入 `components/compose/layout/view-layout`；公开契约、兼容别名与 panel 废弃时间点不变。

## C 源码迁移

本组件及配套类型/hooks/测试/API迁至 `packages/forge-compose/src/components`，去掉 pro 重复层。应用消费 `@done-coding/forge`；组件 API、槽与事件不变，Panel已由pn1031退役（C拆包时曾保留）。

## 无障碍 API（td1v4s）

内置导航图标按钮以“上一条”“下一条”命名。不新增 prop；组件目前没有独立文案覆盖入口，该限制记录在本批报告。
