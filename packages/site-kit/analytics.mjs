// 站点配置和统计脚本的唯一读取入口，静态构建和 VitePress 共用。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const defaultConfigPath = fileURLToPath(
  new URL("../../site.config.json", import.meta.url),
);

/** 读取站点配置；SITE_CONFIG_PATH 仅供测试指向临时配置。 */
export const readSiteConfig = () =>
  JSON.parse(
    readFileSync(process.env.SITE_CONFIG_PATH || defaultConfigPath, "utf8"),
  );

/** websiteId 为 null 时返回 null，表示不加载统计脚本。 */
export const getAnalyticsScriptAttrs = ({ analytics } = readSiteConfig()) => {
  const { websiteId, trackerUrl } = analytics ?? {};
  if (websiteId === null || websiteId === undefined) {
    return null;
  }
  if (typeof websiteId !== "string" || websiteId.trim() === "") {
    throw new Error(
      `site.config.json 的 analytics.websiteId 必须是 null 或非空字符串，实际为：${JSON.stringify(websiteId)}`,
    );
  }
  if (typeof trackerUrl !== "string" || !trackerUrl.startsWith("https://")) {
    throw new Error(
      `site.config.json 的 analytics.trackerUrl 必须是 https 地址，实际为：${JSON.stringify(trackerUrl)}`,
    );
  }
  return { defer: "", src: trackerUrl, "data-website-id": websiteId };
};
