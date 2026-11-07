# FormUpload（上传原语）

> 基于 ElUpload 封装的上传字段：**先上传拿 URL，表单只提交 URL**（业界主流 + 本框架 JSON 提交链路结构必然）；`uploadFn` 注入上传接口（不焊后端）；上传中经 `FORM_ITEM_CHANGE_LOADING` 拦截提交；进度走 ElUpload 内置。
> 对齐表单配置项契约（form 族：`render: FormUpload` + `props` 注入，值 = `string | string[]`）。
> 范式页：`apps/reference/src/pages/form/upload/showcase/`

## 定位

- **何时用**：任意「表单内文件上传」场景——头像/附件/素材，值 = 已上传文件的 URL
- **何时不用**：非表单命令式上传（无字段值语义）→ 直接用 ElUpload；需要倍速/字幕等播放能力 → 播放器组件
- **模式裁定（只做「先上传再提交 url」）**：业界两模式——「文件 + 字段一次 multipart 提交」属整体表单体系（服务端 multipart 接口 + 表单引擎非 JSON），且组件库先例（ElUpload / antd Upload）均为 URL 入值；本框架 FormMain 提交链路 = validate → stringify → JSON，**先传拿 URL 是结构必然**（URL 是字符串，天然融入现有 JSON 契约）。**随表单直传不做**——需表单引擎 multipart 化，与配置化契约分叉、非主流
- 职责分工：**数据职责注入式**（`uploadFn` 注入上传接口，不焊后端）/ **呈现职责声明式**（`showProgress` 开关 + 内置进度条）
- 关键机制：`modelValue` = URL（单文件）/ URL 数组（多文件）——与 `uploadFn` 返回一致，表单 stringify 即提交 URL

## 快速上手（最小可用）

```ts
// 表单配置项（render 契约：modelValue v-model + props 注入）
{
  key: "avatar",
  label: "头像",
  render: FormUpload,
  props: {
    uploadFn: (file) => uploadFile(file),   // 上传接口：入参 File，返回 Promise<URL>
    loadingKey: "avatar",                    // 表单字段 key——上传期间拦提交（见「拦截机制」）
  },
}
```

**要点**：

- `uploadFn` 必填：入参 `File`、返回 `Promise<string>`（文件 URL）——**只约定数据契约，不焊任何后端**
- `loadingKey` = 本表单项的 `key`：上传期间提交被拦截（`FORM_ITEM_CHANGE_LOADING` 链路），上传完成自动放行
- 值类型随 `multiple`：`false`（默认）= `string`；`true` = `string[]`
- 进度条默认显示（ElUpload 内置），`showProgress=false` 关闭

## 拦截机制（上传中禁提交）

- **链路（FormMain validate 闸）**：FormUpload 上传在途数 0→1 时调 `changeLoading({ key: loadingKey, message: "上传中" })` → FormMain `loadingList` 记录 → **`validate()` 开头直接 reject**（错误文案 = `label+message`「xx上传中」）→ **提交被拦截**，错误经 reject 由提交方（FormSubmitBtn `@fail` / ElMessage 等）展示；在途数 →0 时 `changeLoading({ key: loadingKey })`（message 空）移除，恢复可提交
- **[MUST NOT] 走 el-form 规则注入拦提交**：规则增删会触发 EP el-form-item `doValidateField` 的 `resetField`（validateState=error 且无 error 消息 → 字段重置为初始值）——上传完成移除规则时会把刚写入的 URL 重置清空（历史坑两次踩，FormMain 已收敛为 validate 闸，字段级错误提示不再由规则注入产生）
- `loadingKey` 未传（裸用/非 FormMain 环境）→ `inject(FORM_ITEM_CHANGE_LOADING)` 未命中 no-op，**上传照常不拦**（组件不崩）
- 判定在途 = **内部 `uploadingCount`**（起止对称计数，覆盖并发多文件）——ElUpload `v-model:file-list` 不回传 uploading 状态，不依赖它

## 能力边界 / 按需使用

