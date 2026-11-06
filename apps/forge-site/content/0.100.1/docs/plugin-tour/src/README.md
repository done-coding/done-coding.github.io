# `forge-plugin-tour` —— 引导插件（族级文档）

> 本文件**不随 npm 发布**（`files` 发布 `es` / `types` / `third-party`，不含 `src`），是仓内开发文档。
> 对外的根 `README.md` 按甲方口径保持含糊。

包物理目录现为 `packages/forge-plugin-tour`，安装入口仍为 `@done-coding/forge-plugin-tour`；发布前安装身份、API、插件名与默认进度 key 统一为 tour；未发布，不提供旧名别名或旧 key 迁移。

## 定位

把**新手引导 / 新功能导览**做成一个装进 core bridge 的插件：内核用 `driver.js`（MIT、零依赖、
框架无关），锚点与讲解文案**复用 core 的徽标表**（`bridge.badge`），序列归本插件自己持有。

依赖方向 **tour → core 单向**，core 对 tour 零感知。

## 🔴 存在的理由（准入判据，评审时拿这条卡）

引导库的头号痛点不是弹窗怎么画，是**锚点**：要在业务代码里到处埋 `id` / `data-tour-step`，
与业务耦合、组件一改就失效。而 badge 已经把这件事做完了：

1. **锚点现成**：core 的徽标宿主已在 9 处挂了 `data-dc-badge-host`；`BadgeMark` 命中时
   还会回写 `data-dc-badge-key="<key>"` ⇒ `key → DOM` 一句 `querySelector` 打通，**零新增埋点**。
2. **文案现成**：`BadgeEntry.description` 本来就是讲解文案（其注释明写对齐 MCP /
   function-calling 的 tool `description` 范式）。
3. **时效现成**：`expireAt` 到期 = 功能不新了 = 自动退出导览，无需谁清理。

⇒ **app 只维护一张 badge 表，`new` / `updated` 标自动串成「本期新功能导览」**，零额外引导配置。

**若做完只是「又一个 driver.js 封装」，本插件就不成立** —— 那不如让 app 自己装 driver.js。

## badge 与 tour 的边界（[MUST NOT] 混为一谈）

**badge = 点状 · 无序 · 常驻的状态标记；tour = 有序 · 一次性的流程编排。**

- [MUST NOT] 往 `BadgeEntry` 塞 `step` / `order` —— 那会让 badge 从「标」退化成引导的配置文件。
- [MUST NOT] 把「看过没」写回 `bridge.badge` —— 那是**展示表**，不是用户状态表。进度归本插件。

## 快速上手

```ts
import { createCoreBridge } from "@done-coding/forge";
import { createTourPlugin } from "@done-coding/forge-plugin-tour";

const tour = createTourPlugin({
  badgeKinds: ["new", "updated"], // 默认值，可省
  router, // 只有「锚点不在当前页」的步骤才需要
});

appCoreBridge.use(tour); // ← 安装面 = core bridge 插件面，与 themePlugin 同一注入面

// 应用层自己持控制器（本插件不做 provide/inject）
tour.start(); // 有待导览步骤才真的启动；返回 boolean
```

### ⚠️ 安装面是 `coreBridge.use(...)`，不是 `app.use(...)`

本插件的 `install(ctx)` 是 **bridge 插件签名**（`ctx.bridge` / `ctx.update`），与 Vue 插件的
`install(app)` 同名不同签名，一个对象只能有一个。误用 `app.use(tour)` 会拿 Vue 的 `app`
当 `ctx` —— 故 `install` 内有守卫，会抛出带指引的错误而非静默半死。

## 序列从哪来

| 传了 `steps`？ | 序列                                                                                |
| -------------- | ----------------------------------------------------------------------------------- |
| 传了           | **以它为准**（数组顺序即步序）。每步可带 `badgeKey` 复用该标的 `description` 与锚点 |
| 没传           | 由 badge 表**自动串**：筛 `badgeKinds` → 排序 → 成步                                |

[MUST NOT] 做「显式 + 自动」拼接：那会让顺序依赖两套规则的交界，正是要避的坑。

### 自动串的排序 = 路由树次序

菜单侧的 badge key 就是路由标识，而 `bridge.getRoutes()` 的深度优先扁平化次序 = 菜单次序 =
用户心智次序，且**稳定可复现**。
[MUST NOT] 用对象 key 顺序 / 注册顺序 —— 两者都不稳定（坑：加一条标就换序）。

⚠️ core 的菜单徽标是「**路由 `name` 优先、`path` 兜底**」两套 key 并存，故次序表把
**`name` 与 `path` 都登记、共享同一序号**（它们指向同一个菜单项）。
只登记 path 会让以 name 注册的标全部落进「非路由 key」那档被排到末尾 —— 不报错，
只是顺序悄悄不对了。

