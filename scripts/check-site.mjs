// 发布前检查：每个 app 都有首页，站内链接都指向真实文件，产物不含 source map。
// 用法：node scripts/check-site.mjs [被检目录，默认 dist]
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { readSiteConfig } from "../packages/site-kit/analytics.mjs";

const { apps } = readSiteConfig();
const root = resolve(process.argv[2] ?? "dist");
const problems = [];

const allFiles = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? allFiles(path) : [path];
  });

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

if (!existsSync(root)) {
  console.error(`被检目录不存在：${root}`);
  process.exit(1);
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
  const text = readFileSync(file, "utf8");
  if (/(?:\/\/|\/\*)[#@]\s*sourceMappingURL=/.test(text)) {
    problems.push(`${relative(root, file)} 含 sourceMappingURL 注释`);
  }
  if (file.endsWith(".html")) {
    // 内联脚本和注释里的字符串不是真实链接
    const markup = text.replace(
      /<script\b[^>]*>[\s\S]*?<\/script>|<!--[\s\S]*?-->/g,
      (block) => block.match(/^<script\b[^>]*>/)?.[0] ?? "",
    );
    for (const [, , href] of markup.matchAll(
      /\s(?:href|src)\s*=\s*(["'])(.*?)\1/g,
    )) {
      checkLink(file, href);
    }
  }
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`站点检查通过：${apps.length} 个 app`);
