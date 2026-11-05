// 读取并校验产品仓导出的内容产物，契约见仓根 AGENTS.md。
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const VERSION_PATTERN = /^[\dA-Za-z][\dA-Za-z.+-]*$/;

const isDirectory = (path) => existsSync(path) && statSync(path).isDirectory();

const fail = (path, reason) => {
  throw new Error(`内容产物格式错误（${path}）：${reason}`);
};

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    return fail(path, `不是合法 JSON，${error.message}`);
  }
};

const hasMarkdown = (dir) =>
  readdirSync(dir).some((entry) => {
    const path = join(dir, entry);
    return isDirectory(path) ? hasMarkdown(path) : entry.endsWith(".md");
  });

/** nav.json 的 link 相对 docs/，可省略 .md，目录链接以 / 结尾 */
const linkFileExists = (docsDir, link) => {
  const pathname = link.replace(/#.*$/, "");
  if (pathname.endsWith("/")) {
    return existsSync(join(docsDir, pathname, "index.md"));
  }
  return existsSync(
    join(docsDir, pathname.endsWith(".md") ? pathname : `${pathname}.md`),
  );
};

const validateNav = (items, { navPath, docsDir }, trail = "") => {
  if (!Array.isArray(items) || items.length === 0) {
    fail(navPath, `${trail || "顶层"} 必须是非空数组`);
  }
  items.forEach((item, index) => {
    const at = `${trail}[${index}]`;
    if (item === null || typeof item !== "object") {
      fail(navPath, `${at} 必须是对象`);
    }
    if (typeof item.text !== "string" || item.text === "") {
      fail(navPath, `${at}.text 必须是非空字符串`);
    }
    if (item.link === undefined && item.items === undefined) {
      fail(navPath, `${at} 至少要有 link 或 items`);
    }
    if (item.link !== undefined) {
      if (
        typeof item.link !== "string" ||
        /^(?:[a-z][a-z\d+.-]*:|\/)/i.test(item.link) ||
        item.link.split("/").includes("..")
      ) {
        fail(
          navPath,
          `${at}.link 必须是相对 docs/ 的路径：${JSON.stringify(item.link)}`,
        );
      }
      if (!linkFileExists(docsDir, item.link)) {
        fail(navPath, `${at}.link 指向的文档不存在：${item.link}`);
      }
    }
    if (item.items !== undefined) {
      validateNav(item.items, { navPath, docsDir }, `${at}.items`);
    }
  });
};

/** 没有 current.json 返回 null，表示内容尚未到位；其余不合契约一律抛错。 */
export const loadContent = (contentRoot) => {
  const currentPath = join(contentRoot, "current.json");
  if (!existsSync(currentPath)) {
    return null;
  }
  const current = readJson(currentPath);
  if (current === null || typeof current !== "object") {
    fail(currentPath, "必须是对象");
  }
  const { version, source } = current;
  if (typeof version !== "string" || !VERSION_PATTERN.test(version)) {
    fail(currentPath, `version 不是合法版本号：${JSON.stringify(version)}`);
  }
  if (typeof source !== "string" || source === "") {
    fail(currentPath, "source 必须是非空字符串");
  }

  const versionDir = join(contentRoot, version);
  if (!isDirectory(versionDir)) {
    fail(versionDir, "current.json 指向的版本目录不存在");
  }
  const docsDir = join(versionDir, "docs");
  if (!isDirectory(docsDir) || !hasMarkdown(docsDir)) {
    fail(docsDir, "缺少 docs/ 目录或其中没有 Markdown 文档");
  }
  const navPath = join(versionDir, "nav.json");
  if (!existsSync(navPath)) {
    fail(navPath, "缺少 nav.json");
  }
  const nav = readJson(navPath);
  validateNav(nav, { navPath, docsDir });

  const demoDir = join(versionDir, "demo");
  if (existsSync(demoDir) && !existsSync(join(demoDir, "index.html"))) {
    fail(demoDir, "demo/ 存在但没有 index.html");
  }
  return {
    version,
    source,
    docsDir,
    nav,
    demoDir: existsSync(demoDir) ? demoDir : null,
  };
};
