# AppBody（内容主体·RouterView + KeepAlive + 面包屑 affix）

> 页面内容渲染体：内置 RouterView（depth-0 KeepAlive）+ 内容区顶部面包屑 affix + #footer 槽 + 视口高度链 provide。
> 范式页：`apps/reference/src/App.vue`（AppLayout 持 AppBody 塞进 shell 默认槽）、`apps/reference/src/pages/layout/app-layout/layout/`（NoBreadcrumb/NoFooter/NoHeader/NoSidebar 显隐变体）

## 定位

- AppLayout 内部持有（喂 menuFlatList 守高度链），经 shell 默认槽塞入——消费方通常不直接挂载
- 默认内容 = 内置 RouterView + KeepAlive（keepAliveMaxCount 读 `bridge.APP_ROUTER_CONFIG`）+ 面包屑 affix（showBreadcrumb 经 appStore 控制）
- 高度链源头：provide `BODY_CONTENT_VIEWPORT_HEIGHT` / `SCOPE_VIEWPORT_MAX_HEIGHT`（新老 key 并列同源）/ `BODY_CONTENT_VIEWPORT_RECT` / `BODY_CONTENT_VIEWPORT_INSET`——后代页面（AppPage 等）消费
- #footer 槽接 AppLayout 组装 shell 吐出的 Footer 组件（内置默认吐 AppFooter）

## 快速上手（最小可用）

AppBody 由 AppLayout 自动装配，无需手动挂载——总装配见 AppLayout 文档：

```vue
<AppLayout
  :bridge="appCoreBridge"
  :appStore="appStore"
  :userStore="userStore"
  :watermarkContent="watermarkContent"
>
  <template #brand><AppBrand /></template>
  <template #userEntry><UserHeaderAction /></template>
  <template #aside><ChatAsidePanel /></template>
</AppLayout>
```

**要点**：

- `menuFlatList` 扁平菜单：面包屑匹配（route.matched 逐项查 menuFlatList 出链）+ 子零件高度链
- 路由级 keepAlive：路由 meta.keepAlive 开 + 「真叶子」判定（matched 链最深 component-bearing 记录）才进 KeepAlive；缓存数上限 `bridge.APP_ROUTER_CONFIG.keepAliveMaxCount`
- 视口高重算：激活态绑 resize 监听重算（useActivated 绑解成对），KeepAlive 失活自动解绑
- 面包屑：showBreadcrumb（appStore）开时内容区顶部 ElAffix 吸附，affix 高度经 `bridge.APP_LAYOUT_BREADCRUMB_CONFIG` 驱动（bridge.update 后跟随）

## 能力边界 / 按需使用

- **面包屑 affix 是自动行为，零配置**：AppBody 内嵌 ElAffix 面包屑——显隐由 `appStore.showBreadcrumb` 控制、高度经 `bridge.APP_LAYOUT_BREADCRUMB_CONFIG` 驱动，「有链时内容区自动让位 affix 高度」由内部承担。常规页面无需挂任何 prop。
- **KeepAlive 承接是自动行为，零配置**：开不开缓存由路由 `meta.keepAlive` + 真叶子判定声明（缓存上限读 bridge config）——本组件无开关，页面按需声明即可。
- `menuFlatList`：AppLayout 内部已喂入（守高度链）——消费方通常不需要自己传；仅直接挂载 AppBody（非经 AppLayout）时才需要。
- `#footer` 槽：默认已由 AppLayout 组装 shell 吐出的 Footer 组件填好（内置吐 AppFooter）——仅自供 shell 时才需要接管。
- **底色：`.app-body` 缺省不铺任何背景**（`akw76r`）。它是**容器**，容器一律透明 ——
  布局底由**全局 `html` 一处**铺（core 在主题 `<style>` 的 `:root{}` 里挂
  `background: var(--el-bg-color-page)`），一路透到这里。
  header / footer / sidebar / aside 四个模块的面色仍取 `bodyColor`（面）—— 底与面恒差一档，
  **模块间距（`APP_LAYOUT_GAP_CONFIG`，核内默认 `size: 8`）的缝、以及 header 上方的滚动遮挡条，
  露出的就是全局那层底**。
  - `bridge.APP_LAYOUT_BODY_CONFIG.background` **仍是逃生口**：显式给值即在 `.app-body` 这一层
    铺一块面（渐变 / 背景图 / 纯色皆可），只影响内容区那一块，不影响 chrome 模块与外框。
    不给值 = 透明（这是新的缺省）。
  - 🔴 [MUST NOT] 在业务侧用 `!important` 压 `.app-body` 的背景；更 [MUST NOT] 拿它去铺一层
    **"与全局底同色"** 的面 —— 那是把一个会变的值复制到第二处，换底 / 换主题时必留补丁
    （同 AppPage 文档那条）。要改底色，改的是**主题的 `bodyColor`**（底由它派生），不是在这里补色。
- **内容 ↔ chrome 让「外圈档」，内容 ↔ viewport 边让「模块档」**（r8kvnd 更正，v0.32.0）。
  原口径把两者当成同一件事（都算「内容对外」）—— 其实是两件：
  **没有 chrome 时，内容接替的是 chrome 的角色（最外层元素）**，就该拿 chrome 贴边那一档。

  ```
  有侧栏：  视口边 ─模块档─ sidebar ─外圈档─ 内容     ← 外圈档量的是「内容 ↔ chrome」，对
  无侧栏：  视口边 ─模块档─ 内容                      ← 这一档顶替的是 sidebar 的位置
  ```

  ⇒ **最外层到视口边恒为模块档**，不再随有没有 chrome 在 8 / 16 之间跳。
  改的是**左 / 右 / 上**三条（都是条件分支，只影响隐藏了对应 chrome 的页面）；
  ⚠️ **底边暂未改**：它是**无条件**的（`footer` 在流内），动它全仓每页都变，待甲方拍板。
  🔴 `contentViewportInset` 与 `bodyShimStyle.minHeight` [MUST] 同步改 ——
  它们与 `bodyStyle` padding **同源同条件**，只改样式就是
  「视觉对了但 `viewportHeight` / `contentInset` 算错」的静默偏差。

