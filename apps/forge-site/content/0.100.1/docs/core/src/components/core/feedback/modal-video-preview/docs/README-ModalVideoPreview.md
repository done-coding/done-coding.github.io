# ModalVideoPreview（视频预览弹窗·lightbox 形态）

> 视频预览原语：**ElDialog 直配黑底 lightbox**（业界 Video Lightbox 模式）+ 原生 `<video controls>` + 弹窗配置化契约。
> 注册 key 建议 `modalVideoPreview`（ModalShelf/Porter 注册项）；全局预置 key = `APP_GLOBAL_VIDEO_PREVIEW_KEY`。
> 范式页：`apps/reference/src/pages/feedback/modal/preview/showcase/`

## 定位

- **何时用**：任意「弹窗 + 视频播放」场景——上传文件预览、附件查看、素材核对；命令式 / 配置化唤起（全局遥控器 `evoke`、ModalPorter 注册）
- **何时不用**：操作确认用 `ModalConfirm`；图片预览用 `ModalImagePreview`（ElImageViewer 薄适配）；需要播放器增强（倍速/字幕/流媒体协议）时——`<video>` 原生能力不足，接第三方播放器（Plyr / video.js），本组件不内置
- **形态依据（业界）**：视频预览弹窗主流 = **Video Lightbox**——黑底沉浸遮罩 + 视频居中播放 + 遮罩/ESC/关闭按钮三通道关闭 + 打开即播、关闭暂停（图片 lightbox 的视频镜像）；组件库无通用视频 lightbox 组件，用 EP 弹层基座（ElDialog）配置出该形态是成本最低路径（**滚动锁 / ESC / 焦点管理 / 遮罩关闭 EP 内置白拿**，只覆盖样式层）
- **底座 = ElDialog 直配**（[MUST NOT] 用 `ModalConfirm`——确认/表单弹窗体系（白底 + title + footer 按钮）与沉浸预览形态错配，已废弃）：遮罩深色压暗 + dialog 无卡片背景 + 无 header/footer + 居中 16:9 视频（`dc-modal-video-preview` 非 scoped 锚，照 ModalConfirm 先例）
- **全宽弹窗 + 视频有界**：弹窗 `width: 100vw`（+ `align-center` 清 EP 默认 margin-top，dialog 恰为全屏——定位/滚动锁/ESC/焦点全归 ElDialog，不自造 fixed 定位）；body 内 `__stage`（`height: 100vh` 沉浸黑底 flex 居中）> `__shim`（**`width: min(960px, 100%)`** + 16:9）> video——视频固定 960px 宽（16:9 → 540 高）居中、四周黑边，小屏 `max-width: 100%` 收缩，**不直接撑满全屏容器**；关闭按钮 44px 圆灰底白叉 `top/right: 40px`（dialog 全宽后相对定位即视口角位，与 el-image-viewer 同位同款）
- **封面兜底**：`coverUrl` 传则作为 `poster` 封面；**不传则 src 自动追加 `#t=0.01`**（Media Fragments URI）——浏览器加载时定位到 0.01s 渲染出视频首帧当封面，配合 `preload="metadata"` 只拉元数据不拉全片
- `inheritAttrs: false` + 全量 `$attrs` 定向透传 **`<video>`**：未声明原生属性（`autoplay` / `muted` / `loop` / `playsinline` 等）直达 video 元素
- **注册形态（ModalShelf/Porter）**：架子渲染只传 `show`/`payload`/`closeFn`/`removeFn`——业务值走 payload，双输入源：`url`/`coverUrl` = `props.url ?? payload.url` / `props.coverUrl ?? payload.coverUrl`
- **全局预置**：core 预置 `APP_GLOBAL_VIDEO_PREVIEW_KEY`——AppLayout `enableGlobalVideoPreview` 开启后自动注册进全局弹窗（见 README-AppLayout）；触发端 `VideoPreviewTrigger` 经遥控器按此 key 唤起

## 快速上手（最小可用）

```vue
<ModalVideoPreview v-model:show="show" url="https://example.com/a.mp4" />
```

**要点**：

- `show` 必传（`v-model:show`）；`url` 必传（视频地址）
- 不传 `coverUrl` 也能出画面——`#t=0.01` 首帧兜底，无需单独准备封面图
- 打开即黑底沉浸播放（业界 lightbox：遮罩压暗、视频是唯一焦点）；关闭走 ESC / 遮罩 / 关闭按钮
- 打开自动播放（`autoPlay` 默认开，业界行为；关闭即暂停）——`autoPlay=false` 关闭

