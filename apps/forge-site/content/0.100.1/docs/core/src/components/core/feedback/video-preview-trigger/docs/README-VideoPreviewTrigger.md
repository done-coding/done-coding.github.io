# VideoPreviewTrigger（视频预览触发组件）

> 视频触发原语：封面**三形态**——封面图（`ElImage` 吃原生懒加载）/ 首帧封面（`frameCover` 默认开，无封面用 `video#t=0.01` 抠首帧）/ 深色占位（`frameCover` 关，零请求）——**三形态统一叠加播放图标**（标识可播放）；**默认插槽可整体自定义**（吐 `open` fn 复用唤起逻辑）；点击经全局遥控器唤起 `ModalVideoPreview`，无全局则自带弹窗兜底。
> 与 `ImagePreviewTrigger` 对等成对（图片触发端点击直达 ElImage 原生预览；视频无 el 原生预览，仍需弹窗决策链）。
> 范式页：`apps/reference/src/pages/feedback/modal/preview/showcase/`

## 定位

- **何时用**：任意「视频卡片/缩略图可点开播放」场景——上传文件列表、视频素材库；与 `ModalVideoPreview` 成对（触发端 + 播放端）
- **何时不用**：页面内直接播放 → 用 `<video>` 原生/第三方播放器；仅展示封面不点击 → `ElImage`
- 关键机制：**核心 = 唤起预览弹窗的逻辑（决策链 + 自带弹窗兜底）内置**；**默认插槽 = 封面按来源分流 + 播放图标统一**，并吐 `open` 供自定义内容复用——
  - **有 `coverUrl`** → 落地 **`ElImage`**（`src=coverUrl`）→ **原生 `loading="lazy"` 直接可用** + `#placeholder`/`#error` 占位兜底，**封面图上叠加播放图标**（有播放按钮就知道是啥——三形态统一标识可播放）；
  - **无 `coverUrl` · `frameCover` 开（默认）** → 落地 **`<video :src="url#t=0.01" preload="metadata">`**——Media Fragments 定位 0.01s 渲染**首帧当封面** + 播放图标叠加；`preload="metadata"` 只拉元数据 + 首帧所在分片（**不拉全片**）；
  - **无 `coverUrl` · `frameCover` 关** → **深色占位底 + 播放图标**——零请求零副作用（无需封面的素材库 / 纯占位场景）
- **默认插槽可整体自定义**：`#default="{ open }"` 接自定义内容（如按钮「播放」）——`open` = 唤起预览的 fn（内部决策链 + 自带弹窗兜底不变），组件不关心自定义内容形态；缺省用内置封面/占位 + 播放图标
- **点击决策链（全局优先，自带兜底）**：
  ```
  if (remote?.value?.modalKey?.includes(APP_GLOBAL_VIDEO_PREVIEW_KEY)) {
    remote.value[APP_GLOBAL_VIDEO_PREVIEW_KEY].evoke({ url, coverUrl });  // 全局遥控唤起
  } else {
    localShow = true;                                                     // 自带 ModalVideoPreview 兜底（v-if）
  }
  ```
  `remote` = `inject(GLOBAL_MODAL_REMOTE_KEY)`（core 导出注入 key，消费方 App 根 provide 同一对象；未注入/未注册 → 静默回退自带弹窗，任何环境可用）
- **`modalKey` 存在性判断**：遥控器对象上的 `modalKey: string[]`（架子 `registerConfig` 同步维护）——`includes(全局 key)` 显式判断，不依赖 `evoke` 返回值（evoke 无返回值，未注册直接调会 TypeError）

## 快速上手（最小可用）

```vue
<VideoPreviewTrigger url="https://example.com/a.mp4" />
```

**要点**：

- `url` 必传（视频地址）；无封面默认走 **`frameCover` 首帧封面**（`#t=0.01` + `preload="metadata"`——只拉元数据 + 首帧，不拉全片）
- 有封面：`coverUrl` 传封面图 → 缩略图吃原生懒加载
- 不想要首帧请求：`:frame-cover="false"` → 回退深色占位（**零请求**，连 metadata 都不拉）
- 点击后：AppLayout 开了 `enableGlobalVideoPreview`（全局 key 已注册）→ 全局遥控唤起；否则组件自带 `ModalVideoPreview` 本地弹窗

## 能力边界 / 按需使用

- **默认即够用：封面/占位 + 播放图标 + 点击弹播放**——绝大多数场景只传 `url`。
- `coverUrl`：仅当业务有封面图（如上传时单独传了封面）时传——有封面走 img 路径白拿懒加载 + 图标叠加。
- `frameCover`（默认 `true`）：无 `coverUrl` 时是否用 `video#t=0.01` 抠首帧作封面——开 = 首帧封面（视觉接近封面图，代价是**每实例一个 metadata 小请求**，`video` 无原生 lazy）；关 = 深色占位（**零请求**）。视频素材库大列表介意请求量 → 关掉或按需补懒加载（YAGNI，暂未内置）。
- **`#default="{ open }"`**：整体自定义触发 UI（按钮 / 卡片 / 列表行）——`open` 即「打开预览弹窗」，核心决策链与兜底不变；`placeholder` / `error` 插槽仅内置封面内容使用。
- **点击不冒泡（仅 `preview` 开启时）**：唤起预览的同时 `stopPropagation`——封面常嵌在表格行 / 卡片里，点封面看视频 [MUST NOT] 连带触发行点击 / 卡片跳转。`preview={false}`（纯展示）**不拦**，事件照常上抛。
  **自定义默认插槽同样受益**：`open` 接收事件对象，`#default="{ open }"` 里写 `@click="open"` 即自动阻止冒泡（写成 `@click="() => open()"` 丢掉事件则不阻止，需自行 `.stop`）。
