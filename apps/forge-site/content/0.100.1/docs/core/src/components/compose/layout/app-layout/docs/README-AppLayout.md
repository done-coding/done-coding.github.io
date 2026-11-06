# AppLayout（应用布局总控·数据桥）

> 应用壳顶层组件：bridge/appStore/userStore 三注入 provide 子树 + 5 个内容锚（brand/userEntry/settings/themeSwitcher/aside）+ 内置默认经典布局 shell（布局插件可自供 shell 替换）。
> 范式页：`apps/reference/src/App.vue`（族总装配）、`apps/reference/src/pages/layout/app-layout/shell/`（自供 shell）

## 定位

- **何时用**：应用根组件——任何页面级应用的最外层骨架（App.vue 直接挂载）
- **何时不用**：布局形态深度定制时仍用它——通过布局插件自供 shell（AppShell 契约）替换内置默认，AppLayout 只承担数据桥/机制
- 职责边界：数据桥（三注入）+ 内容锚转发 + 水印；布局形态（sidebar/header 落位、折叠策略）归 shell（内置默认 AppShell = 经典布局 1:1 镜像）
- 页面内容**不经 AppLayout 默认 slot**——AppLayout 持 AppBody 塞进 shell 默认槽，AppBody 渲染 RouterView（见 AppBody 文档）

## 快速上手（最小可用）

App.vue 总装配——三个必填注入 + 两个必填内容锚即完整可跑：

```vue
<AppLayout :bridge="appCoreBridge" :appStore="appStore" :userStore="userStore">
  <template #brand><AppBrand /></template>
  <template #userEntry><UserHeaderAction /></template>
</AppLayout>
```

**要点**：

- `bridge` / `appStore` / `userStore` 三实例经 props 注入后 provide 子组件（`APP_LAYOUT_BRIDGE_KEY` / `APP_LAYOUT_APP_STORE_KEY` / `USER_STORE_KEY`）——主题切换、布局配置等跨层能力靠它们直读直写（见 AppTheme 文档）
- 内容锚只填「业务语义」，**落位权归 shell**（经典布局落位：brand → Header #left；userEntry/settings/themeSwitcher → Header #right；aside → AppAside 默认槽）

## 能力边界 / 按需使用

- **内容锚按需填**：`#brand` / `#userEntry` 是应用根必填（品牌 + 用户入口，缺则 Header 落位区空）；`#settings` / `#themeSwitcher` / `#aside` 默认可缺省——没有对应能力（设置入口 / 主题切换 / 右侧面板）就不填，shell 对应落位区空渲染。
- `watermarkContent`：默认不展示水印；仅需要页面水印时填内容（空数组/空串/undefined 即关闭；显隐走 content 切换，无独立开关 prop）。
- `sidebarAboveHeader`：默认 `false` 即够用；仅当 sidebar 需要 z-index 盖住 header 悬浮时开。
- **布局形态深度定制**：内置默认经典布局 shell 已可用（行为基线 [MUST NOT] 借重构改）；仅当落位/折叠策略不满足时才走布局插件自供 shell（AppShell 契约）——AppLayout 本身不动。
- **单页全屏 / 关动画**（路由级，非 prop）：走 `meta.layout` 两个可选项——见下「路由级布局开关」。
- **完整能力演示**（五锚全填 + 水印 + 自供 shell）：`apps/reference/src/App.vue`、`apps/reference/src/pages/layout/app-layout/shell/`——能力展示，非最小起点。

## 路由级布局开关（`meta.layout`）

除既有的 `header` / `sidebar` / `aside` / `footer` / `breadcrumb` / `bodyShimPadding`，还有三个整页形态开关：

| 选项                | 默认    | 语义                                                               |
| ------------------- | ------- | ------------------------------------------------------------------ |
| `noViewportPadding` | `false` | 全屏展示：viewport 四边套框留白归零                                |
| `noBodyPadding`     | `false` | 内容区贴边：本路由 `AppBody` 左 / 右 / 上的 gap 档归零（底边照旧） |
| `noAnimation`       | `false` | 进入本路由不做布局过渡动画（登录页 / 全屏页）                      |

