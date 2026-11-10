# ModalShelf（弹窗架子·层级治理）

> 弹窗架子：`level` 声明结构性身份（app/page/custom），沿 DOM 收集祖先并断言层级合法，为 ModalPorter 提供命令式注册表宿主。
> 范式页：`apps/reference/src/pages/feedback/modal/porter/showcase/`（三层自定义嵌套架子 + ModalPorter）、`apps/reference/src/pages/feedback/modal/guide/`（对接内置 page 架子）

## 定位

- **何时用**：应用出现「弹窗开弹窗」的层级诉求时，用架子显式声明弹层寄居层级——AppLayout/AppPage 已内置 app/page 两层，业务只在需要第三层以上或自定义作用域时手挂 `level="custom"` 架子
- **何时不用**：单层弹窗（无嵌套）不需要架子——直接用 ModalConfirm/ModalForm/ModalDetail；也不需要在 AppLayout/AppPage 内再挂 app/page 级架子（内置，业务 [MUST NOT] 自声明）
- 职责边界：架子只管「身份 + 层级合法性 + 实例注册表宿主」，**不渲染弹窗 UI**——弹窗由 ModalPorter 的 modalList 注册表经 `evoke` 命令式拉起，页面内容走默认插槽透传

## 快速上手（最小可用）

对接内置 page 架子——普通业务**零架子起步**，页面只放 Porter 注册表（`modal/guide/`）：

```vue
<AppPage>
  <!-- ...页面内容... -->
  <ModalPorter :modalList="modalList" />   <!-- modalList 项 shelf: "page" 即指本架子 -->
</AppPage>
```

**要点**：

- 内置挂载（业务 [MUST NOT] 自声明）：AppLayout.vue 内置 `level="app"`、AppPage.vue 内置 `level="page"`——单层/双层弹窗零架子
- 控制器：`evoke(nsKey, component, {payload, sameKeyStrategy?})` 拉起 / `remove(nsKey|string[])` 移除 / `close(item)` 关闭——经 `ShelfController` expose 暴露，ModalPorter 内部自动对接
- `level` 是**架子结构性身份**：挂载后不变（setup 期快照非响应式），传给控制器 / 注册表寻址用

## 能力边界 / 按需使用

