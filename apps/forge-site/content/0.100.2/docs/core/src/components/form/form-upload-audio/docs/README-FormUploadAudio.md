# FormUploadAudio（音频上传组件）

> 基于 `FormUpload` 的**音频专属薄封装**：类型限制（`accept="audio/*"`）+ 列表项体验优化（内联播放条即时试听）。
> 与 `FormUploadImage` / `FormUploadVideo` 同族（媒体上传三件套）。
> 范式页：`apps/reference/src/pages/form/guide/`（FormMain 配置化）、`apps/reference/src/pages/form/submit-panel/showcase/`（FormSubmitPanel 配置化）

## 定位

- **何时用**：任意「上传音频」场景——语音、配乐、素材；与 `FormUpload` 同契约（先上传拿 URL），只是类型限制 + 列表项按音频形态优化
- **何时不用**：上传任意文件 → `FormUpload` 本体；图片 / 视频 → 同族 `FormUploadImage` / `FormUploadVideo`
- 基座关系：**薄封装不改契约**——全部 props / emits / v-model 透传 `FormUpload`；仅两处覆写：ⓐ `accept` 默认 `"audio/*"`；ⓑ 默认 `#file` 列表项 = 行式（文件名/大小/进度 + **内联 `<audio controls>` 播放条** + 删除）
- **音频不建弹窗（业界结论）**：音频语义是「试听」不是「观看」——业界主流（blueimp / Vue File Agent / 微信 / 播客产品）均为**内联播放条**，无「音频 lightbox」形态；故不新增 `AudioPreviewTrigger` / `ModalAudioPreview`，播放条直接内联列表项（上传中 blob URL 即时可试听）

## 快速上手（最小可用）

```vue
<FormUploadAudio
  v-model="audio"
  :upload-fn="uploadFn"
  loading-key="audio"
  placeholder="点击上传音频（单文件 · 限音频）"
/>
```

**要点**：

- `uploadFn` 必填（同 `FormUpload`）；`loadingKey` = 本表单项 `key`（上传期间拦提交）
- 单文件默认（`maxCount` 1 替换语义）；`maxCount` > 1 = 多文件追加（列表行）
- 必传/非必传 = 表单配置项 `required`，与组件无关

## 能力边界 / 按需使用

- **默认即够用：行式列表 + 内联播放条**——绝大多数音频上传只传 `uploadFn` / `loadingKey`。
- `maxCount` / `maxSize` / `drag`：多文件+数量上限 / 大小上限 / 拖拽（透传 FormUpload）。
- `#file` 插槽（scope 含 `remove`）：完全自定义列表项（建议保留播放与删除）。
- **完整能力演示**：范式页——单文件必传 / 多文件非必传组合见 FormMain 与 FormSubmitPanel reference。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（继承 FormUpload 全部 + 覆写默认值）

| name         | 默认          | 语义                                                                                                                     |
| ------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `uploadFn`   | （必填）      | 上传接口注入 `(file: File) => Promise<string>`（透传 FormUpload）                                                        |
| `loadingKey` | —             | 本表单项 key，上传期间拦提交（透传 FormUpload）                                                                          |
| `accept`     | `"audio/*"`   | 文件类型过滤（**覆写默认**，可再覆盖）                                                                                   |
| 其余         | 同 FormUpload | `maxCount`（默认 1，>1 多文件）/ `maxSize`（MB 大小上限）/ `drag` / `disabled` / `showProgress` / `placeholder` 等全透传 |

> **ElUpload 属性经 `$attrs` 全量透传**，网络类属性被 FormUpload 忽略（上传行为由 uploadFn 接管）。

### Emits

同 `FormUpload`（`update:modelValue` / `uploadSuccess` / `uploadError` / `triggerChangeLink`）。

### Slots

| 槽         | scope                     | 语义                                                                                                     |
| ---------- | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `#default` | 无                        | 上传触发区（默认「点击/拖拽上传」观感）                                                                  |
| `#file`    | `{ file, index, remove }` | 列表项自定义；**默认 = 文件名/大小/进度 + 内联 `<audio controls>` 播放条 + 删除**；`remove` = 删除当前项 |
| `#tip`     | 无                        | 列表下方提示（透传 FormUpload）                                                                          |

### Expose

无

## 反模式 / 注意

- **[MUST NOT] 为音频造弹窗**：业界无「音频 lightbox」形态——试听语义用内联播放条（成本最低、交互最自然），弹窗沉浸是视频专利
- **`accept` 只是过滤不是校验**：服务端仍须校验（同 FormUpload）
- **`remove` 走基座值同步**：自定义 `#file` 删除须用 scope 的 `remove`，[MUST NOT] 直接改 fileList
- **播放条直用原生 `<audio controls>`**：薄壳不内置波形/播放器增强（需要时消费方自拼，见反模式）

## 关联

- 基座：`FormUpload`（上传原语：uploadFn 注入 / validate 拦提交 / #file slot scope）
- 同族：`FormUploadImage`（方形缩略图卡片 + 点击直达放大）、`FormUploadVideo`（封面占位 + 播放图标 + 弹窗决策链）
- 拦截机制：`FORM_ITEM_CHANGE_LOADING`（FormMain validate 闸）
- 范式页：`apps/reference/src/pages/form/guide/`、`apps/reference/src/pages/form/submit-panel/showcase/`

> 目录迁移：实现与配套收纳到 `components/form/form-upload-audio`，包根 API 与演示能力保持。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-form`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
