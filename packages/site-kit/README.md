# @done-coding/site-kit

产品站共用的站点基础：VitePress 配置工厂、主题和统计脚本读取。站点只传差异项，不复制这里的代码。

## 用法

```js
// apps/<产品>-site/.vitepress/config.mjs
import { defineProductSite } from "@done-coding/site-kit/product";

export default defineProductSite({
  configUrl: import.meta.url,
  base: "/<产品>/",
  title: "<产品>",
  tagline: "<一句话，只写可核实的事实>",
});
```

```js
// apps/<产品>-site/.vitepress/theme/index.mjs
export { default } from "@done-coding/site-kit/theme";
```

`defineProductSite` 读 `content/` 下的内容产物，校验后生成 `.generated/` 源目录（不进仓）：`current.json` 指向的版本首页在 `<base>`，文档在 `<base>docs/`，演示原样发布到 `<base>demo/`；其余版本目录在 `<base>v/<版本>/`，导航出现版本切换，演示只在不引用 `<base>demo/` 绝对路径时随版本发布。有内容时启用 VitePress 本地搜索，只索引当前版本。缺 `current.json` 时首页显示「文档建设中」，任一版本不合契约时构建失败并说明原因。

`defineSite` 给每页生成 canonical 与 Open Graph，地址取 `site.config.json` 的 `origin`。

本地搜索用 VitePress 自带的 minisearch，按空格和标点分词：中文正文是连续字符，只能按词首匹配，标题和以搜索词开头的分句（以标点分隔）能搜到，分句中间的词搜不到。

## 为什么选 VitePress

- 内容产物的正文是 Markdown，VitePress 直接渲染，不用转换。
- 输出静态文件，支持 `base` 路径，符合每个产品一个 URL 路径的发布方式。
- 基于 Vue，需要在文档里使用 forge 组件时可以直接引入。
- 自带导航、侧栏和本地主题，外壳代码量小。
- MIT 许可证。

`smoke/` 是最小冒烟站点，`fixtures/` 是内容产物样例，都只由 `scripts/test-site.mjs` 使用，不发布。
