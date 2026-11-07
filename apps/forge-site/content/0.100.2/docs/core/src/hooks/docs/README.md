# hooks 模块引导

全部经顶层 barrel 导出（`import { useActivated } from "@done-coding/forge"`）。命名空间前缀：`use<Feature>`。

| hook                       | 职责                                                                                                                                                                                                                                                                          | 何时用                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `useActivated`             | 激活态 hook：mounted/activated/deactivated/unmounted 四时机**直接派发** watchFn（`activatedInfo.isActivated` 分流），卸载必派发                                                                                                                                               | **组件内「随激活态绑解」副作用一律用它**（绑解成对写一处，天然覆盖 KeepAlive 失活/卸载）；发布库组件 [MUST] 用它（无宿主假设） |
| `useFeelSize`              | 感知元素尺寸（ResizeObserver）：`watchDom(dom)` / `unwatchDom()` + `sizeInfo`                                                                                                                                                                                                 | 需要感知某元素宽高变化                                                                                                         |
| `useBreakpoint`            | 视口断点：xs<768 / sm≥768 / md≥992 / lg≥1200 / xl≥1920（matchMedia，SSR 守护）                                                                                                                                                                                                | 响应式 span 默认走视口（与 ElCol 同引擎）                                                                                      |
| `useCustomBreakpoint`      | 容器宽断点：`useCustomBreakpoint()`（出 `elRef` / `activeBreakpoint` / `measured`）+ `resolveBreakpointByWidth(width)` + `resolveRootEl`（EP 栅格同源阈值）                                                                                                                   | **容器断点**（非视口）：FormMain `layoutByContainer`、compact 搜索等                                                           |
| `useObserveSize`           | 激活态感知 RO 观测原语：`getTarget` / `onResize` / `enabled` / `debounce`（默认 100ms，leading+trailing）                                                                                                                                                                     | 需要「捕获渲染后尺寸变化」（CSS 折叠/异步撑开），WatchSize `observeResize` 底层                                                |
| `useChannelViewportHeight` | 视口可用最大高解析：`viewportHeight` > scope 链（parentChannel 定向/就近）> fallback；返回 `viewportHeightFinal` + `nearestScope`                                                                                                                                             | 列表/表格/弹窗的高度计算核心消费契约                                                                                           |
| `useCoreThemeApply`        | 主题挂值：JS → root CSS var（`--dc-core-*` + `--el-*` 双命名空间）+ **全局底**（`:root{background}`）+ elevation 三档（底 `--el-bg-color-page` / 面 `--el-bg-color`=bodyColor / 抬升面 `--dc-core-surface`+`--el-bg-color-overlay`）+ `buildRhythmCss`（density/motion 节奏） | 由 AppLayout 启动；业务一般不直接调                                                                                            |
| `useCoreViewportApply`     | viewport 边框 CSS var 挂值（`--dc-core-viewport-*` / `--dc-core-gap`）                                                                                                                                                                                                        | 由 AppLayout 启动                                                                                                              |
| `useMenusDataDispatch`     | 菜单数据分发：`menus` / `menuFlatList` / `extractLevel1ToHeader` + 当前路由聚焦菜单                                                                                                                                                                                           | AppHeader/AppSidebar 消费；业务接 meta.menu 树                                                                                 |
| `usePermission`            | 权限判定组合式：`{ can(rule) }`，包装 bridge 的 `havePermission`；`rule` = `K \| K[] \| { key, check? }`（空 = 无要求放行，`check` 缺省 `permissionCheckAny`），响应式跟随权限列表                                                                                            | 计算属性、菜单、程序化动作、重组件的 `v-if`；按钮级显隐优先 `v-permission` 指令。详见 bridge 文档「权限判定入口」              |
| `useTimeout`               | 定时器 `[setTimer, clearTimer]`，`autoClear` 随激活态/卸载清理                                                                                                                                                                                                                | 组件内延时逻辑（替代裸 setTimeout，防泄漏）                                                                                    |

## 使用范式

**组件内副作用（最重要的一条）**：

```ts
// ✅ 绑解成对写一处（useActivated 四态直接派发，卸载自动解绑外部 target 监听）
useActivated((info) => {
  if (info.isActivated) {
    window.addEventListener("resize", onResize);
  } else {
    window.removeEventListener("resize", onResize);
  }
});
```

```ts
// ❌ 禁用：useActivatedExec / useActivatedEvent（已 deprecated，碎片化包装）
// ❌ 组件内禁用 onScopeDispose（语义 ≈ onUnmounted 但不覆盖 KeepAlive 失活 → 观测/订阅泄漏）
// ✅ 非组件 scope（hooks/store/裸 effectScope）才用 onScopeDispose
```

**视口高度链消费**（列表/表格高度）：

```ts
const { viewportHeightFinal } = useChannelViewportHeight({ scope: "my-scope" });
// 或作为子定向消费祖先：useChannelViewportHeight({ scope: "my-scope", parentChannel: "parent-scope" })
```

## 关联

- `useActivated` 详细语义见 `docs/specs/` 相关任务文档与 CLAUDE.md 规则 21
- 断点体系：`useBreakpoint`（视口）与 `useCustomBreakpoint`（容器）双源，见 FormMain `layoutByContainer` 文档

