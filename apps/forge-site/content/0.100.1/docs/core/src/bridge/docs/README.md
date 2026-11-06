# bridge 模块引导（接线中枢）

core 的「实例化中枢」：`createCoreBridge(options)` 产出 `CoreBridge` 单例——认证 / 布局 / 主题 / 路由派生的总接线口，经 `app.use(bridge)` 全局注入（`CORE_BRIDGE_KEY`），AppLayout 接收后 provide 给全部子组件。

**范式**：桥是 app 侧唯一的接线点（参考 `apps/reference/src/config/bridge.ts` 的实例化），core 组件/页面不直接持有 app 依赖。

## 导出面（`bridge/index.ts` 聚合）

| 符号                                                                      | 职责                                                                                                                         |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `createCoreBridge`                                                        | 工厂：传入 `CoreBridgeInitOptions`（配置 schema + auth facade + 存储 + 主题初值等），产出 `CoreBridge`                       |
| `CoreBridge`                                                              | 实例接口：`update()` 响应式更新 8 组配置视图 + `theme` 模块 + `layout` 折叠模块 + `badge` 徽标注册表 + auth/api/路由派生方法 |
| `BadgeEntry` / `CoreBadgeModule`                                          | 徽标注册表契约（见下「徽标注册表」章节）                                                                                     |
| `CoreBridgeRegisterOptions`                                               | 注册选项类型（配置键 → 默认值/访问器）                                                                                       |
| `AppConfig` / `AppEnvInfo`                                                | 配置 schema 顶层类型                                                                                                         |
| `AppLayout*Config`（Header/Footer/Sidebar/Aside/Body/Viewport/Gap）       | 布局 7 组配置视图类型（`update` 改它们即响应式生效）                                                                         |
| `AppThemeConfig`                                                          | 主题配置视图                                                                                                                 |
| `AppRouterConfig` / `AppRouterPathsConfig`                                | 路由配置 + 8 个基础 path 常量真源                                                                                            |
| `AppCacheConfig`                                                          | 缓存配置（命名空间 localStorage 由 `bridge/storage.ts` 工厂实例化）                                                          |
| `UserInfoAccess` / `UserInfoFieldAccessor` / `UserInfoPermissionAccessor` | userInfo 字段/权限访问器契约                                                                                                 |
| `AppBaseInfo` 等类型别名                                                  | 各配置视图的便捷类型                                                                                                         |

**模块拆分**（规则 12：按耦合度独立文件）：`theme/`（createBridgeThemeHook：风格 map + setStyle/setDark + 响应式 + 持久化）、`layout.ts`（折叠）、`badge.ts`（徽标注册表）、`plugin.ts`（插件注册）、`config-hook.ts`、`route.ts`（路由派生）、`state.ts`（useState 工厂）、`storage.ts`（命名空间存储）。

## 快速上手（接线范式）

```ts
// apps/reference/src/config/bridge.ts（完整实例化参照）
const appCoreBridge = createCoreBridge({
  APP_BASE_INFO: { name: "参考应用" },
  APP_ENV: { ... },
  APP_CACHE_CONFIG: { ... },
  APP_LAYOUT_HEADER_CONFIG: { ... },   // 布局 5 组
  APP_LAYOUT_VIEWPORT_CONFIG: { ... },
  APP_THEME_CONFIG: { themeStyle: "default", themeIsDark: false },
  APP_ROUTER_CONFIG: { meta: { default: ... } },
  APP_ROUTER_PATHS_CONFIG: { rootPath, homePath, loginPath, ... },  // 8 path 真源
  userInfoAccess: { ... },              // userInfo 字段/权限访问器
  storage: storageLike,                 // 命名空间 localStorage
  auth: { getToken, goToLogin, refreshToken, refreshAuth },
});
app.use(appCoreBridge);                 // opt-in：CORE_BRIDGE_KEY 注入
```

响应式更新（`update` 改配置视图，全链路即时生效）：

```ts
appCoreBridge.update("APP_LAYOUT_VIEWPORT_CONFIG", { ... });   // 单 key + 一级浅合并
appCoreBridge.theme.setStyle("studio-stage");
appCoreBridge.theme.setDark(true);
```

