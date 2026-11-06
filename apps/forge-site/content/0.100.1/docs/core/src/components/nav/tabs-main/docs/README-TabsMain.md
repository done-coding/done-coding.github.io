# TabsMain（配置化页签容器）

> 配置驱动的页签容器：v-model 激活 + 动态命名槽 / 组件渲染 + 视口高度链（refine 精细流 / 自然流）+ 路由 query 双向同步 + 平铺 tile 模式（卡片列 + 角落 nav + scrollspy）。
> 范式页：`apps/reference/src/pages/nav/tabs/showcase/`（基础 + queryKey）、`pages/nav/tabs/nested-channel/`（channel 嵌套链）、`pages/nav/tabs/tile/`（平铺）

## 定位

- **空间一等公民**：多 tab 空间首选（单层或嵌套 tab 链）
- **何时用**：页签切换内容的容器（单层或嵌套 tab 链），需要可用高度计算 / 路由深链 / 平铺卡片列时
- **何时不用**：无页签语义的纯内容高度计算用 `HeightProvider`；列表页场景直接用 `ListLayout`
- 双流实现：refine=false 自然流（`TabsNaturalFlow`，不包 HeightProvider，scope viewportHeight 为 undefined）；refine=true 精细流（`TabsRefineFlow`，HeightProvider 精确扣 header reserve + padding）——均为内部实现，不导出
- 内部实现（不导出）：`TabsHeader` / `TabsTile` / `TabsNaturalFlow` / `TabsRefineFlow` / `use-tabs-query-sync.ts`

## 快速上手（最小可用）

最常用基础 tab 形态——默认配置即够用（自然流，不依赖 queryKey / channel / tile）：

```ts
const active = ref<string>();
const tabs = [
  { key: "overview", title: "概览" },
  { key: "editor", title: "编辑器", component: markRaw(EditorPane) },
];
```

```html
<TabsMain v-model="active" :tabs="tabs">
  <template #overview="{ tab, active: a }"> ... </template>
</TabsMain>
```

**要点**：

- `#<key>` 动态槽优先于 `tab.component` 回退；槽 scope `{ tab, active, viewportHeight }`（refine 精细流给可用高度、自然流 undefined）
- `component` [MUST] 用 `markRaw` 包裹，[MUST NOT] 直接放响应式组件对象
- 槽内角标用 opacity 切换勿用 v-if——会改标题宽度致下划线动画错位

## 能力边界 / 按需使用

- **refine（精细流）：默认 `false`（自然流）即够用。** 自然流不包 HeightProvider（scope viewportHeight 为 undefined），页签内容按自身尺寸渲染即可；仅当 tab 内容需要精确撑满到视口底（页签头内滚、内容区借可用高度）才开 `refine`——判据：内容高度必须由「视口高 − header reserve − padding」计算，且随 header 变化回算。
- **queryKey（路由深链）：默认不传=不同步。** 仅当激活 tab 需要可被 URL 深链 / 刷新 / 前进后退恢复（分享链接 / 回到原 tab）才传 `queryKey`；此时 active 初值留空由 query 恢复（防 replace 竞速覆盖深链）；无 vue-router 环境静默失效。
- **channel / parentChannel（嵌套链）：默认不用。** 仅当 tab 内容里还有更深的页签链、需要逐级扣高（L1 页签内容再嵌 L2 页签，且 L2 需撑满 L1 剩余高度）才配；⚠️ 每级 [MUST] 显式 `refine`、每级 TabsMain [MUST] 是父 tab 内容**直接根**、channel 名 [MUST NOT] 响应式变更——缺任一链路静默失效。
- **tile（平铺模式）：默认关（tab-bar 页签形态）。** 仅当所有 item 需铺成卡片列 + 角落 nav + scrollspy（长文档式阅读、内容即卡片）才开 `tile`；`navPosition` / `navMode` / `navOffset` 仅在 tile 下有意义。
- **variant：默认按 level 推导（1-4 级依次 card / indicator / indicator-compact / plain）即够用**，仅特殊视觉需求显式覆盖。
- **完整能力演示**（基础 + queryKey + 嵌套链 + 平铺各态）：`apps/reference/src/pages/nav/tabs/showcase/`、`pages/nav/tabs/nested-channel/`、`pages/nav/tabs/tile/`——能力展示，非推荐默认。

