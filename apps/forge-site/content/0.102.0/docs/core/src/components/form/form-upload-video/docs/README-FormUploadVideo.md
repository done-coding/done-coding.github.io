# FormUploadVideo（视频上传组件）

> 基于 `FormUpload` 的**视频专属薄封装**：类型限制（`accept="video/*"`）+ **交互对齐图片上传**（picture-card 卡片网格——唯一区别 = 卡片内容为视频预览）。
> 与 `FormUploadImage` / `FormUploadAudio` 同族（媒体上传三件套）。
> 范式页：`apps/reference/src/pages/form/guide/`（FormMain 配置化）、`apps/reference/src/pages/form/submit-panel/showcase/`（FormSubmitPanel 配置化）

## 定位

- **何时用**：任意「上传视频」场景——素材库、课程视频；与 `FormUpload` 同契约（先上传拿 URL），只是类型限制 + 列表项按视频形态优化
- **何时不用**：上传任意文件 → `FormUpload` 本体；图片 / 音频 → 同族 `FormUploadImage` / `FormUploadAudio`
- 基座关系：**薄封装不改契约**——全部 props / emits / v-model 透传 `FormUpload`；仅三处覆写：ⓐ `accept` 默认 `"video/*"`；ⓑ `listType` 默认 `"picture-card"`（**卡片网格，交互对齐图片上传**）；ⓒ 默认 `#file` 列表项 = 媒体卡片（`VideoPreviewTrigger` 铺满 + 上传中遮罩 + 悬停删除）
- **卡片内容 = 视频预览**：封面图（有 coverUrl）/ 深色占位 + 播放图标（无封面——业界主流：上传视频大多无封面，YouTube/剪映素材库同此形态）；点击走弹窗决策链（全局遥控 `APP_GLOBAL_VIDEO_PREVIEW_KEY` 命中 → 全局唤起；否则自带弹窗兜底），上传中 blob URL 同样可播放（本地即时核对）

## 快速上手（最小可用）

```vue
<FormUploadVideo
  v-model="video"
  :upload-fn="uploadFn"
  loading-key="video"
  placeholder="点击上传视频（单文件 · 限视频）"
/>
```

**要点**：

- `uploadFn` 必填（同 `FormUpload`）；`loadingKey` = 本表单项 `key`（上传期间拦提交）
- 单文件默认（`maxCount` 1 替换语义）；`maxCount` > 1 = 多文件追加（列表行）
- 必传/非必传 = 表单配置项 `required`，与组件无关

## 能力边界 / 按需使用

- **默认即够用：卡片网格 + 播放图标 + 点击播放**——绝大多数视频上传只传 `uploadFn` / `loadingKey`。
- `maxCount` / `maxSize` / `drag`：多文件+数量上限 / 大小上限 / 拖拽（透传 FormUpload）；**满上限（`maxCount` 达）触发区隐藏**（单文件上传后消失，替换 = 删旧再传）。
- `#file` 插槽（scope 含 `remove`）：完全自定义列表项（建议保留预览与删除）。
- **完整能力演示**：范式页——单文件必传 / 多文件非必传组合见 FormMain 与 FormSubmitPanel reference。

## 受控语义：与裸 `FormUpload` **同一份状态**

值同步、无条件对齐、在途项保留、删除自持生效等全部受控行为，都由基座
`FormUpload` 的同一个 `useUploadState` 实例提供（薄封装只透传 `v-model`）——
细节见 [README-FormUpload](../../form-upload/docs/README-FormUpload.md) 的「受控语义」一节，
这里 [MUST NOT] 另立一套说法。

🔴 **薄封装与裸组件的唯一差别是那条渲染路径**：它走**自定义列表槽**
（`#file` → `FormUploadCard` + `:remove`），而裸组件走 EP 默认列表。
所以：

- 卡片上的 `✕` 与裸组件的删除是**同一个** `handleRemove`（经 slot scope 的 `remove`
  下传），[MUST NOT] 在卡片里自行改 `fileList`；