- **默认即够用：内置 app/page 两层架子**——普通业务零架子起步；单层弹窗（无嵌套）连架子都不需要，直接用 ModalConfirm/ModalForm/ModalDetail。
- `level="custom"`：**仅当需要第三层以上或自定义作用域的弹窗层级时**才手挂（判据：app/page 两层装不下「弹窗开弹窗开弹窗」）。custom 可任意嵌套，业务一般一层够用。
- 业务 [MUST NOT] 在 AppLayout/AppPage 内再挂 app/page 级架子（内置，重复挂载是层级污染）；page 上禁挂 custom（非法挂法，开发期 console.error）。
- 层级合法性只在开发期校验：非法挂法只警告不崩，但生产仍会弹窗乱叠——守合法挂法是业务责任。
- **完整能力演示**（三层自定义嵌套架子 + Porter 触发按钮组）：`apps/reference/src/pages/feedback/modal/porter/showcase/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name             | type                                           | 默认   | 语义                                                                                                                                                                                                                                                                                      |
| ---------------- | ---------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `level`          | `ModalLevel = "app"\|"page"\|"custom"`（必传） | —      | 架子结构性身份，挂载后不变（setup 期快照非响应式）                                                                                                                                                                                                                                        |
| `v-model:remote` | `GlobalModalRemote`（可选）                    | 无默认 | 全局弹窗遥控器挂载面（**仅 app 级架子使用**）：架子把已注册的 app 级弹窗句柄（key → `{evoke, close, update}`）挂进该对象，`modalKey`（已注册 key 清单）同步维护；配置移除时同步移除对应 key 与清单项；AppLayout 内置 app 架子经它对接 `v-model:globalModalRemote`（page/custom 架子不传） |

### Slots

| 槽   | scope | 语义         |
| ---- | ----- | ------------ |
| 默认 | 无    | 页面内容透传 |

### Expose（`ShelfController`）

| 成员     | 签名                                                             | 语义                                                         |
| -------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `level`  | `ModalLevel`                                                     | 架子层级                                                     |
| `evoke`  | `(nsKey, component, {payload, sameKeyStrategy?}) => EvokeHandle` | 命令式拉起弹窗（nsKey 定位 / component 注册 / payload 注入） |
| `remove` | `(nsKey \| string[]) => void`                                    | 按 nsKey 移除一个/多个实例                                   |
| `close`  | `(item: ShelfItem) => void`                                      | 关闭指定活跃实例                                             |

> ⚠️ expose 实际另含 `items: Ref<ShelfItem[]>`（内部渲染用活跃实例列表；公开类型 `ShelfController` 不含——按公开类型使用）

> **expose 与 `v-model:remote` 分工**：expose 的 `ShelfController` = **架子管理面**（程序员直接操作架子：evoke/remove/close/items）；`v-model:remote` = **应用根遥控面**（App.vue 拿在手里按 key 遥控弹窗）——一个管架子、一个遥控弹窗，勿混。

## 机制

### level 层级与合法性断言

`provide(getModalShelfInjectionKey(level), controller)`；onMounted 沿 `["app","page","custom"]` 收集祖先并 `assertLevelHierarchy`：

- `app` 必最顶层
- `page` 上仅禁 `custom`（允许 page 套 page）
- `custom` 可任意嵌套

非法挂法仅开发期 `console.error`，不阻断运行。

### ModalShelfMap declare merge（全链类型化）

业务侧在 `.d.ts` 里对 `@done-coding/forge` 的 `ModalShelfMap` interface（内建图片/视频预览键） 做声明合并扩展，evoke 与弹窗 props 全链类型化（`apps/reference/src/types/standard-modal.d.ts`）：

```ts
declare module "@done-coding/forge" {
  interface ModalShelfMap {
    /** 范式 A 列表弹窗式 CRUD：DetailModal 作 modalList item 的 payload */
    standardListDetail: { type: DetailType; data: UserPO; onDone?: () => void };
    standardDetailSpace: { id: number; onDone?: () => void };
    standardTabListDetail: {
      type: DetailType;
      data: UserPO;
      subTitle: string;
      onDone?: () => void;
    };
  }
}
```

每个 key 的值类型 = 该弹窗的 payload 形状（注入给弹窗组件的 `payload` prop 全类型化）。

### 注入给弹窗的 props（`ModalInjectedProps<P>`）

架子把 `{show, closeFn, removeFn, payload: P}` 注入弹窗组件——弹窗组件声明接收，`show` 由架子受控、`closeFn`/`removeFn` 是命令式关闭出口、`payload` 为业务数据。

### 命令式句柄（`EvokeHandle`）

`evoke` 返回 `EvokeHandle`：`close()` 关闭、`update(partialPayload)` 增量合并更新 payload（不 remount）。

### remote 挂载（app 级全局遥控器）

`v-model:remote` 是 **app 级架子**的全局遥控器挂载面（page/custom 不传）：架子收到专用 ModalPorter（`globalOnly` Symbol 模式）推送的 app 级弹窗配置后，把 **key → `{evoke, close, update}`** 句柄挂进 remote 对象，并同步维护 **`modalKey: string[]`**（已注册 key 清单——调用方以 `modalKey.includes(key)` 显式判断「该 key 是否已注册」，`evoke` 无返回值，未注册直接调会 TypeError）；配置移除（Porter 卸载）时同步移除对应 key 与清单项。`evoke` 不带 key——key 即 remote 对象上的键；重复 evoke 的行为由配置期 `sameKeyStrategy` 决定。**close 是关键能力**：全局弹窗不能只靠用户点击关闭（可能无关闭按钮 / 需外部编排），外部（App.vue）经 remote 按 key 关闭。

**core 预置全局 key**：core 定义全局预览弹窗 key 常量 `APP_GLOBAL_IMAGE_PREVIEW_KEY` / `APP_GLOBAL_VIDEO_PREVIEW_KEY`（值即 remote 键与 `modalKey` 条目）——AppLayout `enableGlobalImagePreview` / `enableGlobalVideoPreview` 开启后以 `ModalImagePreview` / `ModalVideoPreview` 组件注册进 app 架子（拼接进 `globalModalConfig`），触发组件 `ImagePreviewTrigger` / `VideoPreviewTrigger` 经遥控器按此 key 唤起。

## 反模式 / 注意

- **业务 [MUST NOT] 自声明 app/page 架子**：AppLayout/AppPage 已内置，重复挂载是层级污染
- **`level` 快照非响应式**：挂载后改 level 不生效——架子身份在挂载时刻定死，需要不同层级另起架子
- **架子不渲染弹窗 UI**：只是宿主，弹窗实例由 ModalPorter evoke 拉起——别在架子插槽里手写 `<ModalConfirm>` 混编（破坏注册表寻址）
- **`sameKeyStrategy` 语义别与 EvokeHandle.update 混淆**：`"recreate"`（同 key 再 evoke 关旧重建，默认）vs `"update"`（已开则整体替换 props 不 remount）；而 `EvokeHandle.update` 是**增量合并**（partialPayload）——三条路径语义各不相同
- **page 上禁挂 custom**：page 架子内嵌 custom 架子属非法挂法（开发期报错）；要三层以上请自建 custom 链
- **层级合法性只在开发期校验**：生产不报错，但挂法错误导致的弹窗乱叠仍会存在——守合法挂法是业务责任

## 关联

- 注册表入口：`ModalPorter`（modalList 注册表，内部自动对接 app/page 控制器并缓存）
- 层级机制：`modal-shelf-hierarchy.ts`（assertLevelHierarchy 合法挂法断言）、`modal-shelf-core.ts`（实例注册表）、`modal-shelf-types.ts`（ModalLevel / ModalSameKeyStrategy / ShelfController / ShelfItem / ShelfInstance / EvokeHandle / RegisterEntry）
- 内置挂载点：`AppLayout.vue`（level="app"）、`AppPage.vue`（level="page"）
- 弹窗组件族：`ModalConfirm` / `ModalForm` / `ModalDetail`（可作架子注入的弹窗组件）；预览族 `ModalImagePreview` / `ModalVideoPreview` + 触发端 `ImagePreviewTrigger` / `VideoPreviewTrigger`（全局 key 常量 `APP_GLOBAL_*_PREVIEW_KEY` 预置，AppLayout 开关开启即注册）
- 范式页：`apps/reference/src/pages/feedback/modal/porter/showcase/`、`apps/reference/src/pages/feedback/modal/guide/`、`apps/reference/src/pages/feedback/modal/preview/showcase/`

## 内部契约整理（30mf7k 第一批）

`ModalShelfMap` 定义归底座，原入口透明转出同一接口；对 `@done-coding/forge` 增广，旧入口增广目标须随应用入口迁移。预置图片/视频 key 字面量与各 level 的 Symbol.for 字符串不变。

> 目录迁移：实现与配套收纳到 `components/feedback/modal-shelf`，包根 API 与演示能力保持。

## bridge 事件

`modal-open` / `modal-update` / `modal-close` 载荷均为 `{nsKey,key}`。新建/关闭中复活 open；可见实例 update 策略再次 evoke、句柄 update 与全局 remote update 均 update；真实 close/remove 才 close，重复 close、不存在实例的 update 静默。recreate 为旧实例 close → 新实例 open。key 只去掉 Porter 的 `p数字:` 前缀；remote 注册业务 key 原样保留。关闭中的句柄 update 仍更新载荷并发 update，但不会自动复活。子组件 mounted 的真实唤起也覆盖。内部纯工厂通过第三参 options 接可选 reporter，不依赖 inject；Shelf 失活/卸载停止采集并清理关闭计时器，重新激活不补报。

无订阅且 signal 镜像关闭时不求值载荷；事件不代替原业务回调。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-feedback`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
