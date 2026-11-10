# AiConfigProvider（对话根容器）

> 对话组件的根容器：[MUST] 包裹对话组件——两件事：① 主题变量挂值（`useAiModuleTheme`，`--dc-agent-*` 三级 fallback 链）；② expose 通道 provide（`useAiExposeProvide`，会话 expose 的全局出口）。透传渲染默认插槽，零视觉。

## 定位

- **对话场景必包根**：AiDialogue / AiDialogueGroup / AiMessageList / AiSender 的对话场景 [MUST] 放其内——主题变量 + expose 通道二者缺一对话组件即不完整
- **何时不用**：无对话组件的普通 UI 区域不需要；`isDarkTheme` 由宿主页面持有（与 app 亮暗态联动）
- 内部实现（不导出）：`useAiModuleTheme(getIsDark)` / `useAiExposeProvide()`

## 快速上手（最小可用）

```html
<AiConfigProvider :is-dark-theme="isDark">
  <AiDialogue userName="demo-user" />
</AiConfigProvider>
```

**要点**：

- `isDarkTheme` 与宿主亮暗态联动（如 App 的 `isDark` ref）；组件内无自管暗色状态
- 主题变量域 `--dc-agent-*`：值 = `var(--dc-core-*, var(--el-*, 默认))`——宿主已接入 admin-core 主题时随风格 + 亮暗自适配；未接入时退 element-plus 色系（默认亮色兜底）
- expose 通道：provide 后任意后代 `useAiExposeInject().aiExpose` 可取（sender/bubbleList/ask/sessionOperate/sessionExposeMap）——如外部「快捷提问」按钮调 `aiExpose.ask({ value })`

## 能力边界 / 按需使用

- **`isDarkTheme` 响应式**：随 app 亮暗切换即重挂主题（内部 watch）——消费方持有亮暗态即可，无需其它配置
- **多实例并存**：expose 通道每 Provider 独立 provide——多对话模块隔离场景可各自包 Provider（共享同一 Provider 时 expose 为全局单份）
- **主题细节**：`--dc-agent-*` 全量 token 与默认值见 `src/hooks/theme.ts`（`AGENT_UI_DENSITY_TOKENS` + DEFAULTS 真相表）；消费方覆盖走同名前缀 CSS 变量
- **完整能力演示**：`demo-src/demos/ConfigDemo.vue`——能力展示，非推荐默认

## API

> ⚠️ 以组件源码为真相源；与文档冲突时以源码为准。

### Props

| name | type | 默认 | 语义 |
| --- | --- | --- | --- |
| `isDarkTheme` | `boolean`（必填） | — | 亮暗主题开关（驱动 `--dc-agent-*` 暗色派生） |

### Emits

无

### Slots

| 槽 | scope | 语义 |
| --- | --- | --- |
| `default` | — | 对话组件内容（透传渲染） |

### Expose

`defineExpose`（0.3.0 起）——供 **provider 子树外**的宿主调用（子树内仍用 `useAiExposeInject`）：

| 成员 | 签名 | 语义 |
| --- | --- | --- |
| `ask` | `(params: AiAskParams) => Promise<AiSessionBaseSimpleInfo> \| undefined` | 向**当前激活会话**发一条消息：`{ value?: string; parts?: AiMessagePart[] }`，两者至少给一个（纯 `parts` = 以用户名义发数据卡） |
| `sender` | `() => AiSenderExpose \| undefined` | 当前会话输入框（focus / blur …） |
| `sessionOperate` | `() => AiSessionOperateExpose \| undefined` | 会话级操作（`create` / `switch`，由 AiDialogueGroup 注册） |

```vue
<AiConfigProvider ref="aiRef" :is-dark-theme="isDark">
  <AiDialogue userName="u" sseUrl="/api/chat" />
</AiConfigProvider>
```

```ts
const aiRef = ref<InstanceType<typeof AiConfigProvider>>();
// 宿主页面任意位置（无需在 provider 子树内）
aiRef.value?.ask({ value: "帮我分析这张表" });

// 以**用户名义**发一张结构化数据卡（列表页「问问助手」的终态形态）：
aiRef.value?.ask({
  parts: [{ type: "data-task-ref", data: { id: 42, name: "日结工作流" } }],
});
```

**为什么需要它**：`useAiExposeInject` 是 inject，只能在本组件**子树内**调用。而典型场景是「AI 面板在侧栏、触发按钮在主内容区」——按钮不在子树内。此前只能塞一个隐藏探针组件把 `ask` 捞出来（`demo-src/demos/ExposeProbe.vue` 即该 workaround），属每个下游各自发明一遍轮子。

## 反模式 / 注意

- **[MUST NOT] 在本组件外层再自建 provider**：本组件自身已调 `useAiExposeProvide()`，外层那个会被内层**遮蔽**——注册表恒空、`ask` 恒 undefined、两个 provider 静默共存。检测到重复自持时 `useAiExposeProvide` 会 `console.warn`（无 DEV 门控，发布产物同样可见）。子树外取 `ask` 走本组件的 `defineExpose`，[MUST NOT] 自己再 provide 一遍。
- **漏包 AiConfigProvider**：主题走默认兜底（视觉可用但脱离宿主主题）+ expose 通道缺失（`useAiExposeInject` 取到 undefined、`useSessionOperateMount` 会抛「未获取到上级注入」错误）
- **isDarkTheme 写死**：亮暗不跟随 app 切换——与 app 亮暗态同源持有
- **改 `--dc-agent-*` 变量**：走消费方覆盖（同前缀 CSS 变量），[MUST NOT] 改 theme.ts 默认真相表（发布面）

## 关联

- 主题机制：`useAiModuleTheme`（`src/hooks/theme.ts`，含 token 真相表）
- expose 通道：`useAiExposeProvide` / `useAiExposeInject` / `useAiSessionInject`（`src/hooks/expose.ts`）
- 消费方接入总览：包级 README「快速开始」
