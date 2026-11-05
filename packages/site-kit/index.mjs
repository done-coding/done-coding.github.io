// 产品站共用的 VitePress 配置工厂，站点只传差异项。
import { getAnalyticsScriptAttrs } from "./analytics.mjs";

export const defineSite = ({ base, title, description, themeConfig = {} }) => {
  const attrs = getAnalyticsScriptAttrs();
  return {
    base,
    title,
    description,
    lang: "zh-CN",
    outDir: "dist",
    head: attrs ? [["script", attrs]] : [],
    themeConfig: {
      outline: { label: "本页目录" },
      docFooter: { prev: "上一页", next: "下一页" },
      ...themeConfig,
    },
  };
};
