# Agent：AI 对话组件

`@done-coding/forge-kit-agent` 提供 Vue 3 AI 对话界面：受控消息列表、输入框、完整会话与悬浮面板。消息渲染、流式展示与会话交互由组件处理，模型端点、业务数据转换和工具执行由应用提供。

## 安装

```bash
pnpm add @done-coding/forge-kit-agent
```

```ts
import "@done-coding/forge-kit-agent/style.css";
```

消费项目需安装 Vue、Element Plus、Element Plus Icons 与 Lodash 等 peer dependencies。

## 最小展示

```vue
<script setup lang="ts">
import {
  AiConfigProvider,
  AiMessageList,
  type AiMessage,
} from "@done-coding/forge-kit-agent";

const messages: AiMessage[] = [
  { id: "greeting", role: "assistant", content: "你好，欢迎体验对话组件。" },
];
</script>

<template>
  <AiConfigProvider :is-dark-theme="false">
    <AiMessageList :messages="messages" />
  </AiConfigProvider>
</template>
```

`AiConfigProvider` 提供主题与组件间的 expose 通道。受控列表可以直接展示静态消息；需要完整会话时，使用 `AiDialogue` 并显式提供 `userName` 和 SSE 端点。库不提供模型服务，也不在浏览器内置真实凭据。

| 能力                     | 文档                                          |
| ------------------------ | --------------------------------------------- |
| 单会话、多会话与消息展示 | [对话](./src/components/dialogue/README.md)   |
| 受控输入与附件交互       | [输入框](./src/components/sender/README.md)   |
| 配置与主题通道           | [配置容器](./src/components/config/README.md) |
| SSE、会话与通道组合函数  | [Hooks](./src/hooks/README.md)                |