非路由 key（`ActionBtn` 的 `badgeKey`）在路由 key 之后，组内按 key 字典序。

## 入选判据（逐条可证伪）

| 情形                                                                                          | 行为                                                                        |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `kind` 不在 `badgeKinds`                                                                      | 跳过（正常筛选，无警告）                                                    |
| 已过期（`expireAt` 到点；缺省或 `0` = 永不过期）                                              | 跳过（无警告）                                                              |
| **无 `description`**                                                                          | **跳过 + dev 警告** —— [MUST NOT] 拿菜单 title 硬凑，没内容的引导步骤是噪音 |
| `kind` ∈ 会遮挡的档（现为 `locked`，取 core `BADGE_MASK_KINDS`）且被**显式**配进 `badgeKinds` | **跳过 + dev 警告** —— 被遮挡的宿主点不动，与「引导你去点它」正面冲突       |
| 已看过（进度表命中）                                                                          | 跳过；`start({ force: true })` 强制全跑                                     |
| 锚点在 DOM 里找不到                                                                           | driver.js 的 `waitForElement` 等一会儿，超时按 `skipMissingElement` 跳过    |

### `badgeKinds` 默认 `["new","updated"]` 的依据

| kind              | 默认进 | 理由                                                                                          |
| ----------------- | ------ | --------------------------------------------------------------------------------------------- |
| `new` / `updated` | ✅     | 资讯档，语义正是「本期上了什么」                                                              |
| `beta`            | ❌     | 同为资讯档，但语义是「不稳定、需谨慎」，不该主动导览                                          |
| `locked`          | ❌     | 会遮挡宿主交互（点不动）；引导用户去点「未开通」是坏体验                                      |
| `wip`             | ❌     | 语义是「还不能用」，导览它意义不大。⚠️ 自 core 收窄遮挡档起它**已可点**，显式配进来不再被跳过 |
| `deprecated`      | ❌     | 「待下线」，导览它是反效果                                                                    |
| `count`           | ❌     | 待办数，不是功能公告                                                                          |
| `custom`          | ❌     | 语义由业务定，谁也不知道，[MUST NOT] 默认纳入                                                 |

类型取 `BadgeEntry["kind"]`（对交叉+联合做索引访问得全集）
⇒ [MUST NOT] 为此在 core 新增 kind 全集类型，也 [MUST NOT] 用 `BadgeBuiltinKind`（它不含 count / custom）。

## 锚点解析

```
[data-dc-badge-key="K"]  →  .closest([data-dc-badge-host])  →  够不到则用角标元素自身
```

两个属性名都由 core 导出（`BADGE_KEY_ATTR` / `BADGE_HOST_ATTR`），
[MUST NOT] 在本包硬编码字面量。

- **key 属性只在有标时存在**（与角标同生命周期）—— 无标即无可导览的锚点，这正是想要的。
- **属性值 = 真正命中的那个 key**：菜单项传的是候选列表 `[name, path]`，`BadgeMark`
  回写的是命中的那一个 ⇒ 与 `bridge.badge` 表里的 key 恒一致，解析链对得上。
- 步骤可用 `element` 显式覆盖（CSS 选择器 / 元素 / 取元素的函数，透传 driver.js）。

## 跨路由

菜单项的角标**恒在侧边栏**，所以由 badge 自动串出来的步骤一般不需要导航。
只有「锚点长在某个页面内部」（如某页的 `ActionBtn`）才要：给该步配 `route`。

- 有 `route` 且当前不在该路由 → 高亮开始前 `router.push(route)`，随后靠 driver.js 的
  `waitForElement` 等元素挂载；
- 配了 `route` 但没给 `router` → **跳过 + dev 警告**（[MUST NOT] 静默卡住）。

## 交互式引导（点目标才前进）

默认是「讲解」：点「下一步」翻页。给某一步配 `advanceOnClick: true` 就变成
「**点高亮元素才前进**」，可以串出真实操作链：

```ts
steps: [
  { badgeKey: "menu.orders", advanceOnClick: true }, // 点菜单（自己会跳页）
  { badgeKey: "btn.create", advanceOnClick: true, waitForElement: 8000 }, // 点「创建」→ 等弹窗
  { element: ".dc-form-main", description: "把这几项填好" }, // 整块表单镂空提示
  { badgeKey: "btn.submit", advanceOnClick: true }, // 点提交收尾
];
```

- **镂空区本来就能点**（driver.js `disableActiveInteraction` 默认 `false`）——
  纯讲解怕误触才把它设 `true`，但那样就无从「点了才前进」，两者互斥。
