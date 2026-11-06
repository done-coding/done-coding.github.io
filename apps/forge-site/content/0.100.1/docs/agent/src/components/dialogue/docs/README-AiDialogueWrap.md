# AiDialogueWrap（浮层面板）

> Teleport 到 `body` 的 fixed 右下角浮层面板：箭头拉手 + 移动端全屏适配（密度缩放 + 键盘避让内置）。AI 模块的挂载容器。
> 范式页：`demo-src/demos/WrapDemo.vue`

## 定位

- **浮层形态一等公民**：AI 模块作为页面浮层（右下角面板）时用它包裹对话主件；页面内嵌形态直接用 `AiDialogue` / `AiDialogueGroup` 即可
- **何时不用**：AI 模块内嵌页面布局（非浮层）不用它
- 内部实现（不导出）：`useAgentUiDensity`（移动端 scoped-rem 密度 + 面板全屏形态）/ `useKeyboardInset`（visualViewport 键盘避让）/ `useAiExposeInject`（打开时聚焦输入框）

## 快速上手（最小可用）

```html
<AiDialogueWrap v-model:show="show" density="auto">
  <AiDialogueGroup :user-name="'demo-user'" />
</AiDialogueWrap>
```

**要点**：

- `v-model:show` 控制开合（`false` = 面板 transform 右移出视口，拉手仍可见）
- 拉手为**箭头图标**（指向面板将要移动的方向），带 `aria-label` / `title`；无定制 prop
  > 0.3.0 起由 44×150px 竖排中文「收起/打开AI模块」改为 28×64px 箭头——竖排长中文非业界形态且占位过大
- `density="auto"` 默认按 UA 判设备：移动端 = 全屏贴边（`100vw/100svh` 无圆角）+ scoped-rem 缩放；PC = clamp 宽面板（`--dc-agent-panel-width`）
- 打开面板时自动聚焦输入框（经 expose 通道）

## 能力边界 / 按需使用

- **`density`（设备档 override）**：默认 `"auto"`（UA 判定）即够用；`"mobile"`/`"desktop"` 强制档仅用于 demo 对照 / 受控场景 / 异常 UA 兜底
- **面板尺寸**：PC 形态由 `--dc-agent-panel-*` token 控制（width/height/radius，消费方可覆盖）；移动端全屏为内置行为
- **完整能力演示**：`demo-src/demos/WrapDemo.vue`——能力展示，非推荐默认

## API

> ⚠️ API 以组件源码为真相源；与文档冲突时以源码为准。

### Props

| name | type | 默认 | 语义 |
| --- | --- | --- | --- |
| `density` | `DensityMode?`（`"auto"\|"mobile"\|"desktop"`） | `"auto"` | 设备档 override（auto 按 UA 判设备） |

**v-model**：`show`（boolean，面板开合）

### Emits

无显式 defineEmits（仅 model）

### Slots

| 槽 | scope | 语义 |
| --- | --- | --- |
| `default` | — | 面板内容（通常放 AiDialogueGroup / AiDialogue） |

### Expose

无

## 反模式 / 注意

- **漏配 `viewport-fit=cover` meta**：安全区 token 退化为 0px——刘海机型被系统 UI 压住（系统约定，见 `docs/mobile-adaptation.md`）
- **拉手不可配**：内置箭头图标——需自定义时对 `.ai-dialogue-toggle` 做样式覆盖（类名为稳定锚点）
- **面板内再套浮层**：面板为 `body` 级 fixed 层，内部弹层 teleport 到 body 同级——层级由 z-index 管理（面板 z-index:10）

## 关联

- 对话主件：`AiDialogueGroup` / `AiDialogue`
- 移动端适配：`docs/mobile-adaptation.md`；hooks：`useAgentUiDensity` / `useKeyboardInset`（内部，见 `src/hooks/docs/README.md`）