```ts
{ path: "fullscreen", meta: { title: "全屏页", layout: { noViewportPadding: true, noAnimation: true } } }
```

**`noViewportPadding` 归零的是两条链，且同源**：① core 内部几何（header/sidebar/aside/footer/body 的 fixed 锚点与 minHeight）；② 对外 `--dc-core-viewport-*` CSS var（浮层 / 主题 decor / 业务页 CSS 消费）。二者都读 store 的 `viewportConfigEffective`，[MUST NOT] 让任一条回退成直读 bridge——只归零一边就是半吊子全屏（内容贴边了，读 CSS var 的浮层仍按套框内缘定位）。

配套：主题的套框装饰（`useFrameGeometry` → `hasFrame`）随之整层不渲染。

**只管最外圈套框留白**，不影响模块间距 `gap` —— 该页若仍开着 header/sidebar，模块之间的内缝照旧。

**`noBodyPadding` 管的正是那一截 gap**（与 `noViewportPadding` 正交，常一起开）：本路由内容区与相邻者之间的 gap 档归零 ——
贴视口边时去模块档、贴 header / sidebar / aside 时去外圈档；chrome 自身对视口的留白不动。底边**照旧**（底边口径待拍板，见需求池）。

- 🔴 视觉与几何**同源**：`bodyStyle` padding、`contentViewportInset`、`bodyShimStyle.minHeight` 三处一起归零，
  [MUST NOT] 只改样式 —— 否则「贴边了但可用高 / 内容矩形算错」（`AppPage` navbar、refine 可用高都读后两者）。
- 与 `AppPage showNavBar` 组合即通栏标题栏：navbar 取内容矩形定位，贴边时自动去圆角 / 阴影。
- 为什么不绑在 `showNavBar` 上：「页面要不要通栏」与「页面有没有 navbar」正交（沉浸页要通栏不要 navbar，桌面详情页反之）。
- 全局改间距仍走 `APP_LAYOUT_GAP_CONFIG.size`（四档联动）；本键只管单个路由。

```ts
{ path: "mobile-detail", meta: { title: "详情", layout: { noViewportPadding: true, noBodyPadding: true } } }
```

**`noAnimation`** 挂 `app-layout_noAnimation` 根类，与既有的「未登录关动画」`app-layout_noLogin` **并列**（互不替代，共用同一份 `transition: none` 规则）。