### 明暗覆盖（`theme.setDarkOverride`）

明暗有两层：`theme.setMode` / `setDark` 改的是**用户偏好**（写缓存、下次启动恢复）；
`theme.setDarkOverride` 改的是**当前会话的临时覆盖**——压过 mode 派生，但 [MUST NOT]
触达 storage、[MUST NOT] 改 `themeMode`。

```ts
appCoreBridge.theme.setDarkOverride(true); // 临时暗色（不写缓存）
appCoreBridge.theme.setDarkOverride(); // 无参清除覆盖，回落用户偏好
```

典型场景：本应用被宿主以 iframe 嵌入（如 SSO 登录页），明暗须跟随宿主临时接管，
而该应用**独立打开时仍按自己缓存的偏好**。

覆盖期间 `themeIsDark` / `themeColors` / `<html>.dark` 全部跟随覆盖值（无「视觉暗、
状态亮」的脱钩）；明暗切换控件仍显示 `themeMode`，即用户自己的偏好——语义上就该如此：
偏好没变，只是当前被宿主接管。

[MUST NOT] 用 `setDark` 模拟临时覆盖：`persist()` 写的是 `themeStyle + themeMode` 整条
payload，覆盖值一旦进了 `themeMode`，后续任何一次 `setStyle`（含插件风格异步注册时
`add` 内自动触发的那次）都会把它顺手写进缓存、污染独立打开时的偏好。

## 徽标注册表（`bridge.badge`）

一张扁平的 `key → 标记` 表；菜单项与 `ActionBtn` 按 key 查表渲染**绝对定位角标**（跟在文案右侧，**不压字**，且[MUST] 不改变宿主尺寸）。

**分工**：core **只负责展示**——聚合、归属、清标、数据来源全部在 app。

### 契约

```ts
type BadgeEntry = {
  /** 展示截止的绝对时间（epoch ms）；缺省或 0 = 永久展示 */
  expireAt?: number;
  /** 面向 agent / AI 对话的语义描述（core 不消费，纯透传；自由文本） */
  description?: string;
  /** 本条标的版本号（core 不消费，纯透传）；消费方据它做「版本化的已读记录」 */
  version?: string | number;
  /**
   * 角标显不显示；缺省 = 跟随全局默认（`defaultVisible`，本身缺省 `true`）。
   * 🔴 `false` **只藏角标、留 DOM 挂点**（引导插件照常定位得到）——
   * 与「压根没配这条 key」是两回事。遮挡档（`locked`）**拒绝隐藏**，dev 下会 warn。
   */
  visible?: boolean;
} & (
  | { kind: "count"; value: number; max?: number } // 数字角标
  | { kind: "new" } // 新
  | { kind: "updated" } // 更新
  | { kind: "beta" } // 内测：能用，不稳定
  | { kind: "wip" } // 开发中：仅提示，**不拦点击**
  | { kind: "planned" } // 规划中：还没开工
  | { kind: "deprecated" } // 待下线
  | { kind: "locked" } // 未开通：**唯一拦点击、也唯一拒绝隐藏的档**
  | { kind: "custom"; text: string; type?: BadgeProps["type"] }
  | { kind: "anchor" }
); // 伪标：恒隐藏角标，只留 DOM 挂点供引导定位
```

内置七档的文案与语义色由 core 统一定，保证跨 app 一致；`custom` 只在内置档不够用时用。
**七档一律走文字**（甲方 2026-09-19 撤回 v0.30 的图标态），详见
[BadgeMark 文档](../../components/core/data/badge-mark/docs/README-BadgeMark.md)。

**`version` 的用处**：消费方（如 `forge-plugin-tour`）把已读记录的 key 取成 `key@version`
⇒ **功能有实质更新时改一下版本号，引导 / 提示就对所有人重新出现一次**；不改则关过的人不再被打扰。
不填时退化为裸 `key`。与 `expireAt`（时效）、`bizKey`（业务标识）三者正交，
[MUST NOT] 拿它做灰度 / 权限判断。

`custom.type` 取 element-plus 的语义色档（`primary` / `success` / `warning` / `danger` / `info`），随主题亮暗自适配。[MUST NOT] 传色值字面量——规则 14，写死色切主题不响应。

