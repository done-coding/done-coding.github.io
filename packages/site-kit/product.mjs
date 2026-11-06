// 产品站的站点外壳：读内容产物，生成 VitePress 源目录、导航、版本切换和首页，发布演示。
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "./content.mjs";
import { defineSite } from "./index.mjs";

const GENERATED_DIR = ".generated";
// 非当前版本放在 v/<版本>/ 下，当前版本保持原有路径
const ARCHIVE_DIR = "v";

const versionPrefix = (version) => `/${ARCHIVE_DIR}/${version}`;

const toRoute = (link, prefix) => {
  const [pathname, hash] = link.split("#");
  const route = `${prefix}/docs/${pathname.replace(/\.md$/, "")}`;
  return hash ? `${route}#${hash}` : route;
};

const toSidebar = (items, prefix) =>
  items.map(({ text, link, items: children }) => ({
    text,
    ...(link === undefined ? {} : { link: toRoute(link, prefix) }),
    ...(children === undefined ? {} : { items: toSidebar(children, prefix) }),
  }));

const firstRoute = (items, prefix) => {
  for (const { link, items: children } of items) {
    const route =
      link === undefined ? firstRoute(children, prefix) : toRoute(link, prefix);
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
 * 演示由产品仓按 `<base>demo/` 构建；首页引用了这个绝对路径的演示只能放在当前版本位置，
 * 换到 v/<版本>/demo/ 会加载到当前版本的资源，所以不发布。
 */
const isPortableDemo = (demoDir, base) =>
  !readFileSync(join(demoDir, "index.html"), "utf8").includes(`${base}demo/`);

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const searchOptions = {
  // 只索引当前版本：历史版本的页面不进索引
  _render: (src, env, md) => {
    const html = md.render(src, env);
    return env.relativePath.startsWith(`${ARCHIVE_DIR}/`) ||
      env.frontmatter?.search === false
      ? ""
      : html;
  },
  translations: {
    button: { buttonText: "搜索", buttonAriaLabel: "搜索文档" },
    modal: {
      displayDetails: "显示详细列表",
      resetButtonTitle: "清除查询",
      backButtonTitle: "关闭搜索",
      noResultsText: "没有找到结果",
      footer: {
        selectText: "选择",
        navigateText: "切换",
        closeText: "关闭",
      },
    },
  },
};

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
  const docsRoute = firstRoute(content.nav, "");
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
  const sidebar = { "/docs/": toSidebar(content.nav, "") };
  const demos = content.demoDir ? [[content.demoDir, "demo"]] : [];

  for (const archived of content.archived) {
    const prefix = versionPrefix(archived.version);
    const dir = join(srcDir, ARCHIVE_DIR, archived.version);
    cpSync(archived.docsDir, join(dir, "docs"), { recursive: true });
    const portable =
      archived.demoDir !== null && isPortableDemo(archived.demoDir, base);
    if (portable) {
      demos.push([archived.demoDir, `${ARCHIVE_DIR}/${archived.version}/demo`]);
    }
    writeFileSync(
      join(dir, "index.md"),
      homePage({
        name: title,
        text: `历史版本 ${archived.version}`,
        tagline:
          archived.demoDir && !portable
            ? `此版本的演示按 ${base}demo/ 构建，只能在当前版本位置发布，这里不提供`
            : `当前版本是 ${content.version}`,
        actions: [
          {
            theme: "brand",
            text: "阅读文档",
            link: firstRoute(archived.nav, prefix),
          },
          ...(portable
            ? [
                {
                  theme: "alt",
                  text: "查看演示",
                  link: `${prefix}/demo/`,
                  target: "_self",
                },
              ]
            : []),
          { theme: "alt", text: "回到当前版本", link: "/" },
        ],
      }),
    );
    sidebar[`${prefix}/docs/`] = toSidebar(archived.nav, prefix);
  }

  site.themeConfig.nav = [
    { text: "文档", link: docsRoute, activeMatch: "^/docs/" },
    ...(content.demoDir ? [{ text: "演示", ...demoLink }] : []),
    // 只有一个版本时不显示切换
    ...(content.archived.length > 0
      ? [
          {
            text: `版本 ${content.version}`,
            items: [
              {
                text: `${content.version}（当前）`,
                link: "/",
                activeMatch: `^/(?!${ARCHIVE_DIR}/)`,
              },
              ...content.archived.map(({ version }) => ({
                text: version,
                link: `${versionPrefix(version)}/`,
                activeMatch: `^${escapeRegExp(versionPrefix(version))}/`,
              })),
            ],
          },
        ]
      : []),
  ];
  site.themeConfig.sidebar = sidebar;
  site.themeConfig.search = { provider: "local", options: searchOptions };
  if (demos.length > 0) {
    site.buildEnd = ({ outDir }) => {
      for (const [from, to] of demos) {
        cpSync(from, join(outDir, to), { recursive: true });
      }
    };
  }
  return site;
};