- 声明了 `advanceOnClick` 的步会**自动隐去「下一步」**：推进方式已经换成点目标，
  再留一个能绕过去的按钮，这一步就白做了。「跳过」保留，用户随时可退。
- ⚠️ **后续导航由用户的操作自然完成**（点菜单本来就会跳页），
  [MUST NOT] 再给下一步配 `route` 指望插件替他跳 —— 会跳两次。
- 下一步的锚点没那么快出现（弹窗渲染 / 路由加载）是常态，用 `waitForElement` 调大该步的等待。

## 🔴 起不来时的兜底（P0 修复，[MUST] 知悉）

**凡是本包给 `<body>` 加过的状态，任何退出路径都 [MUST] 清干净。** 两道：

1. **锚点进场即不可见** → 走与哨兵 `onGone` 同一套分级（有上一步则退、否则销毁），
   [MUST NOT] 静默让路。
   ⚠️ 原先这里让路给 driver.js 的 `skipMissingElement`，**那个假设是错的**：它兜的是
   「元素不在 DOM 里」，而折叠侧栏里的菜单项**在 DOM 里**、只是 `display:none`、rect 全 0
   ⇒ driver 认为找到了、不 skip，两边都以为对方管 ⇒ `destroy()` 永不调用，
   `<body>` 留着 `driver-active`，其自带的 `.driver-active * { pointer-events: none }`
   把整页打死（逃生口 `.driver-active-element` / `.driver-popover` 一个都匹配不到）。
2. **无条件启动收口**：`drive()` 后 300ms 确认 `.driver-popover` **真的占布局**，否则销毁。
   🔴 这**不是**第 1 条的重复 —— 失败时 driver.js 可能**根本不触发 `onHighlighted`**，
   挂在那里的修复一行都不会跑。**卡死的根因是缺兜底，不是菜单没展开。**

判据一律 `getClientRects().length > 0`（与 `anchor.ts` / 哨兵 / `bridge.layout.openMenuTo` 同源），
[MUST NOT] 拿「没抛异常」当成功。

⚠️ 锚点**异步出现且超过 300ms** 才占布局的步骤会被收口提前销毁 —— 正解是让锚点先就位再
`start()`（`openMenuTo` + 等它真的占布局），[MUST NOT] 指望引导在那里干等。

## 退出口径与按钮

- 按钮是「**跳过**」+「**下一步 / 知道了**」。
- 🔴 **点蒙层、按 ESC 都不会退出**（`allowClose: false`）：引导是有始有终的链路，
  误触蒙层就整条消失、而进度已按「露过面」记下 ⇒ 用户再也等不到它。要退出必须显式点「跳过」。
- 「跳过」复用的是 driver.js 的 `previous` 位（它的 `close` 按钮是右上角的 ×、无文案配置）。
  driver.js 在**首步硬编码禁用 previous**，本包已在 step 级用 `disableButtons: []` 覆盖 ——
  否则第一步的「跳过」是灰的，而第一步最需要它。

## 外观

driver.js 只暴露两个 CSS 变量，**颜色全写死**（`#fff` 底、`#2d2d2d` 字），暗色主题下
就是一块白底弹窗浮在深色页面上。本包在 runner 启动时**运行时注入**一段覆盖样式，
把弹窗、按钮、箭头、进度文字全部接到 `--dc-core-*` / `--el-*` 双源上，随主题切换自动跟。
主按钮走主色。[MUST NOT] 为此另开一个 css 入口 —— 那会让消费方多 import 一次样式文件。

## 进度持久化

走 **core bridge 的 `getStorage()`**（已按 app 命名空间派生），存一个 key（默认 `tour/seen`）
= 已看过的 step key 数组。

- [MUST NOT] 自带一套 storage —— 会和 app 的命名空间分家。
- [MUST NOT] 写回 `bridge.badge`。
- `reset()` 清空；`markSeen(key)` 单点标记；`isSeen(key)` 查询。

### 🔴 进度 key 会带上标的版本号

若步骤关联的 `BadgeEntry` 配了 `version`，进度 key 取 **`key@version`**；没配则是裸 `key`。

⇒ **功能有实质更新时，把那条标的 `version` 改一下，引导就对所有人重新出现一次**；
不改版本，关过的人永远不再被打扰。

```ts
bridge.badge.set("/orders/export", {
  kind: "new",
  description: "批量导出订单为 Excel…",
  version: 2, // ← 改这里 = 引导重新出现（进度 key 由 /orders/export@1 变为 @2）
});
```

- 分隔符 `@` 对齐 npm 的 `pkg@version` 直觉；badge key 是路由 path / route name /
  ActionBtn 自定 key，都不含 `@`，不会撞。
