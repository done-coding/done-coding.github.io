# ModalPorter（弹窗注册表·命令式拉起）

> 弹窗注册表：`modalList` 声明 key → 组件 → 架子，`evoke(key, payload)` 命令式拉起；nsKey 命名空间 + 失活/卸载自动清理。
> 范式页：`apps/reference/src/pages/feedback/modal/porter/showcase/`（三层自定义架子 + 触发按钮组）、`apps/reference/src/pages/feedback/modal/guide/`（对接内置 page 架子）

## 定位

- **何时用**：代码任意位置需要命令式拉起弹窗（列表行操作、深层组件内触发），且弹窗有「开弹窗」层级诉求时
- **何时不用**：模板内直接挂载的弹窗（`v-model:show` 声明式）不需要 Porter；无嵌套的单层弹窗直接用 ModalConfirm/ModalForm/ModalDetail
- 职责边界：Porter 是「注册表 + 拉手」——`modalList` 把 key 与弹窗组件/懒工厂/架子绑定，`evoke` 沿 key 查表拉起并把 payload 注入弹窗 props；弹窗实例落在 ModalShelf 架子上
- 命名空间：每个 Porter 实例的注册 key 会被包装为 `p{porterUid}:{key}`——多 Porter 实例同 key 不互踩

## 快速上手（最小可用）

对接内置 page 架子（`modal/guide/config.tsx`——`shelf` 传字符串 `"page"` 即指 AppPage 内置架子）：

```ts
const modalList: RegisterEntry[] = [
  {
    key: "standardDetailSpace",
    component: () => import("./modal/Index.vue"),
    shelf: "page",
  },
];
```

**要点**：

- `modalList` 注册项：`{key, component | 懒工厂, shelf, sameKeyStrategy?}`——`shelf` 传 `"app"`/`"page"` 字符串寻址内置架子，custom 级传 `ShelfInstance`（ref 的架子实例）
- `evoke(key, payload)`：key 必须在 `ModalShelfMap` 声明合并中注册（类型化），payload 形状全链推导；未配置的 key 或找不到架子 → `console.error` + 返回 `null`
- 弹窗组件侧声明 `ModalInjectedProps<P>`：`{show, closeFn, removeFn, payload}`——show 受架子控，closeFn 挂 `onUpdate:show` 即可命令式关闭
- 生命周期：Porter 失活/卸载时自动 remove 本 porter 注册的全部 nsKey（useActivated 统一收口）——**[MUST NOT]** 手动补偿清理

## 能力边界 / 按需使用

- **默认即够用：对接内置 page 架子**——列表行操作/深层组件内命令式拉起，`shelf: "page"` 即指 AppPage 内置架子，零自定义架子。
- **懒工厂按需**：`component: () => import(...)` 按需加载（推荐默认）；仅当弹窗必须随页面首屏就位时才直接传组件对象。
- `sameKeyStrategy`：默认 `"recreate"`（同 key 再 evoke 关旧重建）即够用；`"update"`（已开则整体替换 props 不 remount）仅当同 key 弹窗需要原位刷新数据时选。
- `shelf: "custom"`：仅当 app/page 两层不够（第三层以上）时才传 `ShelfInstance` 自建 custom 架子（判据见 ModalShelf 能力边界）。
- **完整能力演示**（三层自定义架子 + 触发按钮组 + 多 key 注册）：`apps/reference/src/pages/feedback/modal/porter/showcase/`、`apps/reference/src/pages/feedback/modal/guide/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name         | type                      | 默认   | 语义                                                                                                                                                                                                                 |
| ------------ | ------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modalList`  | `RegisterEntry[]`（必传） | —      | 弹窗注册表（key → component/懒工厂 → shelf → sameKeyStrategy）                                                                                                                                                       |
| `globalOnly` | `symbol`（core 内部专用） | 无默认 | **专用模式标识**：仅 AppLayout 内部调用时传（`APP_GLOBAL_MODAL_PORTER_SYMBOL`，core 内部不导出）——只接受 `shelf:"app"` 条目推送，非 app 条目 `console.error` + 过滤；外部 [MUST NOT] 使用（Symbol 拿不到即无法误用） |

