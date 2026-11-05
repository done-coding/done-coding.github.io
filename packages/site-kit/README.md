# @done-coding/site-kit

产品站共用的站点基础：VitePress 配置工厂、主题和统计脚本读取。站点只传差异项，不复制这里的代码。

## 用法

```js
// apps/<产品>-site/.vitepress/config.mjs
import { defineSite } from "@done-coding/site-kit";

export default defineSite({ base: "/<产品>/", title: "<产品>" });
```

```js
// apps/<产品>-site/.vitepress/theme/index.mjs
export { default } from "@done-coding/site-kit/theme";
```

## 为什么选 VitePress

- 内容产物的正文是 Markdown，VitePress 直接渲染，不用转换。
- 输出静态文件，支持 `base` 路径，符合每个产品一个 URL 路径的发布方式。
- 基于 Vue，需要在文档里使用 forge 组件时可以直接引入。
- 自带导航、侧栏和本地主题，外壳代码量小。
- MIT 许可证。

`smoke/` 是最小冒烟站点，由 `scripts/test-site.mjs` 构建到临时目录，不发布。