- **默认即够用：单文件 + URL 值 + 进度条 + 上传中拦提交**——绝大多数场景只配 `uploadFn` + `loadingKey`。进度条由 `uploadFn` 可选第二参 `onProgress(percent)` 驱动（真实后端 XHR 转发 `upload.onprogress`；不调则进度条静态）。
- `multiple` + `limit`：多文件上传（值变 `string[]`）+ 数量上限（默认按形态：单文件 1 / 多文件不限）；**满上限触发区隐藏**（`list.length < maxCount` 才显示——业界主流 maxCount 满即无上传入口，单文件上传后触发区消失，替换 = 删旧再传；自定义 default slot 同样隐藏）。
- **布局 = 列表在前、触发在后**（text/picture 模式 flex order 重排）：每上传一个文件，文件项都在拖拽/点击二合一触发模块前面；picture-card 模式触发卡天然在网格末尾。
- `accept` / `drag` / `disabled`：文件类型过滤 / 拖拽上传 / 禁用，透传 ElUpload。
- `showProgress`：默认开（ElUpload 内置进度条：`on-progress` → `event.percent` → 自动更新显示）；**无需自造进度方法**——接口支持 XHR 上传进度即自动可用；仅自定义进度呈现时才需自行从 `on-progress` 拿 `event.percent`（本组件不提供进度插槽，YAGNI）。
- **完整能力演示**：`apps/reference/src/pages/form/upload/showcase/`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props（内联 defineProps，无 types.ts）

| name           | type                                      | 默认    | 语义                                                                                                                                                                        |
| -------------- | ----------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue`   | `string \| string[] \| undefined`（必传） | —       | v-model：已上传文件 URL；`multiple` 时为 URL 数组                                                                                                                           |
| `uploadFn`     | `(file: File) => Promise<string>`（必传） | —       | 上传接口注入：入参 File、返回 URL（数据职责，不焊后端）                                                                                                                     |
| `loadingKey`   | `string`                                  | —       | 表单字段 key——上传期间经 `FORM_ITEM_CHANGE_LOADING` 拦提交（FormMain 配置化场景传；裸用可不传）                                                                             |
| `maxCount`     | `number`                                  | `1`     | **文件数量上限 + 多文件判定一体**（`>1` = 多文件追加兼上限；`1` = 单文件替换语义——业界主流 maxCount 即数量限制）；v-model 恒 `string[]`，配置表单提交转换经 stringify/parse |
| `maxSize`      | `number`（MB）                            | —       | **单文件大小上限**（EP 无原生 size 限制，上传前校验 reject + ElMessage 提示；超限值不入）                                                                                   |
| `accept`       | `string`                                  | —       | 文件类型过滤（透传 ElUpload）                                                                                                                                               |
| `drag`         | `boolean`                                 | `false` | 拖拽上传（透传 ElUpload）                                                                                                                                                   |
| `disabled`     | `boolean`                                 | `false` | 禁用（透传 ElUpload）                                                                                                                                                       |
| `showProgress` | `boolean`                                 | `true`  | 上传进度条（ElUpload 内置 `show-progress`）                                                                                                                                 |
| `placeholder`  | `string`                                  | —       | 空态提示文字（render 契约字段）                                                                                                                                             |

> **ElUpload UI 类属性全量透传**：`$attrs` 直达 ElUpload——`autoUpload` / `listType`（picture-card 等）/ `on-success` / `on-error` / `on-exceed` 等均可用。**网络类属性（`action` / `headers` / `data` / `with-credentials` / `http-request`）不适用**——上传行为已由 `uploadFn` 内部接管（`http-request` 内部固定走 uploadFn），外部传了被忽略。

### Emits

| 事件                | 载荷                                 | 语义                                 |
| ------------------- | ------------------------------------ | ------------------------------------ |
| `update:modelValue` | `string \| string[]`                 | v-model 同步                         |
| `uploadSuccess`     | `{ file: UploadFile, url: string }`  | 单文件上传成功（URL 已入值）         |
| `uploadError`       | `{ file: UploadFile, error: Error }` | 单文件上传失败（值不变，错误可展示） |
| `triggerChangeLink` | `(value, attachInfo?)`               | 联动透传（配置项 beLink 场景）       |

### Slots

| 槽      | scope                     | 语义                                                                                                                                                                            |
| ------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 默认    | ElUpload 触发区 scope     | 自定义触发区（透传 ElUpload）；**缺省 = 内置触发区**（上传图标 + 「点击上传」/drag 时「点击或拖拽上传」——无内容时 el-upload 触发区坍缩 0 尺寸不可点，兜底保证点击上传入口恒在） |
| `#tip`  | 无                        | 提示区（透传 ElUpload）                                                                                                                                                         |
| `#file` | `{ file, index, remove }` | 文件列表自定义渲染（透传 ElUpload 实际 slot scope；**`remove` = 删除当前项**，内部同步 v-model）                                                                                |