### API

| 成员                   | 用途                                                                            |
| ---------------------- | ------------------------------------------------------------------------------- |
| `marks`                | 全部标记（响应式只读；内部 `shallowRef`，每次操作产新对象）                     |
| `setAll(map)`          | **整体替换** —— 轮询主路径，服务端本轮撤下的标随之消失                          |
| `set(key, entry)`      | 单点写入 / 覆盖                                                                 |
| `remove(key)`          | 单点移除                                                                        |
| `defaultVisible`       | **全局默认显不显示**（响应式只读，缺省 `true`）；逐条 `entry.visible` 恒优先    |
| `setDefaultVisible(v)` | 改全局默认；也可在 `createCoreBridge({ badge: { defaultVisible } })` 初始化时给 |

### 展示开关（`visible` / `defaultVisible`）

徽标当初是拿来做新手引导的；有了 `forge-plugin-tour` 之后徽标不再必须显示 ⇒ 两层开关：

| 层   | 写法                                                                                               | 缺省                   |
| ---- | -------------------------------------------------------------------------------------------------- | ---------------------- |
| 逐条 | `bridge.badge.set(key, { kind: "new", visible: false })`                                           | `undefined` = 跟随全局 |
| 全局 | `createCoreBridge({ badge: { defaultVisible: false } })` / `bridge.badge.setDefaultVisible(false)` | **`true`**             |

🔴 **「配置了但不展示」≠「没配置」**：前者照常渲染 `ElBadge` + `data-dc-badge-key` 挂点，
引导插件**仍能定位**；后者渲染裸插槽、连挂点都没有。
⇒ 隐藏走 `visible`，[MUST NOT] 用 `v-if` 把整条标掐掉。

🔴 **遮挡档（`BADGE_MASK_KINDS`，现仅 `locked`）拒绝隐藏**：逐条 `visible:false` 与全局默认
都不作用到它，dev 下 `console.warn` 一句。依据：遮挡是**功能**不是资讯，藏了会变成
「点不动又没说明的按钮」或「未开通却能点」。

⚠️ [MUST NOT] 用 `bridge.update()` 维护徽标：它是 `Object.assign` **浅合并**，轮询场景下服务端已撤下的标会永远留在表里。徽标独立走 `bridge.badge`。

### 两条失效路径（正交，可共存）

| 标记有无 `expireAt`                    | 怎么消失                      | 谁负责             |
| -------------------------------------- | ----------------------------- | ------------------ |
| **有**（如随版本写死到某日的 NEW）     | core 内部 60s tick 到点自动落 | core，app 不用管   |
| **无**（如服务端来的待办数 / Beta 标） | app 下一轮 `setAll` 刷掉      | app 的轮询节奏决定 |

`expireAt` **不是必填**——它是给「没有轮询通道」的静态标准备的兜底；有轮询的场景压根不用填。

### key 约定

| 消费点                                                                 | key 取值                                                                                               |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 菜单项（AppSidebar 菜单树 / AppHeader 模块条）                         | **路由 `name` 优先、`path` 兜底**（两者都查，先命中先用），无需另配                                    |
| `ActionBtn`                                                            | 显式 `badgeKey`（按钮没有 path）                                                                       |
| `TabsMain` 的 tab 标题（tab-bar / tile 卡片 / tile 角落 nav 三处同步） | `TabsMainItem.badgeKey`。[MUST NOT] 复用 `item.key`——那是**局部唯一**（v-model 值 + 槽名），跨页会串标 |

#### 菜单侧为什么 `name` 优先

看标的**数据来源**：有 `expireAt` 的静态标（随版本写死的 NEW）在前端代码里写，用什么 key 都行；
而**无 `expireAt` 的动态标（待办数 / 未开通）由服务端下发、app 轮询 `setAll`** —— 那才是主场景，
而**服务端不该知道前端的 URL 结构**。`path` 是展示层产物：加一层路由前缀、把模块挪一级、
路径国际化，服务端那张 key 表就整体失效，且**静默失效**（标不显示而已，不报错、不告警）。
`name` 是路由的逻辑标识，正是为这种跨层引用存在。

