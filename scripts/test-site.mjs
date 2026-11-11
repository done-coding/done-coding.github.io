// 站点检查、统计开关、产品站外壳、SEO 与兼容性矩阵的正反例测试，全部在系统临时目录进行，不动根 dist。
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  symlinkSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { indexablePages, renderSitemap } from "./site-pages.mjs";

const repo = resolve(import.meta.dirname, "..");
const script = (name) => join(repo, "scripts", name);
const tmp = realpathSync(mkdtempSync(join(tmpdir(), "site-test-")));
const failures = [];
const testId = "test-website-id";

const expect = (label, passed, detail = "") => {
  console.log(`${passed ? "通过" : "失败"}：${label}`);
  if (!passed) {
    failures.push(`${label}${detail ? `\n${detail}` : ""}`);
  }
};

const run = (command, args, { cwd = repo, env = {} } = {}) => {
  const { status, stdout, stderr } = spawnSync(command, args, {
    cwd,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
  return { status, output: `${stdout}${stderr}` };
};

const writeConfig = (name, websiteId) => {
  const config = JSON.parse(
    readFileSync(join(repo, "site.config.json"), "utf8"),
  );
  config.analytics.websiteId = websiteId;
  const path = join(tmp, `${name}.json`);
  writeFileSync(path, JSON.stringify(config));
  return path;
};

const copySite = (name) => {
  const dir = join(tmp, name);
  cpSync(join(repo, "dist"), dir, { recursive: true });
  return dir;
};

const check = (dir) => run("node", [script("check-site.mjs"), dir]);

const expectCheckFails = (label, mutate, mention) => {
  const dir = copySite(label);
  mutate(dir);
  const { status, output } = check(dir);
  expect(
    `check-site 拦截${label}`,
    status !== 0 && output.includes(mention),
    output,
  );
};

// 链接类用例的页面标为 noindex，不触发 SEO 检查
const page = (body, head = '<meta name="robots" content="noindex" />') =>
  `<!doctype html><html lang="zh-CN"><head>${head}</head><body>${body}</body></html>`;

const ORIGIN = "https://done-coding.github.io";

/** 带完整 SEO 元信息的页面，path 为相对站根的路径 */
const seoPage = (path, body, { canonical } = {}) => {
  const url =
    canonical ?? `${ORIGIN}/${path.replace(/(^|\/)index\.html$/, "$1")}`;
  return page(
    body,
    `<title>页</title><meta name="description" content="说明" /><link rel="canonical" href="${url}" /><meta property="og:title" content="页" /><meta property="og:description" content="说明" /><meta property="og:url" content="${url}" />`,
  );
};

/** 把页面加进被检目录的 sitemap */
const addToSitemap = (dir, path) => {
  const file = join(dir, "sitemap.xml");
  writeFileSync(
    file,
    readFileSync(file, "utf8").replace(
      "</urlset>",
      `  <url><loc>${ORIGIN}/${path}</loc></url>\n</urlset>`,
    ),
  );
};

const testCheckSite = () => {
  expect("check-site 放行正式产物", check(join(repo, "dist")).status === 0);

  const good = copySite("正例");
  mkdirSync(join(good, "sub"));
  writeFileSync(join(good, "sub", "target.html"), page("目标"));
  writeFileSync(
    join(good, "sub", "good.html"),
    page(`
      <a href="./target.html">相对</a>
      <a href='target.html#x'>单引号带锚点</a>
      <a href="../index.html?a=1">上级</a>
      <a href="/sub/target">干净 URL</a>
      <a href="https://example.com/x.html">外链</a>
      <a href="mailto:a@example.com">邮件</a>
      <a href="#top">锚点</a>
      <script src="//cdn.example.com/a.js"></script>
      <script>const s = '<a href="missing.html">';</script>
      <!-- <a href="missing.html">注释</a> -->
    `),
  );
  const goodResult = check(good);
  expect(
    "check-site 不误报合法链接",
    goodResult.status === 0,
    goodResult.output,
  );

  const writeBad = (href) => (dir) =>
    writeFileSync(join(dir, "bad.html"), page(`<a href="${href}">坏</a>`));
  expectCheckFails("相对坏链接", writeBad("./missing.html"), "bad.html");
  expectCheckFails("根绝对坏链接", writeBad("/missing/"), "bad.html");
  expectCheckFails("越界链接", writeBad("../../outside.html"), "bad.html");
  expectCheckFails(
    "单引号坏链接",
    (dir) =>
      writeFileSync(join(dir, "bad.html"), page(`<a href='nope.html'>坏</a>`)),
    "bad.html",
  );
  expectCheckFails(
    "source map 文件",
    (dir) => writeFileSync(join(dir, "app.js.map"), "{}"),
    "app.js.map",
  );
  expectCheckFails(
    "sourceMappingURL 注释",
    (dir) =>
      writeFileSync(join(dir, "app.js"), "//# sourceMappingURL=app.js.map\n"),
    "app.js",
  );
  expectCheckFails(
    "缺首页",
    (dir) => rmSync(join(dir, "forge", "index.html")),
    "forge-site",
  );
};

const testSeoAndA11y = () => {
  const formal = join(repo, "dist");
  const sitemap = read(formal, "sitemap.xml");
  expect(
    "sitemap 列出门户、矩阵页和产品站首页",
    [
      `${ORIGIN}/`,
      `${ORIGIN}/compatibility.html`,
      `${ORIGIN}/forge/`,
      `${ORIGIN}/cli/`,
    ].every((url) => sitemap.includes(`<loc>${url}</loc>`)),
    sitemap,
  );
  expect("sitemap 不列 404 页", !sitemap.includes("404.html"));
  expect(
    "robots.txt 指向 sitemap",
    read(formal, "robots.txt").includes(`Sitemap: ${ORIGIN}/sitemap.xml`),
  );
  const forgeHome = read(formal, "forge/index.html");
  expect(
    "产品站首页有 canonical 和 Open Graph",
    forgeHome.includes(`<link rel="canonical" href="${ORIGIN}/forge/">`) &&
      forgeHome.includes('property="og:title"'),
    forgeHome.slice(0, 2000),
  );

  const good = copySite("seo-正例");
  writeFileSync(
    join(good, "ok.html"),
    seoPage(
      "ok.html",
      '<h1>一</h1><h2>二</h2><h3>三</h3><h1>回到一</h1><h2>二</h2><img src="/x.png" alt="">',
    ),
  );
  writeFileSync(join(good, "x.png"), "");
  addToSitemap(good, "ok.html");
  // 演示是产品仓的独立应用，不按文档页检查
  mkdirSync(join(good, "forge", "demo"), { recursive: true });
  writeFileSync(
    join(good, "forge", "demo", "index.html"),
    '<html><body><h1>演示</h1><h4>跳级</h4><img src="./x.png"></body></html>',
  );
  writeFileSync(join(good, "forge", "demo", "x.png"), "");
  writeFileSync(join(good, "forge", "demo", "big.js"), "x".repeat(2_000_000));
  const goodResult = check(good);
  expect(
    "check-site 放行合规页面与演示内的问题",
    goodResult.status === 0,
    goodResult.output,
  );

  const writePage =
    (path, html, { inSitemap = true } = {}) =>
    (dir) => {
      writeFileSync(join(dir, path), html);
      if (inSitemap) {
        addToSitemap(dir, path);
      }
    };
  expectCheckFails(
    "缺 canonical",
    (dir) =>
      writeFileSync(
        join(dir, "privacy.html"),
        read(dir, "privacy.html").replace(/<link rel="canonical"[^>]*>/, ""),
      ),
    "privacy.html 的 canonical",
  );
  expectCheckFails(
    "canonical 指向别处",
    writePage(
      "seo.html",
      seoPage("seo.html", "<h1>页</h1>", { canonical: `${ORIGIN}/other.html` }),
    ),
    "seo.html 的 canonical",
  );
  expectCheckFails(
    "缺 description",
    writePage(
      "seo.html",
      seoPage("seo.html", "<h1>页</h1>").replace(
        '<meta name="description" content="说明" />',
        "",
      ),
    ),
    "seo.html 缺少 meta description",
  );
  expectCheckFails(
    "页面未列入 sitemap",
    writePage("seo.html", seoPage("seo.html", "<h1>页</h1>"), {
      inSitemap: false,
    }),
    "sitemap.xml 未列出 seo.html",
  );
  expectCheckFails(
    "缺 sitemap",
    (dir) => rmSync(join(dir, "sitemap.xml")),
    "sitemap.xml",
  );
  expectCheckFails(
    "缺 robots",
    (dir) => rmSync(join(dir, "robots.txt")),
    "robots.txt",
  );
  expectCheckFails(
    "图片缺 alt",
    writePage("a11y.html", page('<h1>页</h1><img src="/x.png">')),
    "缺少 alt",
  );
  expectCheckFails(
    "标题跳级",
    writePage("a11y.html", page("<h1>一</h1><h3>三</h3>")),
    "从 h1 跳到 h3",
  );
  expectCheckFails(
    "缺 lang",
    writePage(
      "a11y.html",
      '<html><head><meta name="robots" content="noindex" /></head><body></body></html>',
    ),
    "缺少 lang",
  );
  // 1100 KB 超过 assetKB、未超 searchIndexKB：普通脚本不得借用搜索索引预算
  expectCheckFails(
    "脚本超出体积预算",
    (dir) => writeFileSync(join(dir, "huge.js"), "x".repeat(1100 * 1024)),
    "huge.js 体积",
  );
  const writeSearchIndex = (dir, kb) => {
    mkdirSync(join(dir, "forge/assets/chunks"), { recursive: true });
    writeFileSync(
      join(dir, "forge/assets/chunks/@localSearchIndexroot.test.js"),
      "x".repeat(kb * 1024),
    );
  };
  const search = copySite("搜索索引在单列预算内");
  writeSearchIndex(search, 1100);
  const searchResult = check(search);
  expect(
    "check-site 按单列预算放行搜索索引并显示大小",
    searchResult.status === 0 &&
      /@localSearchIndexroot\.test\.js 1100 KB，预算 \d+ KB/.test(
        searchResult.output,
      ),
    searchResult.output,
  );
  expectCheckFails(
    "搜索索引超出单列预算",
    (dir) => writeSearchIndex(dir, 1600),
    "@localSearchIndexroot.test.js 体积 1600 KB，超过搜索索引预算",
  );
  expectCheckFails(
    "页面超出体积预算",
    writePage("huge.html", page("x".repeat(300 * 1024))),
    "huge.html 体积",
  );
};

const emptyResults = join(tmp, "acceptance-empty");
mkdirSync(emptyResults);

/** 按门户的 build 脚本构建：静态复制与注入，再填兼容性矩阵 */
const buildPortal = (
  name,
  configPath,
  { acceptanceDir = emptyResults } = {},
) => {
  const cwd = join(tmp, name);
  mkdirSync(cwd);
  cpSync(join(repo, "apps/portal/public"), join(cwd, "public"), {
    recursive: true,
  });
  const env = { SITE_CONFIG_PATH: configPath, ACCEPTANCE_DIR: acceptanceDir };
  let result = run("node", [script("build-static.mjs")], { cwd, env });
  if (result.status === 0) {
    result = run("node", [join(repo, "apps/portal/render-compatibility.mjs")], {
      cwd,
      env,
    });
  }
  return { ...result, dist: join(cwd, "dist") };
};

const buildSmoke = (name, configPath) => {
  const outDir = join(tmp, name);
  const result = run(
    "pnpm",
    ["exec", "vitepress", "build", "smoke", "--outDir", outDir],
    {
      cwd: join(repo, "packages/site-kit"),
      env: { SITE_CONFIG_PATH: configPath },
    },
  );
  return { ...result, dist: outDir };
};

const read = (dir, file) => readFileSync(join(dir, file), "utf8");

const testAnalytics = () => {
  const off = writeConfig("off", null);
  const on = writeConfig("on", testId);

  const portalOff = buildPortal("portal-off", off);
  expect("门户 null 配置可构建", portalOff.status === 0, portalOff.output);
  const portalOn = buildPortal("portal-on", on);
  expect("门户有值配置可构建", portalOn.status === 0, portalOn.output);

  for (const file of [
    "index.html",
    "404.html",
    "privacy.html",
    "compatibility.html",
  ]) {
    expect(
      `门户 ${file} null 时不加载脚本`,
      !read(portalOff.dist, file).includes("data-website-id"),
    );
    expect(
      `门户 ${file} 有值时加载脚本`,
      read(portalOn.dist, file).includes(`data-website-id="${testId}"`),
    );
    expect(
      `门户 ${file} 有值时限定域名且排除查询参数`,
      read(portalOn.dist, file).includes(
        'data-domains="done-coding.github.io"',
      ) && read(portalOn.dist, file).includes('data-exclude-search="true"'),
    );
    expect(
      `门户 ${file} null 时不含统计范围属性`,
      !/data-domains|data-exclude-search/.test(read(portalOff.dist, file)),
    );
  }

  const home = read(portalOff.dist, "index.html");
  expect(
    "门户记录 forge 点击事件",
    home.includes('data-umami-event="portal-to-forge"'),
  );
  expect(
    "门户记录 cli 点击事件",
    home.includes('data-umami-event="portal-to-cli"'),
  );

  const privacyOff = read(portalOff.dist, "privacy.html");
  const privacyOn = read(portalOn.dist, "privacy.html");
  expect(
    "两种统计开关都显示徽章隐私说明",
    [privacyOff, privacyOn].every(
      (html) =>
        html.includes("img.shields.io") && html.includes("不携带来源页地址"),
    ),
  );
  expect("隐私说明未启用版写明未启用", privacyOff.includes("未启用访问统计"));
  expect("隐私说明未启用版不含 Umami 描述", !privacyOff.includes("Umami"));
  expect("隐私说明启用版写明 Umami", privacyOn.includes("Umami"));
  expect("隐私说明启用版不写未启用", !privacyOn.includes("未启用访问统计"));
  expect(
    "隐私说明产物不留内容块标记",
    !/analytics:(?:on|off)/.test(privacyOff + privacyOn),
  );

  expect(
    "门户页面有 canonical，404 不加",
    read(portalOff.dist, "privacy.html").includes(
      `<link rel="canonical" href="${ORIGIN}/privacy.html" />`,
    ) && !read(portalOff.dist, "404.html").includes("canonical"),
  );
  const noDescription = join(tmp, "portal-no-description");
  mkdirSync(noDescription);
  cpSync(join(repo, "apps/portal/public"), join(noDescription, "public"), {
    recursive: true,
  });
  writeFileSync(
    join(noDescription, "public", "extra.html"),
    '<!doctype html><html lang="zh-CN"><head><title>无说明</title></head><body></body></html>',
  );
  const missingDescription = run("node", [script("build-static.mjs")], {
    cwd: noDescription,
    env: { SITE_CONFIG_PATH: off },
  });
  expect(
    "门户页面缺 description 时构建失败并说明",
    missingDescription.status !== 0 &&
      missingDescription.output.includes("extra.html"),
    missingDescription.output,
  );

  const invalid = buildPortal("portal-invalid", writeConfig("invalid", 123));
  expect(
    "websiteId 类型错误时构建失败并说明",
    invalid.status !== 0 && invalid.output.includes("websiteId"),
    invalid.output,
  );

  const invalidOriginPath = writeConfig("invalid-origin", testId);
  const invalidOriginConfig = JSON.parse(
    readFileSync(invalidOriginPath, "utf8"),
  );
  invalidOriginConfig.origin = "not-a-url";
  writeFileSync(invalidOriginPath, JSON.stringify(invalidOriginConfig));
  const invalidOrigin = buildPortal("portal-invalid-origin", invalidOriginPath);
  expect(
    "origin 不是合法 URL 时构建失败并说明",
    invalidOrigin.status !== 0 &&
      invalidOrigin.output.includes("origin 必须是合法 URL"),
    invalidOrigin.output,
  );

  const smokeOff = buildSmoke("smoke-off", off);
  expect("VitePress null 配置可构建", smokeOff.status === 0, smokeOff.output);
  const smokeOn = buildSmoke("smoke-on", on);
  expect("VitePress 有值配置可构建", smokeOn.status === 0, smokeOn.output);
  if (smokeOff.status === 0 && smokeOn.status === 0) {
    const htmlOff = read(smokeOff.dist, "index.html");
    expect("VitePress null 时不加载脚本", !htmlOff.includes("data-website-id"));
    expect(
      "VitePress 有值时加载脚本",
      read(smokeOn.dist, "index.html").includes(`data-website-id="${testId}"`),
    );
    expect(
      "VitePress 有值时限定域名且排除查询参数",
      read(smokeOn.dist, "index.html").includes(
        'data-domains="done-coding.github.io"',
      ) &&
        read(smokeOn.dist, "index.html").includes('data-exclude-search="true"'),
    );
    expect(
      "VitePress null 时不含统计范围属性",
      !/data-domains|data-exclude-search/.test(htmlOff),
    );
    expect(
      "VitePress 页脚链接隐私说明",
      htmlOff.includes('href="/privacy.html"'),
    );
  }
};

const resultsFile = (date, cases, extra = {}) => ({
  schemaVersion: 1,
  date,
  environment: {
    os: "Darwin 22.6.0",
    arch: "x64",
    node: "v24.0.0",
    pnpm: "12.15.0",
  },
  packages: {
    "create-done-coding": "0.18.1",
    "done-coding": "0.23.4",
    "@done-coding/forge": "0.100.1",
  },
  forgeToolchain: { "@done-coding/forge": "0.100.1", vue: "3.5.0" },
  groupTitles: {
    template: "项目模板",
    forge: "forge 消费者",
    cli: "cli 子命令",
  },
  filter: { groups: ["template", "forge", "cli"], only: null },
  totals: {
    pass: cases.filter((item) => item.status === "pass").length,
    fail: cases.filter((item) => item.status === "fail").length,
    skipped: 0,
  },
  cases,
  ...extra,
});

const testCompatibility = () => {
  const off = writeConfig("compat-off", null);
  const empty = buildPortal("compat-empty", off);
  expect(
    "兼容性矩阵无结果时显示暂无验收结果",
    empty.status === 0 &&
      read(empty.dist, "compatibility.html").includes("暂无验收结果"),
    empty.output,
  );

  const dir = join(tmp, "acceptance-results");
  const write = (date, results) => {
    mkdirSync(join(dir, date), { recursive: true });
    writeFileSync(join(dir, date, "results.json"), JSON.stringify(results));
  };
  const step = (name, status) => ({ name, status });
  write(
    "2026-01-01",
    resultsFile("2026-01-01", [
      { group: "template", title: "旧结果模板", status: "pass", steps: [] },
    ]),
  );
  write(
    "2026-02-01",
    resultsFile("2026-02-01", [
      {
        group: "template",
        title: "template-monorepo（workspace）",
        status: "pass",
        steps: [step("构建", "pass")],
      },
      {
        group: "forge",
        title: "最小 Vite + Vue 3 项目",
        status: "fail",
        steps: [step("vite build", "pass"), step("vue-tsc", "fail")],
      },
      {
        group: "cli",
        title: "done-coding <script>x</script>",
        status: "pass",
        steps: [],
      },
    ]),
  );
  // 不是日期目录或没有 results.json 的条目不算
  mkdirSync(join(dir, "2099-01-01"));
  const built = buildPortal("compat-results", off, { acceptanceDir: dir });
  expect("兼容性矩阵有结果时可构建", built.status === 0, built.output);
  if (built.status === 0) {
    const html = read(built.dist, "compatibility.html");
    expect(
      "兼容性矩阵取最近一次结果",
      html.includes("验收日期 2026-02-01") && !html.includes("旧结果模板"),
    );
    expect(
      "兼容性矩阵按产品列出版本与通过数",
      html.includes("create-done-coding 0.18.1，1/1 通过") &&
        html.includes("@done-coding/forge 0.100.1，0/1 通过") &&
        html.includes("done-coding 0.23.4"),
      html,
    );
    expect(
      "兼容性矩阵标出失败与未通过的步骤",
      /status-fail">失败<\/td>\s*<td>vue-tsc<\/td>/.test(html),
      html,
    );
    expect(
      "兼容性矩阵转义结果中的 HTML",
      html.includes("&lt;script&gt;x&lt;/script&gt;") &&
        !html.includes("<script>x</script>"),
    );
    expect("兼容性矩阵不留占位注释", !html.includes("<!-- compatibility -->"));
  }

  const formal = read(join(repo, "dist"), "compatibility.html");
  expect(
    "正式站兼容性矩阵已填充",
    !formal.includes("<!-- compatibility -->") &&
      (formal.includes("验收日期") || formal.includes("暂无验收结果")),
  );
};

const SAMPLE_MARK = "仅用于契约测试";
const fixture = join(repo, "packages/site-kit/fixtures/content");
const FIXTURE_VERSION = "0.0.0-fixture";
const OLDER_VERSION = "0.0.0-older";
const OLDER_MARK = "zebrafinch";

const productApps = () =>
  JSON.parse(readFileSync(join(repo, "site.config.json"), "utf8")).apps;

const productSites = () =>
  productApps().filter(({ dir }) =>
    existsSync(join(repo, dir, ".vitepress/config.mjs")),
  );

const buildProduct = (
  { dir, base, name: title, packages },
  name,
  contentDir,
) => {
  const root = join(tmp, `${name}-site`);
  const config = join(root, ".vitepress/config.mjs");
  mkdirSync(join(root, ".vitepress/theme"), { recursive: true });
  symlinkSync(
    join(repo, "packages/site-kit/node_modules"),
    join(root, "node_modules"),
    "dir",
  );
  writeFileSync(
    join(root, ".vitepress/theme/index.mjs"),
    `export { default } from ${JSON.stringify(join(repo, "packages/site-kit/theme/index.mjs"))};`,
  );
  writeFileSync(
    config,
    `import { defineProductSite } from ${JSON.stringify(pathToFileURL(join(repo, "packages/site-kit/product.mjs")).href)};
export default defineProductSite(${JSON.stringify({ configUrl: pathToFileURL(config).href, base, title, tagline: title, packages })});`,
  );
  const outDir = join(tmp, name);
  const result = run(
    "pnpm",
    ["exec", "vitepress", "build", root, "--outDir", outDir],
    {
      cwd: join(repo, dir),
      env: { SITE_CONTENT_DIR: contentDir },
    },
  );
  return { ...result, dist: outDir };
};

/** 复制夹具后改坏，返回内容目录 */
const brokenContent = (name, mutate) => {
  const dir = join(tmp, name);
  cpSync(fixture, dir, { recursive: true });
  mutate(dir, join(dir, FIXTURE_VERSION));
  return dir;
};

const brokenCases = [
  [
    "current-json-不是-JSON",
    (dir) => writeFileSync(join(dir, "current.json"), "{"),
    "current.json",
  ],
  [
    "version-越界",
    (dir) =>
      writeFileSync(
        join(dir, "current.json"),
        JSON.stringify({ version: "../x", source: "s" }),
      ),
    "version",
  ],
  [
    "缺-source",
    (dir) =>
      writeFileSync(
        join(dir, "current.json"),
        JSON.stringify({ version: FIXTURE_VERSION }),
      ),
    "source",
  ],
  [
    "版本目录不存在",
    (dir) =>
      writeFileSync(
        join(dir, "current.json"),
        JSON.stringify({ version: "9.9.9", source: "s" }),
      ),
    "版本目录不存在",
  ],
  [
    "缺-docs",
    (_, version) => rmSync(join(version, "docs"), { recursive: true }),
    "docs",
  ],
  ["缺-nav", (_, version) => rmSync(join(version, "nav.json")), "nav.json"],
  [
    "nav-不是数组",
    (_, version) => writeFileSync(join(version, "nav.json"), "{}"),
    "非空数组",
  ],
  [
    "nav-指向不存在的文档",
    (_, version) =>
      writeFileSync(
        join(version, "nav.json"),
        JSON.stringify([{ text: "坏", link: "missing" }]),
      ),
    "missing",
  ],
  [
    "nav-链接越界",
    (_, version) =>
      writeFileSync(
        join(version, "nav.json"),
        JSON.stringify([{ text: "坏", link: "../x" }]),
      ),
    "相对 docs/",
  ],
  [
    "demo-缺首页",
    (_, version) => rmSync(join(version, "demo/index.html")),
    "index.html",
  ],
  [
    "历史版本目录名不合法",
    (dir) =>
      cpSync(join(dir, OLDER_VERSION), join(dir, "bad name"), {
        recursive: true,
      }),
    "目录名不是合法版本号",
  ],
  [
    "历史版本缺-nav",
    (dir) => rmSync(join(dir, OLDER_VERSION, "nav.json")),
    "nav.json",
  ],
];

/** 本地搜索索引的内容；没有索引返回 null */
const searchIndex = (dist) => {
  const chunks = join(dist, "assets", "chunks");
  const file = existsSync(chunks)
    ? readdirSync(chunks).find((name) => name.startsWith("@localSearchIndex"))
    : undefined;
  return file ? readFileSync(join(chunks, file), "utf8") : null;
};

/** 产物 HTML 中文字为 text 的链接地址；找不到返回 null */
const linkHref = (html, text) =>
  html.match(new RegExp(`<a [^>]*href="([^"]*)"[^>]*>${text}</a>`))?.[1] ??
  null;

/** 站内地址（含 base）对应的首页在产物中存在 */
const servesIndex = (dist, base, href) =>
  href !== null &&
  href.startsWith(base) &&
  existsSync(
    join(dist, href.slice(base.length).replace(/#.*$/, ""), "index.html"),
  );

/** 夹具（当前与历史两个版本）构建出的产物：文档、导航、版本切换、搜索、SEO，并通过站点检查 */
const testFixtureBuild = (site) => {
  const { name, base } = site;
  const built = buildProduct(site, `${name}-fixture`, fixture);
  expect(`${name} 夹具可构建`, built.status === 0, built.output);
  if (built.status === 0) {
    expect(
      `${name} 生成文档页`,
      read(built.dist, "docs/guide/start.html").includes("样例入门"),
    );
    expect(
      `${name} 生成目录页`,
      existsSync(join(built.dist, "docs/guide/index.html")),
    );
    const docPage = read(built.dist, "docs/overview.html");
    expect(
      `${name} 导航进入页面`,
      docPage.includes(`${base}docs/guide/start.html`) &&
        docPage.includes("样例指南"),
    );
    const demoHref = linkHref(docPage, "样例演示");
    expect(
      `${name} 文档指向演示的链接是演示首页地址`,
      demoHref === `${base}demo/` &&
        servesIndex(built.dist, base, demoHref) &&
        /<a [^>]*target="_self"[^>]*>样例演示</.test(docPage),
      demoHref,
    );
    expect(
      `${name} 深层文档指向演示的链接保留锚点`,
      linkHref(read(built.dist, "docs/guide/start.html"), "演示表单") ===
        `${base}demo/#/form`,
    );
    const home = read(built.dist, "index.html");
    expect(
      `${name} 首页显示版本和演示入口`,
      home.includes(FIXTURE_VERSION) && home.includes(`${base}demo/`),
    );
    expect(`${name} 有内容时不显示建设中`, !home.includes("文档建设中"));
    expect(
      `${name} 未配 packages 不显示徽章`,
      badgeCount(home) === 0 && badgeCount(docPage) === 0,
    );
    const generic = read(built.dist, "docs/guide/generic.html");
    expect(
      `${name} 尖括号、标签与插值按文本显示`,
      generic.includes("createBridge&lt;C extends object&gt;(options)") &&
        generic.includes("&lt;MyWidget /&gt;") &&
        generic.includes("插值 {{ value }}") &&
        generic.includes("<code>{{ code }}</code>"),
      generic,
    );
    expect(
      `${name} 演示原样发布`,
      read(built.dist, "demo/index.html") ===
        read(join(fixture, FIXTURE_VERSION), "demo/index.html"),
    );
    const older = `${base}v/${OLDER_VERSION}/`;
    expect(
      `${name} 多版本时显示版本切换`,
      home.includes(`${FIXTURE_VERSION}（当前）`) &&
        home.includes(`href="${older}"`),
    );
    expect(
      `${name} 历史版本文档在独立路径`,
      read(built.dist, `v/${OLDER_VERSION}/docs/overview.html`).includes(
        "历史样例概览",
      ),
    );
    const olderHome = read(built.dist, `v/${OLDER_VERSION}/index.html`);
    expect(
      `${name} 历史版本首页链接其文档与演示`,
      olderHome.includes(`${older}docs/overview.html`) &&
        olderHome.includes(`href="${older}demo/"`),
    );
    expect(
      `${name} 可迁移的历史演示发布到版本路径`,
      existsSync(join(built.dist, `v/${OLDER_VERSION}/demo/assets/app.js`)),
    );
    const olderDoc = read(built.dist, `v/${OLDER_VERSION}/docs/overview.html`);
    const olderDemoHref = linkHref(olderDoc, "历史演示");
    expect(
      `${name} 历史版本文档指向本版本演示`,
      olderDemoHref === `${older}demo/` &&
        servesIndex(built.dist, base, olderDemoHref),
      olderDemoHref,
    );
    expect(
      `${name} 历史版本侧栏指向本版本`,
      olderDoc.includes(`${older}docs/overview.html`) &&
        !olderDoc.includes(`${base}docs/guide/start.html`),
    );
    const index = searchIndex(built.dist);
    expect(
      `${name} 生成本地搜索索引且含当前版本`,
      index !== null && index.includes("样例入门"),
    );
    expect(
      `${name} 搜索索引不含历史版本`,
      index !== null && !index.includes(OLDER_MARK),
    );
    expect(
      `${name} 文档页 canonical 与 Open Graph`,
      docPage.includes(
        `<link rel="canonical" href="${ORIGIN}${base}docs/overview.html">`,
      ) &&
        docPage.includes(
          `<meta property="og:url" content="${ORIGIN}${base}docs/overview.html">`,
        ),
      docPage.slice(0, 3000),
    );
    const assembled = copySite(`${name}-assembled`);
    rmSync(join(assembled, base), { recursive: true });
    cpSync(built.dist, join(assembled, base), { recursive: true });
    // 换入夹具产物后按拼装规则重写 sitemap，再跑完整站点检查
    writeFileSync(
      join(assembled, "sitemap.xml"),
      renderSitemap(ORIGIN, indexablePages(assembled, productApps())),
    );
    const result = check(assembled);
    expect(`${name} 夹具产物通过站点检查`, result.status === 0, result.output);
  }
};

const badgeCount = (html) =>
  (html.match(/<img[^>]*src="https:\/\/img\.shields\.io\/npm\/v\//g) ?? [])
    .length;

const hasBadge = (html, name) =>
  html.includes(`src="https://img.shields.io/npm/v/${name}?logo=npm"`) &&
  html.includes(`alt="${name} 的 npm 版本"`) &&
  html.includes(`referrerpolicy="no-referrer"`) &&
  html.includes(
    `href="https://www.npmjs.com/package/${name}" target="_blank" rel="noopener"`,
  );

const testPackageBadges = (site) => {
  const name = "@done-coding/example";
  const built = buildProduct(
    { ...site, packages: [{ name, doc: "overview.md" }] },
    `${site.name}-badges`,
    fixture,
  );
  expect(`${site.name} 徽章夹具可构建`, built.status === 0, built.output);
  if (built.status === 0) {
    expect(
      `${site.name} 首页包含包名与徽章`,
      hasBadge(read(built.dist, "index.html"), name) &&
        read(built.dist, "index.html").includes("npm 包"),
    );
    expect(
      `${site.name} 对应文档页包含徽章`,
      hasBadge(read(built.dist, "docs/overview.html"), name),
    );
    for (const path of [
      `v/${OLDER_VERSION}/index.html`,
      `v/${OLDER_VERSION}/docs/overview.html`,
      "docs/guide/start.html",
    ]) {
      expect(
        `${site.name} ${path} 不显示徽章`,
        badgeCount(read(built.dist, path)) === 0,
      );
    }
  }
  for (const [label, packages, mention] of [
    ["不存在的文档", [{ name, doc: "missing.md" }], "missing.md"],
    ["非法包名", [{ name: "bad name" }], "name"],
    ["重复包名", [{ name }, { name }], "重复"],
    ["越界文档", [{ name, doc: "../overview.md" }], "相对 docs/"],
  ]) {
    const result = buildProduct(
      { ...site, packages },
      `${site.name}-badges-${label}`,
      fixture,
    );
    expect(
      `${site.name} packages ${label} 构建失败并说明`,
      result.status !== 0 &&
        result.output.includes("产品站配置错误") &&
        result.output.includes(mention),
      result.output,
    );
  }
};

/** 正式站：按是否已有内容产物分别判断，且不含夹具内容 */
const testFormalSite = (site) => {
  const { name, base } = site;
  const formal = join(repo, "dist", base);
  const formalHome = read(formal, "index.html");
  if (existsSync(join(repo, site.dir, "content", "current.json"))) {
    expect(
      `${name} 正式站有内容产物时渲染文档、不显示建设中`,
      !formalHome.includes("文档建设中") && existsSync(join(formal, "docs")),
    );
  } else {
    expect(
      `${name} 正式站无内容产物时显示建设中`,
      formalHome.includes("文档建设中"),
    );
  }
  expect(
    `${name} 正式首页徽章数量`,
    badgeCount(formalHome) === (base === "/forge/" ? 12 : 16),
  );
  if (base === "/cli/") {
    const nav = JSON.parse(
      read(join(repo, site.dir, "content/0.24.0"), "nav.json"),
    );
    for (const { text, link } of nav.filter(({ link }) =>
      link.startsWith("packages/"),
    )) {
      expect(
        `cli ${text} 文档页含对应徽章`,
        hasBadge(read(formal, `docs/${link.replace(/\.md$/, ".html")}`), text),
      );
    }
  }
  const leaked = allText(formal).find((text) => text.includes(SAMPLE_MARK));
  expect(`${name} 正式站不含夹具内容`, leaked === undefined);
};

const testProductSite = (site) => {
  const { name, base } = site;

  testFixtureBuild(site);
  testPackageBadges(site);

  const single = buildProduct(
    { ...site, packages: [] },
    `${name}-single-out`,
    brokenContent(`${name}-single`, (dir) =>
      rmSync(join(dir, OLDER_VERSION), { recursive: true }),
    ),
  );
  expect(`${name} 单版本可构建`, single.status === 0, single.output);
  if (single.status === 0) {
    const home = read(single.dist, "index.html");
    expect(`${name} 空 packages 不显示徽章`, badgeCount(home) === 0);
    expect(
      `${name} 单版本不显示版本切换`,
      !home.includes(`${FIXTURE_VERSION}（当前）`) &&
        !home.includes(`${base}v/`),
    );
  }

  const boundDemo = buildProduct(
    site,
    `${name}-bound-demo-out`,
    brokenContent(`${name}-bound-demo`, (dir) =>
      writeFileSync(
        join(dir, OLDER_VERSION, "demo/index.html"),
        `<script type="module" src="${base}demo/assets/app.js"></script>`,
      ),
    ),
  );
  expect(
    `${name} 绑定当前路径的历史演示可构建`,
    boundDemo.status === 0,
    boundDemo.output,
  );
  if (boundDemo.status === 0) {
    expect(
      `${name} 绑定当前路径的历史演示不发布`,
      !existsSync(join(boundDemo.dist, `v/${OLDER_VERSION}/demo`)) &&
        !read(boundDemo.dist, `v/${OLDER_VERSION}/index.html`).includes(
          `${base}v/${OLDER_VERSION}/demo/`,
        ),
    );
    expect(
      `${name} 未发布的历史演示链接改指该版本首页`,
      linkHref(
        read(boundDemo.dist, `v/${OLDER_VERSION}/docs/overview.html`),
        "历史演示",
      ) === `${base}v/${OLDER_VERSION}/`,
    );
  }

  const emptyDir = join(tmp, `${name}-empty`);
  mkdirSync(emptyDir);
  const missing = buildProduct(site, `${name}-missing`, emptyDir);
  expect(
    `${name} 缺 current.json 可构建`,
    missing.status === 0,
    missing.output,
  );
  if (missing.status === 0) {
    const home = read(missing.dist, "index.html");
    expect(`${name} 缺产物显示建设中`, home.includes("文档建设中"));
    expect(`${name} 缺产物无文档目录`, !existsSync(join(missing.dist, "docs")));
    expect(`${name} 缺产物不生成搜索索引`, searchIndex(missing.dist) === null);
  }

  for (const [label, mutate, mention] of brokenCases) {
    const result = buildProduct(
      site,
      `${name}-${label}-out`,
      brokenContent(`${name}-${label}`, mutate),
    );
    expect(
      `${name} 产物错误时构建失败并说明：${label}`,
      result.status !== 0 &&
        result.output.includes("内容产物格式错误") &&
        result.output.includes(mention),
      result.output,
    );
  }

  const deadLink = buildProduct(
    site,
    `${name}-dead-link-out`,
    brokenContent(`${name}-dead-link`, (_, version) =>
      writeFileSync(join(version, "docs/overview.md"), "[坏](./missing.md)\n"),
    ),
  );
  expect(
    `${name} 文档内坏链接使构建失败`,
    deadLink.status !== 0,
    deadLink.output,
  );

  const noDemo = buildProduct(
    site,
    `${name}-no-demo-out`,
    brokenContent(`${name}-no-demo`, (_, version) =>
      rmSync(join(version, "demo"), { recursive: true }),
    ),
  );
  expect(
    `${name} 无演示的版本链接演示使构建失败`,
    noDemo.status !== 0 && noDemo.output.includes("dead link"),
    noDemo.output,
  );

  testFormalSite(site);
};

const allText = (dir) =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:html|js)$/.test(entry.name))
    .map((entry) => readFileSync(join(entry.parentPath, entry.name), "utf8"));

try {
  testCheckSite();
  testSeoAndA11y();
  testAnalytics();
  testCompatibility();
  productSites().forEach(testProductSite);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\n${failures.length} 项失败：\n${failures.join("\n")}`);
  process.exit(1);
}
console.log("站点测试全部通过");
