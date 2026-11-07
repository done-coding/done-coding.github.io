# FormUploadImage（图片上传组件）

> 基于 `FormUpload` 的**图片专属薄封装**：类型限制（`accept="image/*"`）+ 列表项体验优化（方形缩略图卡片 + 点击放大预览 + 悬停删除）。
> 与 `FormUploadVideo` / `FormUploadAudio` 同族（媒体上传三件套）。
> 范式页：`apps/reference/src/pages/form/guide/`（FormMain 配置化）、`apps/reference/src/pages/form/submit-panel/showcase/`（FormSubmitPanel 配置化）

## 定位

- **何时用**：任意「上传图片」场景——头像、封面、图库；与 `FormUpload` 同契约（先上传拿 URL，表单只提交 URL），只是对上传类型做了进一步限制 + 列表项按图片形态优化
- **何时不用**：上传任意文件类型 → `FormUpload` 本体；上传视频 / 音频 → 同族 `FormUploadVideo` / `FormUploadAudio`
- 基座关系：**薄封装不改契约**——全部 props / emits / v-model 透传 `FormUpload`；仅两处覆写：ⓐ `accept` 默认 `"image/*"`；ⓑ 默认 `#file` 列表项 = 方形缩略图卡片（点击经 `ImagePreviewTrigger` 直达 el-image-viewer 放大；悬停删除角标）
- 列表形态：默认 `list-type="picture-card"`（EP 方形卡片网格），消费方可经 attrs 覆写
- 预览链路：列表项 = `ImagePreviewTrigger`（`src=file.url`）——**点击直达 ElImage 原生预览**（零弹窗零决策链，与预览族图片约定一致）；上传中 blob URL 同样可预览（本地即时核对）

## 快速上手（最小可用）

```vue
<FormUploadImage
  v-model="cover"
  :upload-fn="uploadFn"
  loading-key="cover"
  placeholder="点击上传封面（单文件 · 限图片）"
/>
```

**要点**：

- `uploadFn` 必填（数据职责注入，同 `FormUpload`）；`loadingKey` = 本表单项 `key`（上传期间拦提交）
- 单文件默认（`maxCount` 1 替换语义）；`maxCount` > 1 = 多文件追加（卡片网格）
- 必传/非必传 = 表单配置项 `required`（FormMain 校验），与组件无关

## 能力边界 / 按需使用

- **默认即够用：方形卡片 + 点击放大 + 悬停删除**——绝大多数图片上传只传 `uploadFn` / `loadingKey`。
- `maxCount` / `maxSize` / `drag`：多文件+数量上限 / 大小上限 / 拖拽（透传 FormUpload）。
- `#file` 插槽（scope 含 `remove`）：完全自定义卡片内容（仍建议保留预览与删除能力）。
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
| `accept`     | `"image/*"`      | 文件类型过滤（**覆写默认**，可再覆盖）                                                                                   |
| `listType`   | `"picture-card"` | 列表形态（**覆写默认**为方形卡片网格，透传 ElUpload）                                                                    |
| 其余         | 同 FormUpload    | `maxCount`（默认 1，>1 多文件）/ `maxSize`（MB 大小上限）/ `drag` / `disabled` / `showProgress` / `placeholder` 等全透传 |

> **ElUpload 属性经 `$attrs` 全量透传**（`autoUpload` / `on-exceed` 等），网络类属性（action/headers/data/http-request）被 FormUpload 忽略（上传行为由 uploadFn 接管）。

### Emits

同 `FormUpload`（`update:modelValue` / `uploadSuccess` / `uploadError` / `triggerChangeLink`）。

### Slots

| 槽         | scope                     | 语义                                                                                                         |
| ---------- | ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `#default` | 无                        | 上传触发区（默认「点击/拖拽上传」观感）                                                                      |
| `#file`    | `{ file, index, remove }` | 列表项自定义；**默认 = 方形缩略图卡片 + 点击放大 + 悬停删除**；`remove` = 删除当前项（基座 slot scope 拓展） |
| `#tip`     | 无                        | 列表下方提示（透传 FormUpload）                                                                              |

### Expose

无

## 反模式 / 注意

- **别在 `#file` 里塞自绘弹窗**：预览终点 = el-image-viewer（`ImagePreviewTrigger` 点击直达），[MUST NOT] 再包弹窗（两层嵌套已废弃）
- **`accept` 只是过滤不是校验**：服务端仍须按类型/大小校验（同 FormUpload）
- **`remove` 走基座值同步**：自定义 `#file` 删除须用 scope 的 `remove`（内部 handleRemove 同步 v-model），[MUST NOT] 直接改 fileList
- **进度条**：上传中卡片下方有 EP 内置进度（`showProgress` 开关）

## 关联

- 基座：`FormUpload`（上传原语：uploadFn 注入 / validate 拦提交 / #file slot scope）
- 同族：`FormUploadVideo`（视频，封面占位 + 播放图标 + VideoPreviewTrigger 决策链）、`FormUploadAudio`（音频，内联播放条）
- 预览：`ImagePreviewTrigger`（点击直达 ElImage 原生放大）
- 拦截机制：`FORM_ITEM_CHANGE_LOADING`（FormMain validate 闸）
- 范式页：`apps/reference/src/pages/form/guide/`、`apps/reference/src/pages/form/submit-panel/showcase/`

## 内部分层（30mf7k / 3a7k03）

FormUploadImage / FormUploadVideo 只引用 core（L1）的 `modal/preview` 媒体预览桶，不依赖 feedback 架子实现或 pro 表单弹层。

本次仅调整内部引用，组件位置、props、插槽、行为与样式不变；浏览器回归由复核者执行。

> 目录迁移：实现与配套收纳到 `components/form/form-upload-image`，包根 API 与演示能力保持。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-form`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。

## 无障碍语义（td1v4s）

默认图片缩略图 alt 采用已有 file.name；无文件名时为“已上传图片”。上传/删除默认内容具备可读名称，不新增 prop。