## 上下文默认值（直系父上下文）

置于特定父容器槽位时，`TabsMain` 的 `refine` 自动获得上下文默认值（`useContextDefaults` 解析直系父 DOM 的 `data-dc-slot`），消费方零传参；显式传 `refine` 仍优先。

| 场景                | prop     | 自动默认                            |
| ------------------- | -------- | ----------------------------------- |
| AppPage `#default`  | `refine` | `true`（精细流）                    |
| 其他容器 / 独立使用 | `refine` | 不处理（undefined ≡ false，自然流） |

> ⚠️ 需上下文动态默认的 prop 不写 `withDefaults` 默认（详见 spec：`docs/specs/2026-08-14-080509-moderate-usecontextdefaults直系父上下文默认/spec.md`）。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name                 | type                                              | 默认             | 语义                                                                                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tabs`               | `TabsMainItem[]`（必填）                          | —                | tab 配置列表（`{ key, title, component?, badgeKey? }`；`badgeKey` 见下「tab 标题徽标」）                                                                                                                                                                                   |
| `viewportHeight`     | `number?`                                         | —                | 显式视口高度，优先级最高；未传降级 inject SCOPE_VIEWPORT_MAX_HEIGHT scope 链                                                                                                                                                                                               |
| `minHeight`          | `number?`                                         | `100`            | 内容区高度兜底下限                                                                                                                                                                                                                                                         |
| `channel`            | `string?`                                         | —                | 作为父时的 scope 标识。⚠️ 与 parentChannel 均 [MUST NOT] 响应式变更（setup 期快照）；且仅 refine=true 路径生效                                                                                                                                                             |
| `parentChannel`      | `string?`                                         | —                | 作为子时定向消费的祖先 scope 标识（沿对象链 parent 找匹配）                                                                                                                                                                                                                |
| `padding`            | `TabsMainPadding`（= [top,right,bottom,left] px） | `[10,10,0,10]`   | 默认插槽容器内置 padding（withDefaults 实证）；top+bottom 同步从 slot scope / channel viewportHeight 扣减                                                                                                                                                                  |
| `refine`             | `boolean?`                                        | 上下文默认       | false=自然流（TabsNaturalFlow，不包 HeightProvider，scope viewportHeight 为 undefined）；true=精细流（TabsRefineFlow，HeightProvider 精确扣 header reserve + padding）。默认由 `useContextDefaults` 按直系父解析：AppPage `#default` 内 `true`，否则 `false`；显式传值优先 |
| `refineReduceHeight` | `number?`                                         | `0`              | 从 viewportHeightFinal 预扣的高度（refine=false 时同样生效）                                                                                                                                                                                                               |
| `variant`            | `TabsHeaderVariant?`                              | 按 level 推导    | "card"\|"indicator"\|"indicator-compact"\|"plain"；level 1-4 默认依次 card/indicator/indicator-compact/plain。字号始终跟 level（inject TABS_MAIN_VISUAL_LEVEL +1 每层）                                                                                                    |
| `queryKey`           | `string?`                                         | 不传=不同步      | 激活 tab ↔ 路由 query 双向同步的 key：切 tab → router.replace `?{queryKey}={key}`（不压栈）；激活/刷新/前进后退读 query 反向恢复；无 vue-router 环境静默失效                                                                                                              |
| `tile`               | `boolean?`                                        | `false`          | 平铺模式：所有 item 铺成卡片列（各裹 ElCard）、隐藏 tab-bar、角落 nav 导航 + scrollspy 反写激活                                                                                                                                                                            |
| `navPosition`        | `TabsMainTileNavPosition?`                        | `"bottom-right"` | 平铺角落 nav 落角（四角）                                                                                                                                                                                                                                                  |
| `navMode`            | `TabsMainTileNavMode?`                            | `"auto"`         | "auto"\|"absolute"\|"sticky"\|"fixed"；auto = refine→absolute / 自然流→sticky                                                                                                                                                                                              |
| `navOffset`          | `number?`                                         | `12`             | 平铺角落 nav 距角像素                                                                                                                                                                                                                                                      |

