# hooks 模块

对话全流程组合函数：expose 通道 / 气泡与会话状态机（内存 + IndexedDB）/ 输入全流程 / SSE（OpenAI 传输层 + 转换器）/ 主题 / 移动端密度。公开件全部经顶层 barrel 导出。

> 详情见 [docs/README.md](./docs/README.md)（hook 清单表 + expose 通道范式 + SSE 协议契约）

`useCodeXSlot` 的代码头插槽类型从 `vue-element-plus-x` 公开 `XMarkdown` 的 `codeXSlot` prop 提取；保持原七个可选头部插槽字段，不把上游内部文件路径泄露到公开返回类型。