### Expose

无

## 🔴 受控语义：外部拒绝变更时，组件回到外部给的值

`modelValue` 是**唯一真相源**，内部的 `fileList`（喂给 `ElUpload` 的那份）**恒与它对齐**：

```
对齐 = 以 modelValue 的 url 集合为准增删
[MUST NOT] 拿「fileList 是不是空的」当门槛 —— 那会让
「外部不接受这次变更」和「外部接受了、只是值恰好相同」在组件眼里长得一模一样，
而受控组件恰恰靠前者工作。
```

由此三条行为都成立（`["A"] → ["B"]` 换图 / `["A"] → []` 清空 / `[] → ["A"]` 填充），
且**受控方不回写时组件回到空态** —— 上传完外部仍给 `[]`，列表就清回空、触发区还在、`✕` 可用。

### 🔴 对齐的驱动源是**三个**，不是只有 `modelValue`

「外部拒绝这次变更」时 `modelValue` 的**引用根本不变** ⇒ 只 watch 它，那一档永远不跑。
故对齐挂在三源上（`flush: "post"`，同 tick 内齐变只收敛一次、无闪）：

| 源           | 兜的是哪一路                                                                       |
| ------------ | ---------------------------------------------------------------------------------- |
| `modelValue` | 外部改值（含清空 / 原地换值）                                                      |
| `fileList`   | EP 经 `v-model:file-list` **绕过 `modelValue` 直接塞条目**                         |
| 在途数归零   | EP 上传成功是**就地改条目**（`response` / `status`），数组引用可能不变、watch 不到 |

`flush: "post"` [MUST] 保留：上传成功那一瞬，「外部接受了」与「外部拒绝了」长得一模一样，
**只有等值传播完才分得开**。

### ⚠️ 对齐**保住在途项**

上传期间那一条**不在 `modelValue` 里**（它还没有最终 url）。对齐按「**有无最终 url**」划线：

|                 | 判据                                 | 对齐时                                                                    |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------- |
| 已完成 / 回显项 | `file.response ?? file.url` **有值** | 按 `modelValue` 的 url 集合增删；命中的**复用原条目**（不重建，避免闪烁） |
| 在途项          | 两处皆无                             | **原样保留**，排在已完成项之后                                            |

🔴 **`blob:` 不算最终 url**：`list-type="picture-card"`（媒体三件的默认形态）下
EP 会给在途项塞一个**本地预览** `blob:` URL（`status` 还是 `ready`）。它不是上传结果、
永远不会进 `modelValue` ⇒ 划线 [MUST] 排除它。不排除的话在途项会被当场摘掉，
而那一摘撞进 EP 内部 `useVModel(passive)` 的 `isUpdating` 窗口，回灌被吞 ⇒
**EP 那份列表与本 hook 永久脱钩**（值空了、触发区回来了，卡片却删不掉）。

🔴 **值里允许出现重复 url，复用 [MUST] 按次消费**：`modelValue` 是 `string[]`，
同一个 url 出现两次是合法输入（后端去重存储 / 同一文件传两次 / 外部就那么配的）。
复用索引若按 url 做「一对一」，重复那几项会拿到**同一个条目对象**放进列表多次 ⇒
EP 以 `uid` 作 key ⇒ **重复 key**、列表渲染紊乱（实测 DOM 闪出多余卡片约 400ms，
终态才收敛 —— 所以**只断终态的测试对它是绿的**）。故索引值是队列：同 url 的第 N 次
取第 N 个原条目，取空了才新建水合条目（新 uid）。

