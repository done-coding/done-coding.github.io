// 静态站点的构建：复制 public/ 到 dist/，注入统计脚本和 canonical、Open Graph 元信息，并按统计开关选择内容块。
// 门户发布在站根，页面地址就是 origin 加相对 dist/ 的路径。
import {
  cpSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  getAnalyticsScriptAttrs,
  readSiteConfig,
} from "../packages/site-kit/analytics.mjs";
import { isNoindex, pageUrl, sitePath } from "./site-pages.mjs";

const config = readSiteConfig();
const attrs = getAnalyticsScriptAttrs(config);

const escapeAttr = (value) =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

const scriptTag =
  attrs &&
  `<script defer src="${escapeAttr(attrs.src)}" data-website-id="${escapeAttr(attrs["data-website-id"])}"></script>`;

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return htmlFiles(path);
    }
    return path.endsWith(".html") ? [path] : [];
  });

/** 标记为 noindex 的页面（如 404）不加；其余页面必须有 title 和 description */
const seoTags = (file, html) => {
  if (isNoindex(html)) {
    return [];
  }
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1].trim();
  const description = html.match(
    /<meta\s+name="description"\s+content="([^"]+)"/,
  )?.[1];
  if (!title || !description) {
    throw new Error(`${file} 缺少 <title> 或 <meta name="description">`);
  }
  const url = escapeAttr(pageUrl(config.origin, sitePath("dist", file)));
  return [
    `<link rel="canonical" href="${url}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="done-coding" />',
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
  ];
};

/** 保留当前开关对应的内容块，删除另一块 */
const selectBlocks = (html) =>
  html
    .replace(
      attrs
        ? /[ \t]*<!-- analytics:off -->[\s\S]*?<!-- \/analytics:off -->\n?/g
        : /[ \t]*<!-- analytics:on -->[\s\S]*?<!-- \/analytics:on -->\n?/g,
      "",
    )
    .replace(/[ \t]*<!-- \/?analytics:(?:on|off) -->\n?/g, "");

rmSync("dist", { recursive: true, force: true });
cpSync("public", "dist", { recursive: true });

for (const file of htmlFiles("dist")) {
  const html = selectBlocks(readFileSync(file, "utf8"));
  const tags = [...seoTags(file, html), ...(scriptTag ? [scriptTag] : [])];
  if (tags.length > 0 && !html.includes("</head>")) {
    throw new Error(`${file} 没有 </head>，无法注入元信息`);
  }
  writeFileSync(
    file,
    html.replace(
      /([ \t]*)<\/head>/,
      (_, indent) =>
        `${tags.map((tag) => `${indent}  ${tag}\n`).join("")}${indent}</head>`,
    ),
  );
}
