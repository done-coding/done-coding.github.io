# AiSender（受控输入原语）

> 薄封装业界 `Sender`（vue-element-plus-x，Ant Design X 同族）的受控输入原语：受控 `v-model` 值 + Enter 发送 + loading / 禁用 / 清空 / 提交方式 + 自适应高。业务工具条经 4 个插槽注入，平台不持业务语义。
> 范式页：`demo-src/demos/MessageListDemo.vue`（与 AiMessageList 配对）

## 定位

- **受控路径输入原语**：与 `AiMessageList` 配对成完整受控对话（消费方持消息 + 提交逻辑）
- **何时不用**：自管全流程用 `AiDialogue`（内部已装配 Sender）；纯业务按钮 / 工具条是插槽内容，不是本组件职责
- 通用行为（受控值 / Enter 发送 / loading / 自适应高 / 发送钮）由库 `Sender` 承担；平台只透传 props/emits + 4 插槽

## 快速上手（最小可用）

```html
<AiSender v-model="input" :loading="loading" @submit="handleSubmit" />
```

```ts
const input = ref("");
const loading = ref(false);
const handleSubmit = (value: string) => {
  // 发送 value（Enter 或点发送钮触发）
  loading.value = true;
  // ... 提交逻辑；完成后 loading.value = false
};
```

**要点**：

- `v-model` 为受控输入值；`@submit` 透出当前文本（Enter / 发送钮）；`@cancel` = loading 态点钮中止
- 默认 `submitType:"enter"`（Enter 发送、Shift+Enter 换行）、`variant:"updown"`（输入在上、操作区在下）
- 发送中 `loading` 会禁用输入 + 转圈；`submitBtnDisabled` 可独立禁用发送钮（如空文本时禁发不禁输）

## 能力边界 / 按需使用

- **`submitType`**：默认 `enter` 即够用；`shiftEnter` / `cmdOrCtrlEnter` / `altEnter` 按产品习惯切换
- **`variant`**：默认 `updown`；`default` 变体用于样式差异场景
- **`autoSize`**：不传用库默认自适应；传 `{ minRows, maxRows }` 定制行数
- **4 个业务插槽**（`#header` / `#prefix` / `#action-list` / `#footer`）：默认不用；业务工具条（路由选择、附加动作、发送快捷项）经插槽注入。
  > `AiDialogue` **不使用**这些插槽放业务控件（0.3.0 起输入区只有输入框）；要在输入区放东西请自建外壳。
- **完整能力演示**：`demo-src/demos/MessageListDemo.vue`——能力展示，非推荐默认

## API

> ⚠️ API 以 types.ts（`AiSenderProps`）与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name | type | 默认 | 语义 |
| --- | --- | --- | --- |
| `placeholder` | `string?` | `""` | 占位提示 |
| `loading` | `boolean?` | `false` | 发送中（输入禁用 + 转圈） |
| `disabled` | `boolean?` | `false` | 禁用整个输入 |
| `readOnly` | `boolean?` | `false` | 只读（可见不可编辑） |
| `clearable` | `boolean?` | `false` | 可一键清空 |
| `submitBtnDisabled` | `boolean?` | `false` | 提交钮独立禁用（与 disabled 解耦） |
| `submitType` | `AiSenderSubmitType?` | `"enter"` | 提交方式 |
| `variant` | `"default"\|"updown"?` | `"updown"` | 变体（updown = 输入在上、操作区在下） |
| `autoSize` | `{ minRows: number; maxRows: number }?` | 库默认 | textarea 自适应行数 |

**v-model**：`string`（受控输入值）

### Emits

| 事件 | 参数 | 语义 |
| --- | --- | --- |
| `submit` | `value: string` | 提交（Enter 或发送钮），透出当前文本 |
| `cancel` | `value: string` | loading 态点钮中止，透出当前文本 |

### Slots

| 槽 | scope | 语义 |
| --- | --- | --- |
| `#header` | — | 输入区上方（如空态欢迎语 / 快捷问题） |
| `#prefix` | — | 输入行左侧（业务工具条） |
| `#action-list` | — | 动作列表（操作区按钮组） |
| `#footer` | — | 输入区下方 |

### Expose

无（Sender 库 expose 未透出）

## 反模式 / 注意

- **自管 loading 与自动 loading 混淆**：本组件为受控原语，`loading` 由消费方持有（对比 core `ActionBtn` 的自动 loading）——提交逻辑在消费方，需手动维护 loading
- **`submitBtnDisabled` vs `disabled`**：独立语义——空文本时禁发不禁输用 `submitBtnDisabled`，整体禁用用 `disabled`
- **插槽内容业务语义**：平台不持插槽语义——经插槽注入的业务工具条交互由消费方自管（含焦点抢占等——插槽内容在 `el-sender` 内，点击会冒泡到容器抢焦点，通常需 `@click.stop`）

## 关联

- 受控展示配对：`AiMessageList`
- 全流程对照：`AiDialogue`（内部装配 MentionSender = Sender 超集）
- 类型：`AiSenderProps` / `AiSenderSubmitType`（types.ts 真相源）