🔴 [MUST NOT] 按 `uid` 或数组下标比对 —— 水合项的 uid 是本组件自增的、EP 塞进来的是
`genFileId()`，两套编号对不上；下标更是一改顺序就错位。

### 两条渲染路径，删除入口是同一个

| 路径                 | 谁在走                            | 删除入口                                            |
| -------------------- | --------------------------------- | --------------------------------------------------- |
| EP 默认列表          | 裸 `FormUpload`                   | EP 的 `on-remove` → `handleRemove`                  |
| 自定义列表槽 `#file` | 媒体三件（`FormUploadCard` 卡片） | slot scope 的 `remove` = `() => handleRemove(file)` |

两条路**共用同一份状态**（全仓 `useUploadState` 只有 `FormUpload` 一个使用方）⇒
受控行为不会只坏一侧。但**自定义槽的重渲是独立的一条路径**，
故它在 `__tests__/FormUploadMedia.test.ts` 有自己的守卫。

### 删除是**自持**的

`✕` 直接把该条从 `fileList` 摘掉，再把 url 移出 `modelValue`。
🔴 [MUST NOT] 把「删除生效」押在「外部会把值改掉 → 回流 watch 会清列表」这个假设上：
外部完全可以不接受这次删除，那时列表该听外部的、而不是**卡在自己的中间态**。

### 为什么这件事值得单独写一段

`fileList` 一旦与 `modelValue` 分叉，**五处**一起坏（不是三处）：
显示 · 删除 · 还能不能再传（触发区按 `fileList.length < maxCount` 显隐）·
`dc-form-upload_full` 满态样式 · `placeholder` 空态文案（按 `fileList.length === 0` 显隐）。

## 反模式 / 注意

- **根盒恒占整行**（`width:100%` + `min-width:0`）：作 `.el-form-item__content` 的 flex item，不显式给宽会收缩到内容宽 —— picture-card 形态下卡片网格的可用宽会随卡片数变化、拖拽区也跟着缩

- **值 = URL 不是 File**：`modelValue` 语义是「已上传文件的 URL」——外部塞 File 对象进值是错误用法（表单 stringify 提交的是 URL）；上传动作经 `uploadFn` 发生
- **`loadingKey` 不传则上传中不拦提交**：裸用可接受（无 FormMain 环境）；FormMain 配置化场景忘传 = 上传中能提交（半成品 URL 进库）——配置时 [MUST] 传
- **进度不自造**：ElUpload 内置进度条（on-progress → percent → 自动显示）——「把 onprogress 数据传给 getProgress 方法」是自造轮子；只有自定义进度呈现才需要自己拿 `event.percent`
- **网络类属性无效**：`action` / `headers` / `http-request` 等传了被忽略（上传走 uploadFn）——别把后端上传配置塞 ElUpload 网络 props
- **外部清空联动**：外部把值清空（`undefined` / 空数组）→ 文件列表同步清空——受控语义，别惊讶
- **给受控组件一个恒定不变的 model**：那等于「外部拒绝一切变更」⇒ 组件会**回到那个恒定值**
  （如恒 `[]` 就是上传完回到空态）。这是受控语义的正确结果，[MUST NOT] 当 bug 报；
  要「传完就留在界面上」请把 `update:modelValue` 接回去，或用一次性实例（换 `key` 重建）
- **多文件去重**：同 URL 重复上传不做客户端去重（服务端职责），`limit` 只限数量

## 关联

- form 族：`FormMain`（宿主：validate 拦截闸 / stringify 序列化）、`FormSubmitPanel`（FormMain 容器 + 取消/重置/提交操作区，直接消费——上传中拦提交经内置提交管线照样生效，见范式页 ⓔ）、`FormItem`（render 契约宿主：modelValue + props 注入）
- 拦截机制：`FORM_ITEM_CHANGE_LOADING`（FormMain 256 行 provide；loadingList → 恒失败规则 → validate reject）
- 底层：`ElUpload`（element-plus；UI/进度/列表内置能力）
- 范式页：`apps/reference/src/pages/form/upload/showcase/`

> 目录迁移：实现与配套收纳到 `components/form/form-upload`，包根 API 与演示能力保持。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-form`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