- **内容四周留白 = 间距阶梯的「外圈档」**（`gap × 2`，默认 16）。它**接替了已废弃的
  `APP_LAYOUT_BODY_CONFIG.shimPadding`** —— 此前这段空白由 `gap + shimPadding` 两个来源
  各给一半，`akw76r` 让容器层露底后两者在视觉上就是同一段空白，冗余由此产生。
  - `.app-body-shim` **不再铺 padding**（恒 0）。
  - 有 chrome 的那一侧：内容偏移 = `模块档 + chrome 高 + 外圈档`；**没有 chrome 的那一侧 = 模块档**（见上条）。
  - `shimPadding` 配了非 0 值只会得到一条 `console.warn`，不影响渲染。要调留白 ⇒ 改
    `APP_LAYOUT_GAP_CONFIG.size`（一个旋钮按比例缩放四档）。
  - 🔴 **那条告警说得出来源**（v0.32.0，hhae5s）：能走到它的**只剩两个**入口 ——
    ① `createCoreBridge` 的 `APP_LAYOUT_BODY_CONFIG.shimPadding`；
    ② 当前路由的 `meta.layout.bodyShimPadding`（优先级更高）。
    **主题预设那一路不会走到这里** —— preset 的 `layout.body.shimPadding` 在
    `bridge/theme` 的 `applyLayout` 里就**就地摘掉 + 单独点名**（带 preset id），
    [MUST NOT] 再灌进 bridge。
    动因：消费方自 core 0.28 就把该键删干净、配的是空对象，**照样每次进页被点名且关不掉**，
    一路 grep 到 `node_modules` 才发现是内置预设在写（32 套写了 14–32 的死值，已全量清空）。
  - 🔴 **chrome 模块彼此**（header ↔ sidebar ↔ footer ↔ 外框）仍取**模块档 ×1** ——
    只有「内容对外」才 ×2。[MUST NOT] 把两者拉平：拉平后 sidebar 会被一起推开，chrome 的节奏就散了。
- **完整能力演示**（NoBreadcrumb/NoFooter/NoHeader/NoSidebar 显隐变体）：`apps/reference/src/pages/layout/app-layout/layout/`

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name           | type                    | 默认       | 语义                                  |
| -------------- | ----------------------- | ---------- | ------------------------------------- |
| `menuFlatList` | `RouteMetaResolveRaw[]` | `() => []` | 扁平菜单（面包屑匹配 + 子零件高度链） |

### Emits

无

### Slots

| 槽        | scope | 语义                                        |
| --------- | ----- | ------------------------------------------- |
| `#footer` | 无    | AppLayout 组装 shell 吐出的 Footer 组件落点 |

默认内容 = 内置 RouterView + KeepAlive（keepAliveMaxCount 读 bridge.APP_ROUTER_CONFIG）——不提供可替换的默认 slot。

### Expose

无

## 反模式 / 注意

- **勿手写 RouterView 双分支**：keepAlive 判据（真叶子 + meta.keepAlive 合并语义）与渲染 key 策略（叶子按 route.path 按 params 隔离、壳按壳 record path 稳定单实例）由 `keep-alive.ts` 内部工具承担，[MUST NOT] 自造
- 高度链几何真相由 AppBody 写、后代只读（readonly 包装）——裸 ref 下放后代一句 `.value=` 即反向污染（写只读视图 dev warn + no-op）
- 面包屑高度经 bridge.APP_LAYOUT_BREADCRUMB_CONFIG 追踪，勿静态快照

## 关联

- 内部工具：`keep-alive.ts`（isKeepAliveRoute / keepAliveRouteKey，不导出）
- 面包屑：`AppBreadcrumb`（affix 内嵌 + `@show` 让位）
- 注入键：`APP_LAYOUT_APP_STORE_KEY` / `APP_LAYOUT_BRIDGE_KEY` / `BODY_CONTENT_VIEWPORT_HEIGHT` / `BODY_CONTENT_VIEWPORT_RECT` / `BODY_CONTENT_VIEWPORT_INSET` / `SCOPE_VIEWPORT_MAX_HEIGHT`
- 范式页：`apps/reference/src/App.vue`、`apps/reference/src/pages/layout/app-layout/layout/`

> 目录迁移：实现与配套归入 `components/compose/layout/app-body`；公开契约、兼容别名与 panel 废弃时间点不变。

## bridge 事件

`body-scroll {scrollTop}`：文档滚动以 `document.scrollingElement`（当前 reference 为 HTML）为真源，按 rAF trailing 报最后一帧位置，不采集内部表格等独立滚动区。仅激活且有采集需求时绑定监听，失活/卸载/退订立即解绑并取消待发帧；无 bridge 静默。

无订阅且 signal 镜像关闭时不求值载荷；事件不代替原业务回调。

## C 源码迁移

本组件及配套类型/hooks/测试/API迁至 `packages/forge-compose/src/components`，去掉 pro 重复层。应用消费 `@done-coding/forge`；组件 API、槽与事件不变，Panel已由pn1031退役（C拆包时曾保留）。

AppBody 在自身 `.app-body` 元素声明 `box-sizing: border-box`，使 min-height 包含 chrome padding，自身尺寸不依赖宿主全局 reset；宿主仍按 forge README 设置 border-box 约定。不对后代或业务插槽强加盒模型。
