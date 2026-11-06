// 产品站共用的 VitePress 配置工厂，站点只传差异项。
import { getAnalyticsScriptAttrs, readSiteConfig } from "./analytics.mjs";

/** 页面的正式地址：index.md 对应目录，其余 .md 换成 .html，非 ASCII 字符按 URL 编码 */
const pageUrl = (origin, base, relativePath) =>
  `${origin}${encodeURI(`${base}${relativePath.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, ".html")}`)}`;

/** 每页的 canonical 与 Open Graph 元信息 */
const seoHead =
  ({ origin, base, siteTitle }) =>
  ({ pageData, title, description }) => {
    const url = pageUrl(origin, base, pageData.relativePath);
    return [
      ["link", { rel: "canonical", href: url }],
      ["meta", { property: "og:type", content: "website" }],
      ["meta", { property: "og:site_name", content: siteTitle }],
      ["meta", { property: "og:title", content: title }],
      ["meta", { property: "og:description", content: description }],
      ["meta", { property: "og:url", content: url }],
    ];
  };

export const defineSite = ({ base, title, description, themeConfig = {} }) => {
  const config = readSiteConfig();
  const attrs = getAnalyticsScriptAttrs(config);
  return {
    base,
    title,
    description,
    lang: "zh-CN",
    outDir: "dist",
    head: attrs ? [["script", attrs]] : [],
    transformHead: seoHead({ origin: config.origin, base, siteTitle: title }),
    themeConfig: {
      outline: { label: "本页目录" },
      docFooter: { prev: "上一页", next: "下一页" },
      ...themeConfig,
    },
  };
};
