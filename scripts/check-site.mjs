// 发布前检查：每个 app 都有首页，站内链接都指向真实文件，产物不含 source map；
// 页面有 SEO 元信息并列入 sitemap；可机械判断的无障碍问题和体积预算。演示是产品仓的独立应用，只查链接与 source map。
// 用法：node scripts/check-site.mjs [被检目录，默认 dist]
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { readSiteConfig } from "../packages/site-kit/analytics.mjs";
import {
  allFiles,
  demoMatcher,
  indexablePages,
  pageUrl,
  sitePath,
} from "./site-pages.mjs";

const { origin, apps, budgets } = readSiteConfig();
const root = resolve(process.argv[2] ?? "dist");
const problems = [];
const isDemo = demoMatcher(apps);

/** 文件、含 index.html 的目录、补 .html 后存在（干净 URL）都算存在 */
const linkTargetExists = (target) => {
  if (existsSync(target)) {
    return (
      !statSync(target).isDirectory() || existsSync(join(target, "index.html"))
    );
  }
  return existsSync(`${target}.html`);
};

const checkLink = (file, href) => {
  // 带协议的外链、协议相对地址和纯锚点不属于站内文件
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) {
    return;
  }
  const pathname = href.replace(/[?#].*$/, "");
  if (pathname === "") {
    return;
  }
  let decoded;
  try {
    decoded = decodeURI(pathname);
  } catch {
    problems.push(`${relative(root, file)} 的链接无法解码：${href}`);
    return;
  }
  const target = decoded.startsWith("/")
    ? join(root, decoded)
    : resolve(dirname(file), decoded);
  if (target !== root && !target.startsWith(root + sep)) {
    problems.push(`${relative(root, file)} 的链接越出站点目录：${href}`);
  } else if (!linkTargetExists(target)) {
    problems.push(`${relative(root, file)} 的链接不存在：${href}`);
  }
};

/** 内联脚本和注释里的字符串不是真实标签，只保留 <script> 开始标签（其 src 是真实链接） */
const stripScripts = (html) =>
  html.replace(
    /<script\b[^>]*>[\s\S]*?<\/script>|<!--[\s\S]*?-->/g,
    (block) => block.match(/^<script\b[^>]*>/)?.[0] ?? "",
  );

/** 取出某类标签的属性表，如 tagAttrs(html, "meta") */
const tagAttrs = (html, name) =>
  [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, "gi"))].map(([, raw]) =>
    Object.fromEntries(
      [...raw.matchAll(/([\w:-]+)(?:\s*=\s*(["'])(.*?)\2)?/g)].map(
        ([, key, , value]) => [key.toLowerCase(), value ?? ""],
      ),
    ),
  );

const checkSeo = (path, html) => {
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1].trim();
  const metas = tagAttrs(html, "meta");
  const meta = (key, value) =>
    metas.find((attrs) => attrs[key] === value)?.content;
  const canonical = tagAttrs(html, "link").find(
    (attrs) => attrs.rel === "canonical",
  )?.href;
  const expected = pageUrl(origin, path);
  if (!title) {
    problems.push(`${path} 缺少 <title>`);
  }
  if (!meta("name", "description")) {
    problems.push(`${path} 缺少 meta description`);
  }
  if (canonical !== expected) {
    problems.push(
      `${path} 的 canonical 应为 ${expected}，实际为 ${canonical ?? "无"}`,
    );
  }
  for (const property of ["og:title", "og:description"]) {
    if (!meta("property", property)) {
      problems.push(`${path} 缺少 ${property}`);
    }
  }
  if (meta("property", "og:url") !== expected) {
    problems.push(`${path} 的 og:url 应为 ${expected}`);
  }
};

const checkA11y = (path, markup) => {
  if (!/<html\b[^>]*\slang=["'][^"']+["']/i.test(markup)) {
    problems.push(`${path} 的 <html> 缺少 lang`);
  }
  for (const attrs of tagAttrs(markup, "img")) {
    if (!("alt" in attrs)) {
      problems.push(`${path} 有图片缺少 alt：${attrs.src ?? ""}`);
    }
  }
  // 标题可以回到任意上级，但向下只能逐级深入
  let previous = 0;
  for (const [, level] of markup.matchAll(/<h([1-6])\b/gi)) {
    const current = Number(level);
    if (previous > 0 && current > previous + 1) {
      problems.push(`${path} 的标题从 h${previous} 跳到 h${current}`);
    }
    previous = current;
  }
};

// VitePress 本地搜索索引只在打开搜索时按需加载，单列预算，不占普通脚本的 assetKB
const isSearchIndex = (path) =>
  /(?:^|\/)@localSearchIndex[^/]*\.js$/.test(path);
const searchIndexes = [];
if (!(budgets.searchIndexKB > 0)) {
  problems.push("site.config.json 的 budgets.searchIndexKB 必须是正数");
}

const checkBudget = (path, file) => {
  const sizeKB = statSync(file).size / 1024;
  if (isSearchIndex(path)) {
    searchIndexes.push(
      `${path} ${Math.ceil(sizeKB)} KB，预算 ${budgets.searchIndexKB} KB`,
    );
    if (sizeKB > budgets.searchIndexKB) {
      problems.push(
        `${path} 体积 ${Math.ceil(sizeKB)} KB，超过搜索索引预算 ${budgets.searchIndexKB} KB`,
      );
    }
    return;
  }
  const limitKB = path.endsWith(".html")
    ? budgets.pageKB
    : /\.(?:js|mjs|cjs|css)$/.test(path)
      ? budgets.assetKB
      : null;
  if (limitKB !== null && sizeKB > limitKB) {
    problems.push(
      `${path} 体积 ${Math.ceil(sizeKB)} KB，超过预算 ${limitKB} KB`,
    );
  }
};

if (!existsSync(root)) {
  console.error(`被检目录不存在：${root}`);
  process.exit(1);
}

for (const name of ["sitemap.xml", "robots.txt"]) {
  if (!existsSync(join(root, name))) {
    problems.push(`缺少站根 ${name}`);
  }
}
if (existsSync(join(root, "robots.txt"))) {
  if (
    !readFileSync(join(root, "robots.txt"), "utf8").includes(
      `Sitemap: ${origin}/sitemap.xml`,
    )
  ) {
    problems.push("robots.txt 没有指向 sitemap.xml");
  }
}
const indexable = indexablePages(root, apps);
if (existsSync(join(root, "sitemap.xml"))) {
  const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
  for (const path of indexable) {
    if (!sitemap.includes(`<loc>${pageUrl(origin, path)}</loc>`)) {
      problems.push(`sitemap.xml 未列出 ${path}`);
    }
  }
}
for (const path of indexable) {
  checkSeo(path, stripScripts(readFileSync(join(root, path), "utf8")));
}

for (const { name, base } of apps) {
  if (!existsSync(join(root, base, "index.html"))) {
    problems.push(`${name} 缺少首页：${base}index.html`);
  }
}

for (const file of allFiles(root)) {
  if (file.endsWith(".map")) {
    problems.push(`${relative(root, file)} 是 source map，产物不得包含`);
    continue;
  }
  if (!/\.(?:html|js|mjs|cjs|css)$/.test(file)) {
    continue;
  }
  const path = sitePath(root, file);
  if (!isDemo(path)) {
    checkBudget(path, file);
  }
  const text = readFileSync(file, "utf8");
  if (/(?:\/\/|\/\*)[#@]\s*sourceMappingURL=/.test(text)) {
    problems.push(`${relative(root, file)} 含 sourceMappingURL 注释`);
  }
  if (file.endsWith(".html")) {
    const markup = stripScripts(text);
    for (const [, , href] of markup.matchAll(
      /\s(?:href|src)\s*=\s*(["'])(.*?)\1/g,
    )) {
      checkLink(file, href);
    }
    if (!isDemo(path)) {
      checkA11y(path, markup);
    }
  }
}

if (searchIndexes.length > 0) {
  console.log(`搜索索引体积：\n${searchIndexes.join("\n")}`);
}
if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`站点检查通过：${apps.length} 个 app`);