### Slots

| 槽   | scope | 语义         |
| ---- | ----- | ------------ |
| 默认 | 无    | 页面内容透传 |

### Expose

| 成员    | 签名                                                                                        | 语义                                                                              |
| ------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `evoke` | `<K extends keyof ModalShelfMap>(key: K, payload: ModalShelfMap[K]) => EvokeHandle \| null` | 按 key 拉起弹窗（payload 类型全链推导）；未配置/找不到架子 → console.error + null |

## 机制

### modalList 注册表寻址

`RegisterEntry<K>`：`{key, component | 懒工厂, shelf: "app"|"page"|ShelfInstance, sameKeyStrategy?}`——setup 期同步 inject app/page 控制器并缓存；`shelf:"app"`/`"page"` 字符串寻址内置架子，custom 经 `ShelfInstance` ref 直取。懒工厂写法 `() => import("./modal/Index.vue")` 按需加载。

### nsKey 命名空间

每个 Porter 实例把注册 key 包装为 `p{porterUid}:{key}`——多 Porter 实例（多页面/多架子）同 key 不互踩；evoke/remove 都以命名空间后的 nsKey 寻址，业务无需感知。

### 卸载自动清理

失活/卸载时自动 remove 本 porter 注册的全部 nsKey（useActivated 统一收口）——Porter 销毁即弹窗实例随架清理，**[MUST NOT]** 手动补偿清理。

### 专用模式（`globalOnly`：AppLayout 内部全局弹窗 Porter）

AppLayout 在调用内置 app 级 ModalShelf 的**子元素最前**位置调用一个打 `globalOnly` 标识的专用 Porter，配置数据直接来自 AppLayout 的 `globalModalConfig` prop——**全局弹窗的唯一注册入口**。专用模式下：

- 只接受 `shelf:"app"` 条目；**非 app 条目（page/custom）`console.error` + 过滤**——page 级弹窗注册不得逃逸到全局面（page 级作用域由路由层保证）；
- 推送的配置落到 app 级架子 → 挂载进 `globalModalRemote`（经 AppLayout `v-model:globalModalRemote` → 内置架子 `v-model:remote`），应用根即可遥控；
- 专用 Porter 生命周期与 AppLayout 同寿——**规避页面级 Porter 配 app 级弹窗的孤儿弹窗反模式**（页面卸载后弹窗还挂在常驻 app 架子上、句柄丢失）。

### 注入给弹窗的 props（`ModalInjectedProps<P>`）

架子把 `{show, closeFn, removeFn, payload: P}` 注入弹窗组件（见 ModalShelf 文档）。

### 放进 `AppPage` 方位槽 ⇒ 挂载时一条指名道姓的 `console.error`

`AppPage` 的 `#top` / `#bottom` / `#left` / `#right` 是**方位槽**（fixed 悬浮区），
它们是页面内置 `ModalShelf` 的**兄弟节点**而不是后代 ⇒ `provide` 够不到，
`evoke()` 恒返回 `null`（表现为「点按钮毫无反应」，不报错也不崩）。

Porter 挂载时读直系父的 `data-dc-slot`，命中方位槽即报：

```
[ModalPorter] 它被放在 AppPage 的 #top 槽里 —— 方位槽是 ModalShelf 的兄弟节点，
provide 够不到，evoke() 恒为 null（表现为「点按钮毫无反应」，不报错不崩）。
[MUST] 移到**默认槽**（page 架子就住在默认槽里；与 AppPage 并列同样够不到）。
Porter 自身零 DOM 输出，放默认槽里不占任何版面。
```

