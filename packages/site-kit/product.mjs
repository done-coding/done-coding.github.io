// 产品站的站点外壳：读内容产物，生成 VitePress 源目录、导航和首页，发布演示。
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "./content.mjs";
import { defineSite } from "./index.mjs";

const GENERATED_DIR = ".generated";

const toRoute = (link) => {
  const [pathname, hash] = link.split("#");
  const route = `/docs/${pathname.replace(/\.md$/, "")}`;
  return hash ? `${route}#${hash}` : route;
};

const toSidebar = (items) =>
  items.map(({ text, link, items: children }) => ({
    text,
    ...(link === undefined ? {} : { link: toRoute(link) }),
    ...(children === undefined ? {} : { items: toSidebar(children) }),
  }));

const firstRoute = (items) => {
  for (const { link, items: children } of items) {
    const route = link === undefined ? firstRoute(children) : toRoute(link);
    if (route) {
      return route;
    }
  }
  return null;
};

/** JSON 也是合法 YAML，省去手写 frontmatter 的转义 */
const homePage = (hero) =>
  `---\n${JSON.stringify({ layout: "home", hero }, null, 2)}\n---\n`;

/**
 * 站点配置工厂，由各产品站的 .vitepress/config.mjs 调用。
 * SITE_CONTENT_DIR 仅供测试指向夹具或反例，正式构建读站点自己的 content/。
 */
export const defineProductSite = ({ configUrl, base, title, tagline }) => {
  const siteRoot = fileURLToPath(new URL("..", configUrl));
  const content = loadContent(
    process.env.SITE_CONTENT_DIR || join(siteRoot, "content"),
  );
  const srcDir = join(siteRoot, GENERATED_DIR);
  rmSync(srcDir, { recursive: true, force: true });
  mkdirSync(srcDir, { recursive: true });

  const site = defineSite({ base, title, description: tagline });
  site.srcDir = GENERATED_DIR;

  if (!content) {
    writeFileSync(
      join(srcDir, "index.md"),
      homePage({ name: title, text: "文档建设中", tagline }),
    );
    return site;
  }

  cpSync(content.docsDir, join(srcDir, "docs"), { recursive: true });
  const docsRoute = firstRoute(content.nav);
  // 演示是独立构建的静态页，target 让 VitePress 路由放行
  const demoLink = { link: "/demo/", target: "_self" };
  writeFileSync(
    join(srcDir, "index.md"),
    homePage({
      name: title,
      text: tagline,
      tagline: `当前文档版本 ${content.version}`,
      actions: [
        { theme: "brand", text: "阅读文档", link: docsRoute },
        ...(content.demoDir
          ? [{ theme: "alt", text: "查看演示", ...demoLink }]
          : []),
      ],
    }),
  );
  site.themeConfig.nav = [
    { text: "文档", link: docsRoute, activeMatch: "^/docs/" },
    ...(content.demoDir ? [{ text: "演示", ...demoLink }] : []),
  ];
  site.themeConfig.sidebar = { "/docs/": toSidebar(content.nav) };
  if (content.demoDir) {
    site.buildEnd = ({ outDir }) => {
      cpSync(content.demoDir, join(outDir, "demo"), { recursive: true });
    };
  }
  return site;
};
