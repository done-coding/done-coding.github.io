# ImagePreviewTrigger（图片预览触发组件）

> 图片触发原语：`ElImage` 落地（img 原生属性对齐）+ 懒加载 + 加载中/失败占位兜底；**点击直接走 ElImage 自带预览（el-image-viewer 放大）**——点图即放大，一层到位，不经弹窗。
> 与 `VideoPreviewTrigger` 对等成对（视频触发端仍需弹窗；图片预览终点是 el 原生查看器）。
> 范式页：`apps/reference/src/pages/feedback/modal/preview/showcase/`

## 定位

- **何时用**：任意「缩略图可点开看大图」场景——上传文件列表、附件卡片、图片墙
- **何时不用**：仅展示不点击 → 直接用 `ElImage`；命令式开图（按钮/编排，不经过点击）→ `ModalImagePreview` + 全局遥控器 evoke
- 关键机制：落地 **`ElImage`**（非裸 `<img>`）——原生 img 属性照常 `$attrs` 透传对齐，同时白拿组件库三件套：**`lazy`（默认开）** + **`#placeholder`（加载中占位）** + **`#error`（加载失败兜底图）** + **`preview-src-list`（点击放大）**
- **点击直达（零弹窗）**：`preview` 开启时内部给 ElImage 绑定 `preview-src-list`（= `[previewSrc ?? src]`）+ `preview-teleported`——点击图片即打开 **el-image-viewer 全屏放大**（缩放/旋转/切换/ESC/遮罩关闭全原生）——**一层到位**
- **命令式与点击两入口各司其职**：点击 → ElImage 原生预览（本组件）；命令式 → `ModalImagePreview`（ElImageViewer 薄适配，全局遥控器 evoke）——触发组件 [MUST NOT] 再走弹窗（两层预览嵌套已废弃）

## 快速上手（最小可用）

```vue
<ImagePreviewTrigger src="https://example.com/thumb.png" />
```

**要点**：

- `src` 必传（缩略图路径）；零配置即带原生懒加载 + 占位兜底 + **点击放大**
- 大图与原图分离：`previewSrc` 传原图（点击放大打开的大图），**缺省降级为 `src`**（缩略图即原图时零配置）
- 点击后：el-image-viewer 全屏放大（ep 原生）——无环境依赖、无决策链、无弹窗

## 能力边界 / 按需使用

- **默认即够用：缩略图 + 懒加载 + 点击放大**——绝大多数场景只传 `src`。
- `previewSrc`：仅当缩略图/原图分离（如压缩图列表）时传；缺省 = `src`。
- `#placeholder` / `#error` 插槽：仅当需要自定义加载中/失败兜底图（小图 / base64）时传；缺省 EP 默认观感（灰底加载中 + 失败图标）。
- `lazy={false}`：仅当图片必须立即加载（首屏无滚动场景）时关。
- `preview={false}`：关闭点击放大（纯展示缩略图）——仍保留懒加载 + 占位兜底。
- **点击不冒泡（仅 `preview` 开启时）**：打开放大的同时 `stopPropagation`——缩略图常嵌在表格行 / 卡片里，点图看大图 [MUST NOT] 连带触发行点击 / 卡片跳转。`preview={false}`（纯展示）**不拦**，事件照常上抛给外层（此时组件不做任何事，吞事件反而会让外层行点击失效）。
- **完整能力演示**：`apps/reference/src/pages/feedback/modal/preview/showcase/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（内联 defineProps，无 types.ts）

| name         | type             | 默认   | 语义                                                                |
| ------------ | ---------------- | ------ | ------------------------------------------------------------------- |
| `src`        | `string`（必传） | —      | 缩略图路径（ElImage.src）                                           |
| `previewSrc` | `string`         | —      | 原图路径（点击放大打开的大图）；**缺省降级为 `src`**                |
| `lazy`       | `boolean`        | `true` | 图片懒加载（ElImage.lazy，原生 loading 优先）                       |
| `preview`    | `boolean`        | `true` | 是否可点击放大（内部绑定 `preview-src-list`；false = 纯展示缩略图） |

> **ElImage / img 原生属性全量透传**：`$attrs` 直达自身 ElImage——`alt` / `fit` / `loading` / `draggable` / `scroll-container` 等原生属性与 EP 图片属性均可用。
> ⚠ **`width` / `height` 无效**：EP 2.13 的 ElImage 未声明 width/height props，透传会落根 div 的 HTML attribute（对 div 无渲染效果）。尺寸控制请用外层 CSS / `style`（配合 `fit="cover"` 居中裁切）。

### Emits

无

### Slots

| 槽             | scope | 语义                                                                                         |
| -------------- | ----- | -------------------------------------------------------------------------------------------- |
| `#placeholder` | 无    | 加载中占位（透传 ElImage；缺省 EP 灰底观感）                                                 |
| `#error`       | 无    | 加载失败兜底图（透传 ElImage；缺省 EP 失败图标）——**插槽非属性**，传兜底图走插槽内放 `<img>` |

### Expose

无

## 反模式 / 注意

- **[MUST NOT] 点击走弹窗**：图片预览终点 = el-image-viewer（ElImage 原生）——弹窗 → 弹窗内再点放大 = 两层嵌套（脱裤子放屁，已废弃）；命令式开图走 `ModalImagePreview`，与点击路径分离
- **`previewSrc` 才是预览路径**：`src` 是展示路径——缩略图/原图分离时别把大图塞 `src`（懒加载白拉全尺寸图）
- **`#error` 是插槽不是属性**：传字符串路径是 EP 常见误区（加载失败显示空白）——兜底图放插槽内 `<img :src>`（或 base64）
- **`preview=false` 只关放大**：仍渲染缩略图 + 懒加载 + 占位兜底——「图片展示」能力不随「预览」关掉
- **[MUST NOT] 外层再包 `@click.stop` 兜底**：`preview` 开启时组件内部已阻止冒泡；外层再包会把**纯展示态**（`preview=false`）的点击一并吞掉，外层行点击 / 卡片跳转随之失效

## 关联

- 命令式弹窗端：`ModalImagePreview`（ElImageViewer 薄适配 + 弹窗配置化契约；全局遥控器 `evoke(APP_GLOBAL_IMAGE_PREVIEW_KEY, { src })`）
- 对等组件：`VideoPreviewTrigger`（视频触发端；封面/占位 + 播放图标两形态统一，仍需弹窗——视频无 el 原生预览）
- 命令式弹窗体系：`ModalShelf`（架子 + level 层级）+ `ModalPorter`（modalList 注册表）+ 全局遥控器（`globalModalRemote`）
- 范式页：`apps/reference/src/pages/feedback/modal/preview/showcase/`

> 目录迁移：本组件及配套归入 `components/data/image-preview-trigger`；仅源码位置变化，包根导入、props、slots 与实例契约保持。