## `useCustomBreakpoint` 量到容器之前用什么档

### 🔴 第一帧**必然**是估计值，这点改不掉

Vue 的模板 ref 要到**第一次 render 之后**才有值，而 `activeBreakpoint` 在第一次 render
时就要被读走（它决定 span）⇒ **首帧没有元素可量**。
⇒ [MUST NOT] 声称 / 期待「首帧即容器实际档」；能改的只是**估得准不准**。

（顺带纠一处常见误解：卡点**不是**「要等 `ResizeObserver` 回调」——
`attach()` 在建 RO **之前**就同步 `evaluate` 了一次，且那个 watcher 是 `flush:"post"` + `immediate`。）

### 估计值 = **视口档**（原先是写死的 `"lg"`）

| 依据                         | 说明                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 是上界、且对通栏容器**精确** | 容器恒为视口的后代；多数页面的容器就是通栏 ⇒ 首帧估计值即终态值，零重排                                                          |
| 与「关掉这个功能」完全一致   | 视口档正是 `layoutByContainer` 关闭时会用的那个档 ⇒ 未量到之前**开着不会比关着更差**（原实现会：通栏 `xl` 容器首帧被按 `lg` 排） |
| 不是布局自反馈               | 视口宽是外部给定量，与本组件解算出的布局无关 —— 本仓踩过一次自反馈（`AppPage` 反测自身可用宽算 gutter），这条单向 [MUST] 保持    |

🔴 [MUST NOT] 改回任何**写死的档位**：常量对「不是该档」的容器一律是错的，只是错的方向不同。

⚠️ **窄栏仍会经历一次重排**（如侧栏容器 `xs`、视口 `xl`）——
那是上面那条「首帧必然是估计值」的必然结果，不是遗漏。

### `measured`：区分「估计」与「实测」

`activeBreakpoint` 当前这个值**是不是量自容器**。一旦量到就恒为 `true`
（解绑 / 失活后值仍是那次实测的结果）。

🔴 语义是**值的来源**，不是「RO 此刻连着没有」 ⇒ [MUST NOT] 在 `detach` 里把它复位成
`false`：那等于告诉消费方「这是个估计值」，而它明明是实测值。

拿不到视口宽（SSR / 脱离文档的 iframe，`innerWidth` 为 `0`）⇒ 退回 `"lg"`。
🔴 判据 [MUST] 落在**宽度值**上而非只判 `typeof window`：
`0` 直接喂给 `resolveBreakpointByWidth` 会静默得到 `"xs"` —— 一个看着合理实则凭空的档。

## elevation 三档怎么取值（`useCoreThemeApply`）

| 档                             | CSS var                                           | 取值                                                      |
| ------------------------------ | ------------------------------------------------- | --------------------------------------------------------- |
| **底**（layout ground）        | `--el-bg-color-page`（＋ `--dc-core-ground`）     | `ground` **显式优先**；缺省由 `bodyColor` 向黑压一步派生  |
| **面**（surface / 默认背景色） | `--el-bg-color`（＋ `--dc-core-body-color`）      | = `bodyColor`                                             |
| **抬升面**（overlay）          | `--el-bg-color-overlay`（＋ `--dc-core-surface`） | `surface` **显式优先**；缺省暗色由面向白提一步、亮色 = 面 |

⚠️ **`bodyColor` 是「面」不是「底」** —— 名字骗人（听起来像 `<body>` 的颜色），
实际语义是**默认背景色**。要设底 [MUST] 用 `ground`，[MUST NOT] 改 `bodyColor` 去凑。

### 近黑翻转（余量不足时的兜底）

`bodyColor` 的最亮通道 `< 12` 时（如 `#000000` / `#060606`），"向黑压一步"没有余量可压
（`#000` 压出来还是 `#000` ⇒ **底 = 面、缝彻底不可见**）。此时**翻转方向**：

- 底 = `bodyColor` 原值（把它当地面看）
- 面 = `bodyColor` **向白提一步**、抬升面再提一步

并 `console.warn` 提示作者改用 `ground` 显式指定。**显式给了 `ground` 就不会触发翻转**
（有显式值就不需要猜）。

判据用**余量**（最亮通道）不用「亮/暗」：后者需要外部告知 `isDark`，且会在
「深灰但不算暗色」的主题上判错；余量是纯可计算的。

**方向不随亮暗翻转**：无论亮暗，**面恒比底亮** —— 这是业界共识（EP 亮 `#f2f3f5 < #fff`、
EP 暗 `#0a0a0a < #141414 < #1d1e1f`、M2 白 overlay 递增、M3 surface-container tone 递增）。
近黑翻转翻的是**谁来充当基准**，不是"底比面亮"。

## useBridgeReport

setup 内 `const report = useBridgeReport()`；有载荷用 `report("action-click", () => ({type:"primary",key:"save"}))`，无载荷用 `report("refresh")`。事件名决定载荷，无 bridge/无采集/被禁用都不求值 thunk。hook 不自动建立监听或定时任务。
