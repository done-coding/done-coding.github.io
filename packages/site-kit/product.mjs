// 产品站的站点外壳：读内容产物，生成 VitePress 源目录、导航、版本切换和首页，发布演示。
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, posix } from "node:path";
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

/** VitePress 把 Markdown 编译成 Vue 模板，正文与行内代码里的 {{ }} 改成实体，避免被当作插值 */
const escapeMustache = (md) => {
  for (const rule of ["text", "code_inline"]) {
    const render = md.renderer.rules[rule];
    md.renderer.rules[rule] = (...args) =>
      render(...args)
        .replaceAll("{{", "&#123;&#123;")
        .replaceAll("}}", "&#125;&#125;");
  }
};

/**
 * 文档可链接同版本的 demo/。演示是独立构建的静态应用，不是 VitePress 页面：
 * 把这类相对链接改成演示的站内地址，并加 target 让 VitePress 路由与死链检查放行。
 * demoHomes 按版本根目录（当前版本为 ""，历史版本为 v/<版本>/）记录演示是否发布；
 * 没有演示的版本不改写，链接照常按死链报错。
 */
const rewriteDemoLinks = (md, { base, demoHomes }) => {
  md.core.ruler.push("demo_links", (state) => {
    const page = state.env.relativePath;
    if (!page) {
      return;
    }
    const root = page.match(new RegExp(`^(?:${ARCHIVE_DIR}/[^/]+/)?`))[0];
    const published = demoHomes.get(root);
    if (published === undefined) {
      return;
    }
    const links = state.tokens
      .flatMap((token) => token.children ?? [])
      .filter((token) => token.type === "link_open");
    for (const link of links) {
      const href = link.attrGet("href") ?? "";
      const [, pathname, suffix] = href.match(/^([^?#]*)(.*)$/);
      if (pathname === "" || /^(?:[a-z][a-z\d+.-]*:|\/)/i.test(pathname)) {
        continue;
      }
      const target = posix.join(posix.dirname(page), pathname);
      if (target !== `${root}demo` && !target.startsWith(`${root}demo/`)) {
        continue;
      }
      // 未发布的历史演示改指该版本首页，首页说明了不提供的原因
      link.attrSet(
        "href",
        published
          ? `${base}${target === `${root}demo` ? `${target}/` : target}${suffix}`
          : `${base}${root}`,
      );
      link.attrSet("target", "_self");
    }
  });
};

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
  // 内容产物按纯 Markdown 渲染：原始 HTML 与 Vue 标签按文本显示，正文里的 `<T>` 不会被当作模板编译
  const demoHomes = new Map();
  site.markdown = {
    html: false,
    config: (md) => {
      escapeMustache(md);
      rewriteDemoLinks(md, { base, demoHomes });
    },
  };

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
  if (content.demoDir) {
    demoHomes.set("", true);
  }

  for (const archived of content.archived) {
    const prefix = versionPrefix(archived.version);
    const dir = join(srcDir, ARCHIVE_DIR, archived.version);
    cpSync(archived.docsDir, join(dir, "docs"), { recursive: true });
    const portable =
      archived.demoDir !== null && isPortableDemo(archived.demoDir, base);
    if (archived.demoDir !== null) {
      demoHomes.set(`${ARCHIVE_DIR}/${archived.version}/`, portable);
    }
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
