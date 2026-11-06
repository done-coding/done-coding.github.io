# Core：配置化前端框架

`@done-coding/admin-core` 提供 Vue 3 表单、列表、表格、弹窗、布局与 bridge。组件读取配置对象渲染界面，可用于管理台，也可用于 AI 应用、创作台等终端产品。

## 安装

```bash
pnpm add @done-coding/admin-core
```

入口显式引入样式：

```ts
import "@done-coding/admin-core/style.css";
```

消费项目还需安装 package.json 声明的 peer dependencies，包括 Vue、Vue Router、Pinia 与 Element Plus。认证、业务接口和路由由应用提供，库通过 bridge 接入。

## 从哪里开始

| 要做的事                   | 文档                                                       |
| -------------------------- | ---------------------------------------------------------- |
| 配置框架与接入应用         | [Bridge](./src/bridge/README.md)                           |
| 录入、校验与嵌套表单       | 表单            |
| 配置表格与操作列           | 表格           |
| 搜索、列表与详情组合       | 列表布局 |
| Panel退役与迁移         | [迁移说明](./panel-retired.md)           |
| 组织页面与可选应用布局     | 应用布局  |
| 复用激活态、尺寸观测等逻辑 | [Hooks](./src/hooks/README.md)                             |

配置对象的字段、组件 props、事件和插槽以各组件文档的 API 为准。先从单个组件族接入，再按应用需要组合布局与主题。
