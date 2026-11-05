// 按 site.config.json 把各 app 的 dist/ 拼到根 dist/ 对应路径，供 GitHub Pages 发布。
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const { apps } = JSON.parse(readFileSync("site.config.json", "utf8"));

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
for (const { name, dir, base } of apps) {
  const source = join(dir, "dist");
  if (!existsSync(source)) {
    throw new Error(`${name} 没有构建产物：${source}`);
  }
  cpSync(source, join("dist", base), { recursive: true });
}
writeFileSync("dist/.nojekyll", "");
