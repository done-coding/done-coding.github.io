# ModalImagePreview（图片预览弹窗·命令式入口）

> 图片预览原语：**ElImageViewer 薄层适配**（el 图片预览组件本体 = 全屏 lightbox）+ **弹窗配置化契约包装**（`v-model:show` / 注册形态注入 / 双输入源）。
> 注册 key 建议 `modalImagePreview`（ModalShelf/Porter 注册项）；全局预置 key = `APP_GLOBAL_IMAGE_PREVIEW_KEY`。
> 范式页：`apps/reference/src/pages/feedback/modal/preview/showcase/`

## 定位

- **何时用**：**命令式 / 配置化唤起图片预览**——业务按钮、编排逻辑、全局遥控器 `evoke` 开图（el 图片预览无命令式 API，本组件是唯一桥梁）
- **何时不用**：**点击图片看大图 → 直接用 `ElImage` 的 `preview-src-list`**（el 原生放大查看器，零开发）；触发组件 `ImagePreviewTrigger` 点击即直达 ElImage 预览，**不经本组件**——本组件只服务「不经过点击」的命令式入口
- **为什么是薄适配**：el 图片预览组件（`ElImageViewer`）本身就是全屏 lightbox 弹层（遮罩 + 缩放旋转 + ESC/遮罩关闭）——**直接以它为底座**，只补一层弹窗配置化契约；[MUST NOT] 再包 `ModalConfirm`（两层嵌套：弹窗内再点才放大——脱裤子放屁，已废弃）
- 关键机制：`defineModel("show")` → 内部映射 ElImageViewer `v-model:visible`；关闭（ESC / 遮罩 / 关闭按钮）→ `update:visible` → 映射 `update:show` → 架子 `@update:show` 收尾关闭
- **注册形态（ModalShelf/Porter）**：架子渲染只传 `show`/`payload`/`closeFn`/`removeFn`——业务值走 payload，双输入源：`src` = `props.src ?? payload.src`（原语用法 prop 直传、注册用法 payload 承载）
- **全局预置**：core 预置 `APP_GLOBAL_IMAGE_PREVIEW_KEY`——AppLayout `enableGlobalImagePreview` 开启后自动注册进全局弹窗（见 README-AppLayout）；命令式 `globalModalRemote.evoke(APP_GLOBAL_IMAGE_PREVIEW_KEY, { src })` 即开图

## 快速上手（最小可用）

```vue
<ModalImagePreview v-model:show="show" src="https://example.com/a.png" />
```

**要点**：

- `show` 必传（`v-model:show`）；`src` 必传（图片地址）
- 打开即全屏 lightbox（el 原生：缩放 / 旋转 / 左右切换 / ESC / 遮罩关闭）
- 命令式：`globalModalRemote.evoke(APP_GLOBAL_IMAGE_PREVIEW_KEY, { src })`

## 能力边界 / 按需使用

- **默认即够用：`show` + `src` = 全屏图片预览**——绝大多数命令式场景只传这两项。
- `url-list` / `initial-index`：多图切换（`$attrs` 透传 ElImageViewer）。
- `hide-on-click-modal` / `close-on-press-escape` / `show-close`：关闭通道控制（透传 ElImageViewer）。
- 点图放大的「点击路径」不归本组件：`ImagePreviewTrigger` / 任意 `ElImage` 的 `preview-src-list` 直达。
- **完整能力演示**：`apps/reference/src/pages/feedback/modal/preview/showcase/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（内联 defineProps，无 types.ts）

| name                   | type                         | 默认 | 语义                                                   |
| ---------------------- | ---------------------------- | ---- | ------------------------------------------------------ |
| `show`                 | `boolean`（必传）            | —    | 可见性（v-model:show → ElImageViewer visible）         |
| `src`                  | `string`（必传）             | —    | 图片地址（双输入源 `props.src ?? payload.src`）        |
| `payload`              | `{ src?: string }`           | —    | 注册形态注入（架子渲染只传 payload；原语用法无需传）   |
| `closeFn` / `removeFn` | `() => void`                 | —    | 注册形态注入的关闭/移除出口（声明避免泄漏进 `$attrs`） |
| `onClose`              | `(status?: boolean) => void` | —    | 关闭回调（ElImageViewer @close 触发）                  |

> **ElImageViewer 属性全量透传**：`$attrs` 直达——`url-list` / `initial-index` / `hide-on-click-modal` / `close-on-press-escape` / `show-close` / `teleported` / `z-index` 等均可用。

### Emits

| 事件          | 载荷      | 语义                                                              |
| ------------- | --------- | ----------------------------------------------------------------- |
| `update:show` | `boolean` | 可见性同步（v-model；ElImageViewer 关闭 → `update:visible` 映射） |

### Slots

无（ElImageViewer 为全屏查看器，无内容插槽语义）

### Expose

无

## 反模式 / 注意

- **[MUST NOT] 包 `ModalConfirm` 底座**：两层预览嵌套已废弃（弹窗内再点放大 = 脱裤子放屁）——本组件 = ElImageViewer + 契约，薄层不叠加
- **点击路径不走本组件**：点图看大图用 `ElImage` `preview-src-list` / `ImagePreviewTrigger` 直达——本组件只服务命令式入口，两路径各司其职
- **无标题 / 无按钮语义**：lightbox 沉浸形态不配 title/footer/确认取消——需要「弹窗 + 图片 + 操作按钮」的形态用 `ModalConfirm` + `ElImage` 消费方自拼
- **关闭映射链**：ElImageViewer 关闭 → `update:visible` → `update:show` → 架子收尾——[MUST NOT] 另接关闭逻辑造成双通道

## 关联

- 弹层族：`ModalConfirm`（确认/表单弹窗体系——图片预览不再用它做底座）、`ModalForm`、`ModalDetail`
- 预览族：`ModalVideoPreview`（视频预览，同为 lightbox 形态；视频无 el 原生组件，ElDialog 直配黑底）
- 触发端：`ImagePreviewTrigger`（ElImage + 懒加载 + 占位兜底，**点击直达 ElImage 原生预览**，不经本组件）
- 命令式弹窗体系：`ModalShelf`（架子 + level 层级）+ `ModalPorter`（modalList 注册表）+ 全局遥控器（`globalModalRemote.evoke(APP_GLOBAL_IMAGE_PREVIEW_KEY, { src })`）
- 范式页：`apps/reference/src/pages/feedback/modal/preview/showcase/`

> 目录迁移：本组件及配套归入 `components/data/modal-image-preview`；仅源码位置变化，包根导入、props、slots 与实例契约保持。