- `0` 是合法版本号（判据是 `=== undefined`，不是 `!version`）。
- **本特性上线前已记下的进度不会失效**——未配 `version` 的标 key 保持原样。
- ⚠️ `isSeen(key)` / `markSeen(key)` 收的是**最终进度 key**（带版本的那个），
  [MUST NOT] 传裸 key 去查一条带版本的记录。

## API

### `createTourPlugin(options?): TourPlugin`

| option         | 类型               | 默认                | 语义                                                                                                                                  |
| -------------- | ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `badgeKinds`   | `TourBadgeKind[]` | `["new","updated"]` | 哪些 kind 进导览                                                                                                                      |
| `steps`        | `TourStep[]`      | 无                  | 显式编排；传了就以它为准                                                                                                              |
| `router`       | `TourRouterLike`  | 无                  | 跨路由步骤需要；结构化最小面（`currentRoute` + `push`），不焊 vue-router 类型                                                         |
| `storageKey`   | `string`           | `"tour/seen"`      | 进度在 bridge storage 里的 key                                                                                                        |
| `driverConfig` | `driver.js Config` | 见下                | 透传 driver.js 全局配置（本包只预设 `showProgress` / `waitForElement` / `skipMissingElement` / 中文按钮文案，其余原样交给 driver.js） |

### `TourStep`

| 字段                    | 语义                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `key`                   | 步骤 key（进度表以它记）。缺省取 `badgeKey`；若该标配了 `version`，实际记的是 `key@version`（见「进度持久化」） |
| `badgeKey`              | 引用 badge 表里的一条：继承 `description` 与锚点                                                                |
| `element`               | 显式锚点，覆盖 `badgeKey` 解析结果                                                                              |
| `title` / `description` | 气泡标题 / 正文；`description` 缺省取 badge 的                                                                  |
| `route`                 | 锚点所在路由（不在当前页时先导航）                                                                              |
| `popover`               | 透传 driver.js 的 `side` / `align`                                                                              |

### 控制器（`createTourPlugin` 的返回值）

| 成员                                        | 语义                                                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `name`                                      | `"dc-plugin-tour"`（bridge 插件宿主按它幂等安装）                                                         |
| `install(ctx)`                              | bridge 插件安装函数（由 `coreBridge.use` 调用，[MUST NOT] 自己调）                                         |
| `pendingSteps`                              | 待导览步骤（响应式只读；已看过 / 不入选的已剔除）                                                          |
| `start(opts?)`                              | 启动；`{ force: true }` 忽略进度全跑；`{ keys: [...] }` 只跑这几个**且按数组顺序**。无可跑步骤返回 `false` |
| `stop()`                                    | 停止并销毁 driver 实例                                                                                     |
| `isSeen(key)` / `markSeen(key)` / `reset()` | 进度读写                                                                                                   |

## 边界（MVP，YAGNI）

**[MUST NOT] 做**：AI 自动生成引导、多分支流程、引导录制器。

## 文件分工

| 文件          | 职责                                                    |
| ------------- | ------------------------------------------------------- |
| `plugin.ts`   | 工厂 + 控制器组装（bridge 插件面、闭包内零模块级单例）  |
| `steps.ts`    | 步骤解析：入选判据 / 路由树次序排序 / badge → 步骤      |
| `anchor.ts`   | `key → DOM 锚点`（选择器构造 + closest 到宿主）         |
| `progress.ts` | 进度读写（bridge storage）                              |
| `runner.ts`   | driver.js 封装（建实例 / 跨路由钩子 / drive / destroy） |
| `types.ts`    | 对外类型                                                |

## C 依赖适配（历史记录）

框架引用由旧admin-core改为@done-coding/forge聚合；只改入口与manifest依赖，组件/API/视觉不变。当时只迁移依赖入口；本次发布前身份调整已在上文说明，本包仍不加入聚合。

## rel031 样式产物契约

根入口继续通过runner自动导入driver基础CSS，并在启动时注入原有主题覆盖。显式style.css兼容出口由Vite构建从当前driver依赖直接emit；两者并用可能重复基础规则，允许冗余，不改主题机制。driver原MIT文本随third-party/driver-js-license.txt发布，来源当前driver1.8.0，不代替本仓总版权。

## driver版本一致性（review round1）

随包style.css固定构建时版本，根入口自动CSS和runtime driver必须来自同一已验收版本；因此driver依赖精确固定1.8.0。升级driver必须同步重建CSS、复核第三方原许可并运行root/css/both消费回归；不得仅放宽范围让宿主静默升级，双份同内容CSS冗余的接受边界保持。
