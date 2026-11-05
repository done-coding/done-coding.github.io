// 静态站点的构建：复制 public/ 到 dist/，注入统计脚本，并按统计开关选择内容块。
import {
  cpSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { getAnalyticsScriptAttrs } from "../packages/site-kit/analytics.mjs";

const attrs = getAnalyticsScriptAttrs();

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
  if (scriptTag && !html.includes("</head>")) {
    throw new Error(`${file} 没有 </head>，无法注入统计脚本`);
  }
  writeFileSync(
    file,
    scriptTag ? html.replace("</head>", `  ${scriptTag}\n  </head>`) : html,
  );
}