- **方位槽里放 Porter 没有任何正当用法** ⇒ 这条恒报（不限 dev），且零误报
- 默认槽 / 脱离 `AppPage` 单用 ⇒ **零输出**
- 🔴 出口是**默认槽**，[MUST NOT] 顺手改成「与 `AppPage` 并列」—— page 架子
  （`ModalShelf level="page"`）就住在 AppPage 的默认槽里，并列**同样够不到**，
  `evoke()` 一样恒为 null。「与 AppPage 并列」只对**不需要 page 架子**的东西成立
  （声明式挂载、自己 teleport 走的弹窗组件）
- 「弹窗经弹层挂载、不占版面 ⇒ 放哪都行」是**只对了一半**的推理：弹窗自身 teleport 走了，
  但**槽本身**照样渲染（fixed + padding + 背景），白占一条高度 —— 见 `AppPage` 文档的空壳槽检测

## 反模式 / 注意

- **未注册 key 是静默失败面**：`evoke` 返回 null + console.error——消费侧 [MUST] 判空（`evoke(...)?.close()` 或先判 null），别假设一定成功
- **shelf 字符串只认 "app"/"page"**：custom 架子必须传 `ShelfInstance`（ref 实例），传字符串进 custom 寻址不通
- **key 类型必须声明合并**：evoke 的 key 泛型约束 `keyof ModalShelfMap`——业务 [MUST] 在 `.d.ts` 里 declare module 扩展 `ModalShelfMap`（见 ModalShelf 文档），否则 key 不在 map 上 TS 直接拦截
- **自动清理别补偿**：Porter 失活/卸载已自动 remove 全部 nsKey，手写 `onUnmounted` 清理是重复劳动（也可能提前清掉活跃弹窗）
- **页面级 Porter [MUST NOT] 配 `shelf:"app"` 条目**：页面卸载后弹窗仍挂在常驻 app 架子上 → 孤儿弹窗（唤起句柄已死、只剩弹窗自身 closeFn）；app 级弹窗唯一正道 = AppLayout `globalModalConfig` + 内部专用 Porter + `globalModalRemote` 遥控
- **[MUST NOT] 把 Porter 放进 `AppPage` 的 `#top`/`#bottom`/`#left`/`#right`**：方位槽够不到 page 架子（`evoke()` 恒 null），且槽本身白占版面；挂载时会有一条点名报错。出口是**默认槽**（Porter 零 DOM 输出，放那里不占任何版面）——
  [MUST NOT] 改成「与 `AppPage` 并列」，page 架子就在默认槽里、并列同样够不到
- **弹窗 UI 不在 Porter 插槽里写**：Porter 只是注册表宿主，弹窗经 evoke 落在架子上渲染——插槽只放页面内容

## 关联

- 架子宿主：`ModalShelf`（level 层级 + ModalShelfMap declare merge + evoke/remove/close + sameKeyStrategy）
- 注入契约：`ModalInjectedProps<P>`（show/closeFn/removeFn/payload，架子注入弹窗组件）
- 句柄：`EvokeHandle`（close / update 增量合并，不 remount）
- 弹窗组件族：`ModalConfirm` / `ModalForm` / `ModalDetail`（作注册表 item；DetailModalItem 薄适配器范式见 `list-layout/guide/`）
- 类型：`RegisterEntry<K>`、`ModalSameKeyStrategy`（"recreate" 默认 / "update" 整体替换 props 不 remount）
- 范式页：`apps/reference/src/pages/feedback/modal/porter/showcase/`、`apps/reference/src/pages/feedback/modal/guide/`

> 目录迁移：实现与配套收纳到 `components/feedback/modal-porter`，包根 API 与演示能力保持。

## bridge 事件

Porter 不独立发 modal 事件，统一委托 ModalShelf；普通命名空间句柄与 AppLayout 全局 remote 都覆盖。失活清理不重复 close，专用 Porter 重新激活恢复配置注册。

无订阅且 signal 镜像关闭时不求值载荷；事件不代替原业务回调。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-feedback`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
