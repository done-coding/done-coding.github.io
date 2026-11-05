// 发布前检查：每个 app 都有首页，站内链接都指向真实文件。
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const { apps } = JSON.parse(readFileSync("site.config.json", "utf8"));
const problems = [];

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return path.endsWith(".html") ? [path] : [];
  });

for (const { name, base } of apps)
  if (!existsSync(join("dist", base, "index.html")))
    problems.push(`${name} 缺少首页：${base}index.html`);

for (const file of htmlFiles("dist")) {
  for (const [, href] of readFileSync(file, "utf8").matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    const target = join("dist", href);
    const found =
      existsSync(target) &&
      (!statSync(target).isDirectory() || existsSync(join(target, "index.html")));
    if (!found) problems.push(`${file} 的链接不存在：${href}`);
  }
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`站点检查通过：${apps.length} 个 app`);