> 范式页：`apps/reference/src/pages/layout/app-layout/viewport-fullscreen/`——同一个组件挂两条路由、只差 meta，来回切即对照。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name                        | type                                        | 默认         | 语义                                                                                                                                                                                                                                                                                                                                    |
| --------------------------- | ------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bridge`                    | `AppLayoutBridgeSlice`（必填）              | —            | 布局桥窄化实例，注入后 provide 子组件（APP_LAYOUT_BRIDGE_KEY）                                                                                                                                                                                                                                                                          |
| `appStore`                  | `AppLayoutAppStoreSlice<UserInfo>`（必填）  | —            | 应用 store 窄化实例（APP_LAYOUT_APP_STORE_KEY）                                                                                                                                                                                                                                                                                         |
| `userStore`                 | `AppLayoutUserStoreSlice<UserInfo>`（必填） | —            | 用户 store 窄化实例（USER_STORE_KEY）                                                                                                                                                                                                                                                                                                   |
| `watermarkContent`          | `WatermarkProps["content"]`                 | 无默认       | 水印内容；空数组/空串/undefined 则关闭水印                                                                                                                                                                                                                                                                                              |
| `sidebarAboveHeader`        | `boolean`                                   | `false`      | sidebar z-index 高于 header                                                                                                                                                                                                                                                                                                             |
| `globalModalConfig`         | `RegisterEntry[]`（非必需）                 | 无默认       | 全局弹窗配置数组（shelf 限定 `"app"`）——全局登录 / 配置等通用弹窗的注册入口，直接传给 AppLayout 内部专用 ModalPorter（Symbol 模式，只收 app 级）                                                                                                                                                                                        |
| `enableGlobalImagePreview`  | `boolean`                                   | `false`      | 是否开启全局图片预览弹窗：开启后内部给 `globalModalConfig` **拼接**内置配置项 `{ key: APP_GLOBAL_IMAGE_PREVIEW_KEY, component: ModalImagePreview, shelf: "app" }`——消费方零配置拿全局图片预览，**命令式** `globalModalRemote.evoke(APP_GLOBAL_IMAGE_PREVIEW_KEY, { src })` 开图（点击路径不走它——ImagePreviewTrigger/ElImage 原生直达） |
| `enableGlobalVideoPreview`  | `boolean`                                   | `false`      | 是否开启全局视频预览弹窗：开启后内部给 `globalModalConfig` **拼接**内置配置项 `{ key: APP_GLOBAL_VIDEO_PREVIEW_KEY, component: ModalVideoPreview, shelf: "app" }`——消费方零配置拿全局视频预览，触发端 `VideoPreviewTrigger` 经遥控器按此 key 唤起                                                                                       |
| `v-model:globalModalRemote` | `GlobalModalRemote`                         | `() => ({})` | 全局弹窗遥控器对象：应用根（App.vue）持有后按 key 遥控全局弹窗（evoke / close / update）；AppLayout 透传给内置 app 级 ModalShelf（`v-model:remote`）挂载句柄                                                                                                                                                                            |

### Emits

无

### Slots

| 槽               | scope                                                                    | 语义                                                     |
| ---------------- | ------------------------------------------------------------------------ | -------------------------------------------------------- |
| `#brand`         | 无                                                                       | 品牌/应用名（经 shell 落位 Header #left）                |
| `#userEntry`     | 无                                                                       | 用户入口（登录态/用户下拉，经 shell 落位 Header #right） |
| `#settings`      | 无                                                                       | 设置入口（经 shell 落位 Header #right，紧随 userEntry）  |
| `#themeSwitcher` | `AppShellAnchorScope`（`{ Default?: Component }`，缺省 = 内置 AppTheme） | 主题切换（业务可覆盖默认内容）                           |
| `#aside`         | 无                                                                       | 右侧补充区内容（经 shell 落位 AppAside 默认槽）          |

**无默认 slot**——页面内容不经 AppLayout，而是经 shell 默认槽 → AppBody 渲染 RouterView。

### Expose

无

### 全局弹窗遥控器（`globalModalRemote`，应用根范式）

**性质**：AppLayout 把全局弹窗的控制面以 `v-model:globalModalRemote` 显式交给应用根（App.vue 持有遥控器）——**app 级弹窗只经这里注册 + 遥控**；全局唯一、与 app 同寿（AppLayout 常驻），不随路由切换销毁。**page 级弹窗不受影响**（页面内 Porter + page 架子，随页面生命周期）——两套入口各管各的层级。

**类型**：`GlobalModalRemote = Record<string, GlobalModalControl> & { modalKey: string[] }`——按业务 key 寻址，句柄三件套（`evoke(payload?)` / `close()` / `update(payload)`）；**`modalKey` = 已注册全局弹窗 key 清单**（架子 `registerConfig` 同步维护），触发端等调用方用 `modalKey.includes(key)` 显式判断「该 key 是否已注册」（`evoke` 无返回值，未注册直接调会 TypeError）；重复 `evoke` 是重新打开还是更新由 `globalModalConfig` 条目配置期 `sameKeyStrategy`（`recreate` / `update`）决定。

**应用根消费范式**（App.vue）：

```vue
<script lang="ts" setup>
import { ref } from "vue";
import { AppLayout } from "@done-coding/forge";

/** 全局弹窗配置（shelf 限定 "app"）——注册入口 */
const globalModalConfig = [
  { key: "globalLogin", component: GlobalLoginModal, shelf: "app" },
];
/** 遥控器：App.vue 持有，可随时 evoke / close / update 全局弹窗 */
const globalModalRemote = ref({});
</script>

<template>
  <AppLayout
    v-model:globalModalRemote="globalModalRemote"
    :global-modal-config="globalModalConfig"
    :bridge="appCoreBridge"
    :appStore="appStore"
    :userStore="userStore"
  >
    <!-- 业务锚槽 -->
  </AppLayout>
</template>

<script lang="ts" setup>
// 任意位置遥控（经 inject 或直传）：
// globalModalRemote.value.globalLogin?.evoke({ user: "x" });   // 打开
// globalModalRemote.value.globalLogin?.close();                // 关闭（全局弹窗不能只靠用户点击关闭）
</script>
```