- 弹窗端行为（`coverUrl` 为空时 `#t=0.01` 首帧兜底等）在 `ModalVideoPreview` 上，见 README-ModalVideoPreview——**触发端首帧由 `frameCover` 控制**。
- **完整能力演示**：`apps/reference/src/pages/feedback/modal/preview/showcase/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（内联 defineProps，无 types.ts）

| name         | type             | 默认   | 语义                                                                                                                                 |
| ------------ | ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `url`        | `string`（必传） | —      | 视频地址（点击唤起预览弹窗的视频）                                                                                                   |
| `coverUrl`   | `string`         | —      | 封面图地址；**空 → 首帧封面（`frameCover` 默认开）或深色占位（关）**；有 → ElImage 封面（原生懒加载）                                |
| `frameCover` | `boolean`        | `true` | 无 `coverUrl` 时用 `video#t=0.01` 首帧作封面（`preload="metadata"` 只拉元数据 + 首帧，不拉全片）；关 = 深色占位 + 播放图标（零请求） |
| `lazy`       | `boolean`        | `true` | 封面图懒加载（仅 `coverUrl` 有值时生效）                                                                                             |
| `preview`    | `boolean`        | `true` | 是否可点击唤起预览（false = 纯展示封面/占位）                                                                                        |

> **img 原生属性全量透传**：`$attrs` 直达自身 ElImage（`coverUrl` 路径）——`alt` / `fit` / `loading` 等均可用。
> ⚠ **`width` / `height` 无效**：EP 2.13 的 ElImage 未声明 width/height props，透传会落根 div 的 HTML attribute（对 div 无渲染效果）。尺寸控制请用外层 CSS / `style`（配合 `fit="cover"` 居中裁切）。

### Emits

无

### Slots

| 槽             | scope                               | 语义                                                                                                                                                               |
| -------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `#default`     | `{ open: (event?: Event) => void }` | **可整体自定义触发 UI**（按钮「播放」/卡片/列表行）：`open` = 打开预览弹窗（内部决策链 + 自带兜底不变）；缺省 = 封面图/占位 + 播放图标（两形态统一），自带点击唤起 |
| `#placeholder` | 无                                  | 封面加载中占位（透传 ElImage；仅内置封面内容）                                                                                                                     |
| `#error`       | 无                                  | 封面加载失败兜底图（透传 ElImage；仅内置封面内容）                                                                                                                 |

### Expose

无

## 反模式 / 注意

- **`frameCover` 默认开会发请求**：无封面首帧封面 = 每实例一个 metadata 小请求（**非零请求**）；素材库大列表（几十个）首帧渲染会同时发 N 个小请求（单个体量极小，但 `video` 无原生 lazy）。介意请求量 → `:frame-cover="false"` 回退零请求占位，或按需补 IntersectionObserver 懒加载（YAGNI，暂未内置）
- **Safari/iOS `#t` 兼容薄弱**：Media Fragments 时间片做首帧在移动端 Safari 历史上不可靠（现代版本基本可用）；若目标用户强 iOS，可 `:frame-cover="false"` 走占位或业务侧自行传 `coverUrl`
- **`$attrs` 只落封面层**：想配「弹窗端视频」（`autoplay` / `muted` 等）[MUST NOT] 经触发组件透传——去 `ModalVideoPreview` 上配
- **决策链静默回退是硬行为**：任何环境（无遥控器/未注册/未开启全局）都不许报错——自带弹窗兜底保证触发组件永远可用
- **`preview=false` 只关点击**：仍渲染封面/占位——「展示」能力不随「预览」关掉
- **`open` 要把事件透给它**：`#default="{ open }"` 里写 `@click="open"`（自动阻止冒泡）优于 `@click="() => open()"`（丢事件 → 不阻止冒泡，外层行点击被连带触发）

## 关联

- 播放端：`ModalVideoPreview`（视频预览弹窗，ModalConfirm 为底 + url/coverUrl，封面空 `#t=0.01` 首帧兜底）
- 对等组件：`ImagePreviewTrigger`（图片触发端，同一决策链；ElImage 落地 + previewSrc 原图）
- 全局遥控：`GlobalModalRemote` / `GlobalModalControl` / `modalKey`（modal-shelf-types）+ 注入 key `GLOBAL_MODAL_REMOTE_KEY`（core 导出）+ 全局 key 常量 `APP_GLOBAL_VIDEO_PREVIEW_KEY`
- AppLayout 开关：`enableGlobalVideoPreview`（开启后自动注册全局视频预览弹窗，见 README-AppLayout）
- 范式页：`apps/reference/src/pages/feedback/modal/preview/showcase/`

## 内部分层（30mf7k / 3a7k03）

媒体预览归 core（L1），经 modal/preview 桶提供。全局遥控只消费底座契约与注入键，不依赖 feedback 实现；无全局注册时仍本地预览。

仅调整内部引用；组件位置、props、插槽、样式及行为不变。浏览器回归由复核者执行。

> 目录迁移：本组件及配套归入 `components/feedback/video-preview-trigger`；仅源码位置变化，包根导入、props、slots 与实例契约保持。

## 无障碍语义（td1v4s 收窄版 B）

首帧/占位按钮名称读取已有 aria-label attr，缺省“播放视频”；封面 alt 优先保留既有 attr，缺省为空。未增加角色、焦点或 Space 处理，也未改变 Enter 处理和 preview=false 行为。图片封面原有鼠标路径保持，完整键盘可达性不作承诺。未新增 prop。
