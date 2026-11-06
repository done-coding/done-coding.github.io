// 拼装后的站点页面：拼装生成 sitemap 和站点检查共用。
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export const allFiles = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? allFiles(path) : [path];
  });

/** 相对站根、以 / 分隔的路径 */
export const sitePath = (root, file) =>
  relative(root, file).split(sep).join("/");

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * 演示是产品仓独立构建的静态应用（当前版本在 <base>demo/，历史版本在 <base>v/<版本>/demo/），
 * 其 HTML 只是应用外壳，不按文档页要求检查，也不进 sitemap。
 */
export const demoMatcher = (apps) => {
  const pattern = new RegExp(
    `^(?:${apps
      .map(({ base }) => escapeRegExp(base.slice(1)))
      .join("|")})(?:v/[^/]+/)?demo/`,
  );
  return (path) => pattern.test(path);
};

export const isNoindex = (html) =>
  /<meta\s+name="robots"\s+content="[^"]*noindex/.test(html);

/** 应被搜索引擎收录的页面：除演示、404 和 noindex 页面外的全部 HTML */
export const indexablePages = (root, apps) => {
  const isDemo = demoMatcher(apps);
  return allFiles(root)
    .map((file) => sitePath(root, file))
    .filter(
      (path) =>
        path.endsWith(".html") &&
        !isDemo(path) &&
        !/(?:^|\/)404\.html$/.test(path) &&
        !isNoindex(readFileSync(join(root, path), "utf8")),
    )
    .sort();
};

/** sitemap.xml 正文 */
export const renderSitemap = (origin, paths) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .map((path) => `  <url><loc>${pageUrl(origin, path)}</loc></url>\n`)
    .join("")}</urlset>\n`;

/** 页面的正式地址：index.html 对应目录，非 ASCII 字符按 URL 编码 */
export const pageUrl = (origin, path) =>
  `${origin}/${encodeURI(path.replace(/(^|\/)index\.html$/, "$1"))}`;