**机制链路**：`globalModalConfig`（入）→ AppLayout 内部专用 ModalPorter（`globalOnly` Symbol 模式，只收 app 级）推送 → 内置 app 级 ModalShelf 挂载句柄进 remote（`v-model:remote`，`modalKey` 同步维护）→ 应用根遥控。无 provide——遥控器对象经 v-model 链直传（core 另导出注入 key `GLOBAL_MODAL_REMOTE_KEY` 供触发组件等消费端 inject，App 根 provide 同一对象即可接通）。

**全局预览弹窗拼接**：`enableGlobalImagePreview` / `enableGlobalVideoPreview` 开启时，AppLayout 把内置两项**拼进**传给专用 Porter 的配置数组（`[...globalModalConfig, 内置项]`，shelf:"app"）——业务 key 与预置 key 平级共处 remote（`modalKey` 均收录）。**命令式入口**（不经过点击）：`globalModalRemote.evoke(APP_GLOBAL_*_PREVIEW_KEY, payload)` 即开图/开视频（视频触发端 `VideoPreviewTrigger` 的点击决策链也经 `modalKey.includes` 命中后走此入口；图片触发端点击直达 ElImage 原生预览，不经全局）。关掉开关即整项摘除（`unregisterConfig` 同步清理）。

## 反模式 / 注意

- **别找 AppLayout 的默认 slot**：页面内容由 AppBody（内置 RouterView）渲染，AppLayout 只承接内容锚
- **内容锚只填内容、不决定落位**：落位权归 shell；自供 shell 时按 AppShell 契约接住整组内容锚（v-for 透传）
- **布局形态改动不动 AppLayout**：经典布局行为基线在内置 AppShell 模板（[MUST NOT] 借重构改其行为），定制布局走布局插件自供 shell
- **水印显隐走 content 切换**，无独立开关 prop

## 关联

- 布局插件自供 shell 契约：`AppShellProps` / `AppShellEmits`（空）/ `AppShellDefaultSlotScope`（`{ Footer: Component }`）/ `AppShellAnchorScope` / `AppShellSlots`（types.ts）
- 内部默认 shell：`AppShell`（经典布局 1:1 镜像，不导出）
- 内容主体：`AppBody`（AppLayout 持之喂 menuFlatList 守高度链）；页面容器：`AppPage`
- 主题切换：`AppTheme`（themeSwitcher 锚默认内容）
- 范式页：`apps/reference/src/App.vue`、`apps/reference/src/pages/layout/app-layout/shell/`

## 内部契约整理（30mf7k 第一批）

`AppLayoutAppStoreSlice` / `AppLayoutUserStoreSlice` / `AppLayoutBridgeSlice` 在底座定义并经原族入口转出。props 与注入键字符串保持不变。

## 内部分层（30mf7k / 3a7k03）

AppLayout 按职责从 `modal/preview` 与 `modal/infrastructure` 消费媒体和架子；AppPage 只消费 infrastructure。私有 Porter Symbol 仍保持单一定义、不进公开桶。

本次仅调整内部引用，组件位置、props、插槽、行为与样式不变；浏览器回归由复核者执行。

> 目录迁移：实现与配套归入 `components/compose/layout/app-layout`；公开契约、兼容别名与 panel 废弃时间点不变。

内部依赖说明（3a7k05）：`AppPageNavBarMoreOption` 由 nav 定义，此入口兼容转出同一接口；公开名称及 `label` / `value` 形状保持。

## C 源码迁移

本组件及配套类型/hooks/测试/API迁至 `packages/forge-compose/src/components`，去掉 pro 重复层。应用消费 `@done-coding/forge`；组件 API、槽与事件不变，Panel已由pn1031退役（C拆包时曾保留）。