## 能力边界 / 按需使用

- **默认即够用：黑底 lightbox + controls 播放条 + 打开即播**——绝大多数预览只传 `show`/`url`。
- `coverUrl`：仅当需要自定义封面（非首帧）时传；业务侧「上传带封面」场景传此值可省 `#t=0.01` 的一次 seek。
- `autoPlay`：默认开（打开弹窗即播）；仅当需要「打开先看封面、手动点播」时关。
- 第三方播放器增强（倍速/字幕/流媒体）：`<video>` 原生不足的场景不塞进本组件——消费方自拼（ElDialog 黑底 + 第三方播放器）。
- **完整能力演示**：`apps/reference/src/pages/feedback/modal/preview/showcase/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（内联 defineProps，无 types.ts）

| name                   | type                                  | 默认   | 语义                                                                                            |
| ---------------------- | ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `show`                 | `boolean`（必传）                     | —      | 可见性（v-model:show）                                                                          |
| `url`                  | `string`（必传）                      | —      | 视频地址（`<video src>`）                                                                       |
| `coverUrl`             | `string`                              | —      | 封面图地址（`<video poster>`）；**空 → src 自动追加 `#t=0.01` + `preload="metadata"` 首帧兜底** |
| `autoPlay`             | `boolean`                             | `true` | 打开弹窗即自动播放（业界 lightbox 行为）；关闭即暂停                                            |
| `payload`              | `{ url?: string; coverUrl?: string }` | —      | 注册形态注入（架子渲染只传 payload；原语用法无需传）                                            |
| `closeFn` / `removeFn` | `() => void`                          | —      | 注册形态注入的关闭/移除出口（声明避免泄漏进 `$attrs`）                                          |
| `onClose`              | `(status?: boolean) => void`          | —      | 关闭回调（ElDialog @close 触发）                                                                |

> **video 原生属性全量透传**：除 `url` 外未声明属性（`autoplay` / `muted` / `loop` / `playsinline` / `preload` 等）经 `$attrs` 直达 `<video>`。**`controls` 内部固定 `true`**（预览必须可控制播放），外部不可关。

### Emits

| 事件          | 载荷      | 语义                  |
| ------------- | --------- | --------------------- |
| `update:show` | `boolean` | 可见性同步（v-model） |

### Slots

无（lightbox 沉浸形态无标题/操作区语义——需要「弹窗 + 视频 + 操作按钮」的形态用 `ModalConfirm` + `<video>` 消费方自拼）

### Expose

无

## 反模式 / 注意

- **[MUST NOT] 用 `ModalConfirm` 底座**：白底确认/表单弹窗体系与沉浸预览形态错配（已废弃）——本组件 = ElDialog 直配黑底 lightbox + 契约
- **无标题 / 无 footer 语义**：lightbox 不配 title/footer/确认取消——需要操作按钮的形态消费方自拼
- **封面兜底的 `#t=0.01` 只处理「无封面」**：传了 `coverUrl` 就 [MUST NOT] 再追加（追加会覆盖 poster 显示）
- **`$attrs` 只落 `<video>`**：弹层级 attrs（`draggable` / `destroy-on-close`）[MUST NOT] 混进 `$attrs` 直传——需弹层级能力显式扩展 props
- **`controls` 不可关**：预览无操作语义但播放控制是基本人权，外部传 `controls=false` 无效（内部固定）
- **播放器增强不塞本组件**：倍速/字幕/流媒体等原生不足能力——消费方自拼，本组件保持「ElDialog lightbox + 原生 video」薄壳

## 关联

- 弹层族：`ModalConfirm`（确认/表单弹窗体系——视频预览不再用它做底座）、`ModalForm`、`ModalDetail`
- 预览族：`ModalImagePreview`（图片预览，同为 lightbox 形态；ElImageViewer 薄适配）
- 触发端：`VideoPreviewTrigger`（封面/占位 + 播放图标两形态统一，点击经全局遥控/自带弹窗唤起本组件）
- 命令式弹窗体系：`ModalShelf`（架子 + level 层级）+ `ModalPorter`（modalList 注册表）+ 全局遥控器（`globalModalRemote.evoke(APP_GLOBAL_VIDEO_PREVIEW_KEY, { url, coverUrl })`）
- 范式页：`apps/reference/src/pages/feedback/modal/preview/showcase/`

> 目录迁移：本组件及配套归入 `components/feedback/modal-video-preview`；仅源码位置变化，包根导入、props、slots 与实例契约保持。