`path` [MUST NOT] 拿掉：`name` 在 vue-router 里是**可选的**，没配 name 的路由拿不到 key
就直接挂不上标；留 path 兜底也让本能力天然 additive —— 现有以 path 注册的一行都不用动。

key 空间不会串：`name` 惯例是 camelCase、`path` 必带 `/`。
[MUST NOT] 为此引入「带前缀区分类型」之类的 key 编码 —— 那是给零概率问题上税。

⚠️ vue-router 的 `RouteRecordName = string | symbol`，**symbol 不能当 key**；
`bridge.getRoutes()` 的解析期已过滤（`typeof name === "string" ? name : undefined`）。

### `description`：让这张表可被 agent 读

`description` 是 **core 完全不消费**的纯透传字段，供应用层做「本期上了什么功能」这类 AI 对话时，让模型知道某个 key 指向什么、怎么用、什么时候还不该用。

配合已有的 `kind`（= 变更类别，与 [Keep a Changelog](https://keepachangelog.com/) 的 Added / Changed 词汇同构）+ `expireAt`（时效），这张表本身就是一份**机器可读的功能公告**——业界的 Beamer / Headway / LaunchNotes 变更日志、Pendo / Appcues 功能采纳平台，维护的都是同构的 `{类别, 描述, 时效, 受众}` 条目。

```ts
bridge.badge.set("order.export", {
  kind: "beta",
  description:
    "批量导出订单为 Excel。适合按月对账；单次超 10 万行会超时，内测期不建议用于生产对账。",
});
```

**约定：core 内给 agent 读的描述统一挂在 `description` 字段名上；形状按任务定。**

| 场景                                   | 类型                                                            | 为什么                                                                                                                                                                                                |
| -------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **选型**（主题 preset，35 套里挑一套） | `CoreConfigDescription` 的 `{suitable, unsuitable}` 正反 facets | 闭集选型；`unsuitable` 可做**无需 LLM 的廉价预筛**，也强迫作者写清排除条件                                                                                                                            |
| **讲解**（徽标，说明某功能是什么）     | 自由文本 `string`                                               | 对齐 MCP / OpenAI function calling / JSON Schema 的 tool `description` 范式（均单 string，约定把「何时用 / 何时不该用」写在同一段）。讲解场景不做排除，拆正反会让「新功能的不宜选场景是什么」无从填起 |

[MUST NOT] 为「统一」立一个只含 `description` 的空壳基类让两边继承——形状本就不同，继承收益为零；且 agent 侧读描述最终都是拼进 prompt 的文本，形状差异几乎零成本。

⚠️ **边界**：重内容（图文步骤 / 深链 / 视频 / 前置条件）[SHOULD] 走 app 自己的知识库、用**同一 key 关联**，[MUST NOT] 往 `description` 堆——否则 `BadgeEntry` 会从「一个标」膨胀成 CMS 条目，core 被迫维护一个自己不消费的复杂 schema。

> 产品提醒：AI 主动推销「本期新功能」极易变成打扰（Clippy 陷阱）。要做 [SHOULD] 守低风险、可逆、ambient（不抢焦点）、用户始终在控制位。

### 已知限制（[MUST] 知悉，非缺陷）

- **时钟源是客户端**：用户机器时间不准或被改，`expireAt` 判定会偏。徽标是装饰，未做服务端对时。
- **到期最多滞留 60s**：tick 粒度，非实时。全 app 共享一个定时器，非每标一个。
- **不做冒泡聚合**：core [MUST NOT] 把子级的标上卷到父级菜单，见下。

### 为什么不做冒泡聚合

聚合要求 core 知道「一个 entry 归属哪个路由」，而真实系统里这个归属是多对多且有例外——弹窗里的按钮、全局工具栏按钮、一个入口同时挂在两个模块下。core 一旦定义归属模型，就是在替业务定信息架构，属越权。

需要「一级模块上有引导点」的效果：**app 自己算完，直接往父级 path 写一条 entry**，同样达到效果且归属规则完全可控。

## 布局配置里的行为开关

布局 8 组配置多为几何数值（宽高 / 间距 / 配色），少数是**行为开关**——需要单独知道语义：

| 配置键                      | 字段                      | 默认    | 语义                                                                                                                                              |
| --------------------------- | ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_LAYOUT_SIDEBAR_CONFIG` | `menuGroupMode?: boolean` | `false` | 侧栏菜单渲染形态：`false` = 树形（父级手风琴，默认收起）；`true` = 分组（父级降格为小字号弱色的 section heading，不可点不可折叠，子项常驻全展开） |

```ts
// 初始化时定形态
createCoreBridge({
  APP_LAYOUT_SIDEBAR_CONFIG: {
    width: 220,
    collapseWidth: 64,
    menuGroupMode: true,
  },
  // ...
});

// 或运行时切（本键在 UpdatableConfigKey 联合内，reactive 全链路即时生效）
appCoreBridge.update("APP_LAYOUT_SIDEBAR_CONFIG", { menuGroupMode: true });
```

**连带影响（开启 `menuGroupMode` 后）**：

- `AppSidebar` 不渲染折叠把手，侧栏宽度恒取 `width`——`collapseWidth` 在该形态下不生效；
- `bridge.layout.sidebarCollapsed` 的**读取被屏蔽**（避免历史持久化的 `true` 把无把手的侧栏锁死在窄条），但**持久化值原样保留**，关掉该形态即恢复；
- 因此该形态下调 `bridge.layout.setSidebarCollapse` / `toggleSidebar` 不报错但视觉无效。

适用判据与三级菜单的混合渲染规则见 [menu 族文档](../../components/nav/README.md) 与 [AppSidebar 文档](../../components/compose/layout/app-sidebar/docs/README-AppSidebar.md)。

## 主题预设的 `layout.body.shimPadding` 会被就地摘掉（v0.32.0）

`setStyle` → `applyLayout` 叠加 preset 的布局 partial 时，**`body.shimPadding` 不灌进 bridge**，
而是就地忽略 + 单独 `console.warn`（带 preset id）。

- **为什么**：该字段自 `huhyx7` 起**零渲染消费**，core 里唯一的消费者就是 `AppBody` 的那条
  废弃告警 ⇒ 灌进去的唯一后果是「**下游哪怕自己配了空对象也被恒刷告警、关不掉**」。
  消费方 `示例消费应用` 自 core 0.28 就删干净了，照样每次进页被点名，一路 grep 到
  `node_modules` 才发现是内置预设在写（32 套写了 14–32 的死值，v0.32.0 已全量清空）。
- **摘掉是零视觉变化**：它本就是死值（`AppBody` 注释写明内容矩形 inset 不含它）。
  🔴 [MUST NOT] 为「保住原观感」去改 preset 的 `layout.gap.size` —— 那个旋钮**按比例缩放四档
  间距**，会改掉该 preset 下**所有**间距，是拿一个不存在的问题换一个真的问题。
- **`body` 的其余字段照常叠加**（如 `background`）—— [MUST NOT] 把整个 `body` 一起丢掉。
- 连带：`AppBody` 那条告警因此**只剩两个来源**（`createCoreBridge` 配置 / 路由 meta），
  文案已改为直接列全，见 README-AppBody。

## 展开菜单到某路径（`bridge.layout.openMenuTo`）

```ts
const ok = bridge.layout.openMenuTo("/system/user/detail");
```

把目标路径**沿途的父级子菜单全部展开**，返回是否成功。缘起是引导（`forge-plugin-tour`）
要高亮折叠子菜单里的项 —— 那种元素虽在 DOM 里但 `display:none`、rect 全 0，
引导只能跳过它（插件侧已有 `getClientRects().length` 判空的防御，避免按 `(0,0)` 把弹窗
摆到屏幕左上角）。防御解决的是「不出坏效果」，本方法解决「到得了那一步」。

**判据是 `getClientRects().length > 0`**（目标项真的占布局），[MUST NOT] 用「没报错」当成功。

### 三种形态下的行为

| 形态                        | 行为                                                                 |
| --------------------------- | -------------------------------------------------------------------- |
| 常规树形菜单                | 逐级 `open()` 沿途父级 → `true`                                      |
| 分组形态（`menuGroupMode`） | 父级是 section heading、**本就全展开** ⇒ **no-op 返回 `true`**       |
| **侧栏折叠态**              | **先展开侧栏**（`setSidebarCollapse(false)`）再展开沿途父级 → `true` |

🔴 **折叠态自动展开侧栏是甲方 2026-09-18 的裁决**，且**事后不还原**：

- 代价知情：折叠态是**持久化到 localStorage 的用户偏好**，本方法等于程序化改写它。
  依据 = 引导是用户主动发起的流程，为让他看见而展开属正当副作用，且「他刚学会这个入口」
  留在展开态反而合理。
- [MUST NOT] 改成「展开后自动还原」：还原时机不可靠（引导弹窗还开着就还原会当场收起菜单），
  异常路径 / 快速切路由会让状态泄漏 —— 同 `store/app.ts` 的 viewportConfig 为何取派生而非
  「改真相源 + 还原」。
- 路径不存在 / 无侧栏（`showSidebar` 为假）→ `false`，且**不动任何状态**。

## 权限判定入口（`v-permission` / `usePermission` / 路由 `meta.permission`）

**一个判定口 + 三个入口**：全部基于 user store 的同一份权限列表，前端只管显示 / 隐藏 / 禁用，**后端是唯一权威**。
**零配置**：指令由 `app.use(bridge)` 一并全局注册；判定函数由 `createUserStore` 在 setup 内自 register 进 bridge。
有权限要求但 user store 尚未实例化 ⇒ 判**无权**（fail-closed）；登录 / 权限列表变化后，指令与 `can()` 响应式跟随。

### 统一的规则形态

```ts
type PermissionKey = string | number;
interface PermissionRule {
  key?: PermissionKey | PermissionKey[] | null; // 单码或数组，内部统一转数组
  check?: (results: { key: PermissionKey; pass: boolean }[]) => boolean; // 缺省 permissionCheckAny
}
```

- 🔴 **空数组 / `undefined` / `null` = 没有权限要求 = 放行**，`check` **不会被调用**（不存在 `[].every(...) === true` 这类陷阱：放行来自「没有要求」，不来自 `check`）。
- core 导出两个预设：**`permissionCheckAny`**（任一持有即通过，**默认**）/ **`permissionCheckAll`**（须全部持有）。
- 自定义 `check`：入参是每个码的 `{ key, pass }`；**抛错 ⇒ 判无权**（core 在调用处兜住）。
  它会被菜单过滤 / 路由守卫高频调用 ⇒ [MUST] 是**无副作用的纯函数**。
- 标量与单元素数组判定等价（`"a"` ≡ `["a"]`）。

### 三个入口

| 入口                          | 入参                                          | 说明                                                                         |
| ----------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------- |
| 路由 `meta.permission`        | `{ key, check, login, keyUsePath, editShow }` | `key` 为 `K \| K[]`；菜单过滤、`havePermissionByPath`、403、登录判定同一口径 |
| `usePermission().can(rule)`   | `K \| K[] \| { key, check? }`                 | **唯一**可传自定义 `check` 的模板入口；bridge 薄包装                         |
| `v-permission`                | `K \| K[]` + 修饰符                           | 按钮 / 操作项；见下                                                          |
| `bridge.havePermission(rule)` | 同 `can`                                      | 非组件环境（请求拦截、工具函数）                                             |

### `v-permission` 修饰符（两组正交）

| 组       | 修饰符               | 语义                                                                                                                                  |
| -------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 鉴权策略 | **`.anyOf`**（默认） | = `permissionCheckAny`：任一持有即通过                                                                                                |
|          | `.allOf`             | = `permissionCheckAll`：须全部持有                                                                                                    |
| 无权展示 | **`.hide`**（默认）  | `display: none`（**不拆 DOM**：Vue 后续以该元素为锚点插入兄弟时，游离元素会让 `insertBefore` 抛错；要真正不渲染用 `v-if="can(...)"`） |
|          | `.disabled`          | 原生 `disabled` + `is-disabled` 类 + `aria-disabled`，并在捕获阶段拦点击                                                              |

```vue
<ActionBtn v-permission="'user:create'">新建</ActionBtn>
<ActionBtn
  v-permission.allOf.disabled="['user:edit', 'user:audit']"
>审核</ActionBtn>
<!-- SDK 方法把端点权限挂在 .permission 上：显式取值（不做自动识别） -->
<ActionBtn v-permission="exportUsers.permission">导出</ActionBtn>
```

🔴 [MUST NOT] 用 `oneOf`：JSON Schema / OpenAPI 里 `oneOf` 是「恰好一个」，与本语义不符。

**值缺失**：指令值为 `undefined` / `null` / `[]` ⇒ 按「没有权限要求」**放行**，并**仅在开发环境**（bridge 的 `APP_ENV_INFO.isDev`）
警告「设置鉴权 但是鉴权值为 xxx」—— 写了指令却没给值，多半是取值写错。路由层不配 / 空数组**不告警**（公开页本就不配）。

### 路由复合页

一页承载多个权限区域时，`key` 写数组，页面内各区块再按各自的码显隐：

```ts
meta: { title: "用户与角色", permission: { key: ["user:list", "role:list"] } }            // 任一（默认）
meta: { title: "审计", permission: { key: ["a", "b"], check: permissionCheckAll } }        // 全部
```

- 解析产物 `RouteMetaResolveRaw.permissionRequirement`（归一后的 `{ key: K[], check }`，无要求为 `undefined`）。
- `permissionKey`（存量字段）**仅当 `key` 写成标量时给值**；写成数组（含单元素数组）一律 `undefined`，请读 `permissionRequirement`。
- 权限编辑树：复合页展示为父节点 + 各码子节点；父节点标签按 `check` 是否**引用等于**导出预设显示「任一 / 全部」，否则「自定义」
  （见 `apps/reference` `PermissionTree`）。

## 认证与请求接线

### 认证 facade（bridge 4 钩子 + userInfoAccess）

`CoreBridge` 提供 4 个**零参** auth facade（core 对 `UserInfo` 不透明）：`getToken?` / `goToLogin?` / `refreshToken?` / `refreshAuth?`；另有 4 个增量可选业务 api（`loginApi` / `logoutApi` / `getUserInfoApi` / `refreshTokenApi`，由 `createUserStore` 薄壳 register 注入）。

- `userInfoAccess`：token / refreshToken / permission 三字段访问器（get + set），createCoreBridge 时注入
- 接线样板：`apps/reference/src/config/bridge.ts`（userInfoAccess + auth facade + 8 path 配置全量实例化）

### AI 填充触发组件（`aiFillTrigger`，批次 e9dzn4 → gf9z3w 控制反转终态）

表单 AI 填充的**主通道**：应用级注册一个**触发组件**，全站根表单可用并驱动入口显隐。
core 出插座 + 落表，触发组件出全部 AI 交互 UI（popup / prompt / LLM 调用 / 错误 /
撤销按钮），应用层 bridge 初始化时组装——**core 与触发组件提供方（如 forge-agent 的
`LlmJsonTrigger`）互不知晓**。

```ts
// 应用层：薄 wrapper 预绑定传输参数后注册（组件来源任意，duck 契约即可）
const AppAiFillTrigger = (props) =>
  h(LlmJsonTrigger, { ...props, sseUrl: "/dev-ai/chat", model: "..." });
bridge.register({ aiFillTrigger: AppAiFillTrigger });
```

- `bridge.aiFillTrigger`（**响应式** shallowRef 只读）：挂载后注册也能驱动入口出现
  （[MUST NOT] 学 auth 槽位的裸闭包 let）。
- **duck 契约（core 渲染时喂给触发组件的 props）**：
  `getSchema: () => Promise<schema>`（= `getAiSchema()` 产出，含表单目标 description）
  - `onData: (data) => { appliedCount, undo }`（core 落表 + 高亮 + 建撤销快照后回执；
    撤销**按钮**由触发组件展示、**机制**归 core）。
- 表单侧 `FormMain` 的 `aiFillTrigger` prop 是**局部覆盖**（某表单换触发器），
  bridge 注册仍是主通道——[MUST NOT] 逐表单 props 接线当主路径。
- **LLM 选型归应用层**：core 对模型 / 服务商 / 凭据零感知、不依赖 forge-agent；
  触发组件也不必来自 forge-agent——满足 duck 契约的任意组件皆可（reference demo
  内 20 行 mock trigger 即证明）。
- **description 策略位** `register({ aiFillRequireDescription: true })`（默认
  `false`）：表单未配 `description` 时不予出触点——严肃交付场景强管控用。默认不拦
  （实证 description 是映射质量增强项而非可用性前提：零描述表单靠字段 label/类型/
  enum 照样 4/4 填对），仅 dev 提示一次倒逼补描述；`FormSearch` 自报家门天然豁免。

### 请求实例（@done-coding/request-axios）

请求层**不在 core 包内**——消费方用 `@done-coding/request-axios` 的 `createRequest` 自建全局实例（peer 依赖）：

- 样板：`apps/reference/src/api/request.ts`——`businessSuccessCodeList` + `getBusinessCode/getBusinessData/getBusinessMsg`（业务模型 key 由 `APP_API_BUSINESS_MODEL_KEY_CONFIG` 定）+ `beforeRequest` 注入 `Authorization`（token 取 `appCoreBridge.getToken()`）+ 拦截链（业务错误码分发 / token 刷新 / 跳登录 / 重拉权限）
- 业务 API 函数定义样板：`apps/reference/src/api/common.ts`（登录/登出/刷新/getUserInfo）

## 关联

- `CORE_BRIDGE_KEY`：`app.use(bridge)` 后的 inject 入口（未 use 时 inject 返回 undefined）
- 主题模块完整能力见 `apps/reference/src/config/theme-plugin.ts`（35 套资产注册）与 plugin-theme 包
- 范式演示：`apps/reference/src/pages/other/integration/bridge-update/`（update 响应式示例）

## 内部契约整理（30mf7k 第一批）

内部纯契约从工厂入口抽离到 `bridge/contracts/`；对外仍从包根 import。`createCoreBridge` 的泛型、插件接口、每实例状态与注入键不变。

## 事件总线（v0.35.0）

core 自持闭集契约 `bridge/contracts/event.ts`，不依赖组件或 report。`BridgeEventName` 常量、`BridgeEventData` 载荷映射和 `KNOWN_BRIDGE_EVENTS` 身份表由映射类型约束一致。34 个组件事件全部登记；crash/recover/auth-expired/server-error/offline/business-error 六事件尚无发射源；另含诊断 report-error，总计 41。未接线的登记不表示组件已实施。本批发射源仅按钮与刷新。

```ts
const off = bridge.onEvent((e) =>
  console.log(e.module, e.submodule, e.event, e.data),
);
bridge.emitEvent({ event: "refresh" });
bridge.emitEvent({ event: "action-click", data: () => ({ type: "primary" }) });
off(); // 幂等退订
bridge.setEventEnabled("action-click", false);
bridge.setEventMeta({ page: "demo" });
bridge.setEventSignalEnabled(true); // 显式启用镜像也算采集需求
```

`CoreBridgeInitOptions.events` 可设 `disabledEvents` 和 `signalEnabled`（默认 false）。`eventCollecting`、`eventSignalEnabled`、`eventSignal` 是只读 ref；onEvent 同步逐条送达，eventSignal 是最近一条，不能以 watch 代替逐条订阅。信封携带 meta（全局浅合并后单条覆盖）、path（本批恒 []）与 timestamp（毫秒）。

无订阅者且镜像未开时先返回：不求值 thunk、不建信封、不读取/合并 meta、不刷 signal、不建立监听/rAF/定时任务。事件禁用同样在 thunk 前返回。只读采集需求供后续高频埋点按激活态绑解资源。

thunk/filter/listener 同步异常隔离；thunk 失败不发半成品，改发 report-error；诊断期间的失败不再发诊断，且不写 console/网络。监听器仍同步执行，不能承诺耗时为零。此版本不开放动态 registry，不安装全局 crash/request 监听。

观察页：`/other/integration/event-bus`；真实按钮/刷新区与手工契约演示分开标识。

布局事件：`layout.setSidebarCollapse` / `setAsideCollapse` 实际改变后报告 `sidebar-toggle` / `aside-toggle`，载荷 `{collapsed}`。toggle、store、主题/agent、openMenuTo 共用 setter；持久化恢复与相同赋值不报。bridge 状态不依赖某个组件的激活态；无采集需求不求值载荷。