**v-model**：`v-model`（string，激活 tab key；非法值归一回写 tabs[0].key，tabs 空不回写）

### Emits

无显式 defineEmits（仅 model）

### Slots

| 槽              | scope                             | 语义                                                                                                                                         |
| --------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `#<key>`        | `{ tab, active, viewportHeight }` | 优先于 tab.component 回退；viewportHeight 精细流给可用高度、自然流 undefined（⚠️ tile 模式槽 scope 仅 `{ tab, active }`，无 viewportHeight） |
| `#header-<key>` | `{ tab, active }`                 | 覆盖页签头，优先于 tab.title                                                                                                                 |

### Expose

无

## 反模式 / 注意

- **channel / parentChannel 响应式变更**：[MUST NOT]——setup 期快照，后续变更无效
- **缺 refine 的 channel 链**：链路静默失效——每级 [MUST] 显式 refine
- **TabsMain 非父 tab 内容直接根**：[MUST NOT]——外层再包 div 会让高度链错位
- **槽内角标用 v-if**：会改标题宽度致下划线动画错位，用 opacity 切换
- **queryKey 深链初值**：active 初值留空由 query 恢复（防 replace 竞速覆盖深链）
- **tab.component 裸放响应式组件对象**：用 markRaw

## 关联

- 内部实现：`TabsNaturalFlow` / `TabsRefineFlow` / `TabsHeader` / `TabsTile` / `use-tabs-query-sync.ts`（均不导出）
- 高度链：`SCOPE_VIEWPORT_MAX_HEIGHT` scope 链（viewportHeight / parentChannel 消费侧）
- 范式页：`apps/reference/src/pages/nav/tabs/showcase/`、`pages/nav/tabs/nested-channel/`、`pages/nav/tabs/tile/`

## tab 标题徽标（`badgeKey`）

给 `TabsMainItem` 配 `badgeKey`，命中 `bridge.badge` 注册表且未过期时，在 tab 标题右侧挂绝对定位角标（不改变 tab 尺寸）——**三处同步**：tab-bar 标题、平铺（tile）卡片标题、平铺角落 nav。未配 / 未命中 → DOM 与不接入时逐字节一致。

```ts
const tabs = [
  { key: "detail", title: "详情" },
  { key: "export", title: "导出", badgeKey: "order.export" },
];
// app 侧
bridge.badge.set("order.export", { kind: "beta" });
```

**[MUST NOT] 拿 `item.key` 当徽标键。** `key` 是**局部唯一**的（v-model 值 + 槽名），两个页面都可能有 `key: "detail"`，复用它会跨页串标。徽标键需全局唯一，故显式另给（同 `ActionBtn.badgeKey` 范式）。

**徽标包在标题 slot 外**——消费方自定义 `#{key}` / `#header-{key}` 标题槽时，角标依然在（徽标标的是"这个 tab 有东西"，与标题怎么渲染无关）。

完整契约（六种标记类型 / `expireAt` 失效 / 已知限制）见 [bridge 文档 · 徽标注册表](../../../../bridge/docs/README.md)。

> 目录迁移：实现与配套收纳到 `components/nav/tabs-main`，包根 API 与演示能力保持。

## bridge 事件

`tab-change {key,index}`：运行期有效 key 变化（点击、程序 model、tile scrollspy、有效归一）后报告，index 取当前 tabs 顺序。首次初始化/query 恢复、相同 key、空列表不报；失活/卸载停止观察，恢复只以当前值建基线，不补报隐藏期变化。TabsHeader/TabsTile 不重复报告。

无订阅且 signal 镜像关闭时不求值载荷；事件不代替原业务回调。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-nav`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