- 对齐后卡片能否正确重渲，是**独立于 `useUploadState` 单测**的一条路径 ⇒
  它有自己的守卫（`__tests__/FormUploadMedia.test.ts` 的「默认卡片 ✕」两条），
  [MUST NOT] 把基座那 8 条受控守卫在这里再抄一遍（同一份状态，抄了也是同一条路）。

演示：`/form/upload/showcase` 的 **ⓖ 节**（受控拒绝 / 原地换值，图片与视频各一组）。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（继承 FormUpload 全部 + 覆写默认值）

| name         | 默认             | 语义                                                                                                                     |
| ------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `uploadFn`   | （必填）         | 上传接口注入 `(file: File) => Promise<string>`（透传 FormUpload）                                                        |
| `loadingKey` | —                | 本表单项 key，上传期间拦提交（透传 FormUpload）                                                                          |
| `accept`     | `"video/*"`      | 文件类型过滤（**覆写默认**，可再覆盖）                                                                                   |
| `listType`   | `"picture-card"` | 列表形态（**覆写默认**为卡片网格，交互对齐图片上传；text 等可覆写）                                                      |
| 其余         | 同 FormUpload    | `maxCount`（默认 1，>1 多文件）/ `maxSize`（MB 大小上限）/ `drag` / `disabled` / `showProgress` / `placeholder` 等全透传 |

> **ElUpload 属性经 `$attrs` 全量透传**，网络类属性被 FormUpload 忽略（上传行为由 uploadFn 接管）。

### Emits

同 `FormUpload`（`update:modelValue` / `uploadSuccess` / `uploadError` / `triggerChangeLink`）。

### Slots

| 槽         | scope                     | 语义                                                                                                                                          |
| ---------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `#default` | 无                        | 上传触发区（默认「点击/拖拽上传」观感）                                                                                                       |
| `#file`    | `{ file, index, remove }` | 列表项自定义；**默认 = 媒体卡片（`VideoPreviewTrigger` 铺满：封面/占位 + 播放图标，点击播放）+ 上传中遮罩 + 悬停删除**；`remove` = 删除当前项 |
| `#tip`     | 无                        | 列表下方提示（透传 FormUpload）                                                                                                               |

### Expose

无

## 反模式 / 注意

- **列表项不做 `#t=0.01` 抠首帧**：无封面就深色占位 + 播放图标（业界主流，播放按钮即语义；首帧由服务端生成封面是上传后增强，非前端必须）——首帧兜底只在弹窗端 `ModalVideoPreview`（播放器场景才需要「不黑屏」）
- **`accept` 只是过滤不是校验**：服务端仍须校验（同 FormUpload）
- **`remove` 走基座值同步**：自定义 `#file` 删除须用 scope 的 `remove`，[MUST NOT] 直接改 fileList
- **弹窗端视频属性（autoplay/muted 等）在 `ModalVideoPreview` 上配**，[MUST NOT] 经本组件透传

## 关联

- 基座：`FormUpload`（上传原语：uploadFn 注入 / validate 拦提交 / #file slot scope）
- 同族：`FormUploadImage`（方形缩略图卡片 + 点击直达放大）、`FormUploadAudio`（内联播放条）
- 播放端：`VideoPreviewTrigger` → `ModalVideoPreview`（黑底 lightbox，决策链：全局遥控优先 / 自带弹窗兜底）
- 拦截机制：`FORM_ITEM_CHANGE_LOADING`（FormMain validate 闸）
- 范式页：`apps/reference/src/pages/form/guide/`、`apps/reference/src/pages/form/submit-panel/showcase/`

## 内部分层（30mf7k / 3a7k03）

FormUploadImage / FormUploadVideo 只引用 core（L1）的 `modal/preview` 媒体预览桶，不依赖 feedback 架子实现或 pro 表单弹层。

本次仅调整内部引用，组件位置、props、插槽、行为与样式不变；浏览器回归由复核者执行。

> 目录迁移：实现与配套收纳到 `components/form/form-upload-video`，包根 API 与演示能力保持。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-form`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
