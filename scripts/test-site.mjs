// 站点检查和统计开关的反例测试，全部在系统临时目录进行，不动根 dist。
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const repo = resolve(import.meta.dirname, "..");
const script = (name) => join(repo, "scripts", name);
const tmp = mkdtempSync(join(tmpdir(), "site-test-"));
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

const page = (body) => `<!doctype html><html><body>${body}</body></html>`;

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

const buildPortal = (name, configPath) => {
  const cwd = join(tmp, name);
  mkdirSync(cwd);
  cpSync(join(repo, "apps/portal/public"), join(cwd, "public"), {
    recursive: true,
  });
  const result = run("node", [script("build-static.mjs")], {
    cwd,
    env: { SITE_CONFIG_PATH: configPath },
  });
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

  for (const file of ["index.html", "404.html", "privacy.html"]) {
    expect(
      `门户 ${file} null 时不加载脚本`,
      !read(portalOff.dist, file).includes("data-website-id"),
    );
    expect(
      `门户 ${file} 有值时加载脚本`,
      read(portalOn.dist, file).includes(`data-website-id="${testId}"`),
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
  expect("隐私说明未启用版写明未启用", privacyOff.includes("未启用访问统计"));
  expect("隐私说明未启用版不含 Umami 描述", !privacyOff.includes("Umami"));
  expect("隐私说明启用版写明 Umami", privacyOn.includes("Umami"));
  expect("隐私说明启用版不写未启用", !privacyOn.includes("未启用访问统计"));
  expect(
    "隐私说明产物不留内容块标记",
    !/analytics:(?:on|off)/.test(privacyOff + privacyOn),
  );

  const invalid = buildPortal("portal-invalid", writeConfig("invalid", 123));
  expect(
    "websiteId 类型错误时构建失败并说明",
    invalid.status !== 0 && invalid.output.includes("websiteId"),
    invalid.output,
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
      "VitePress 页脚链接隐私说明",
      htmlOff.includes('href="/privacy.html"'),
    );
  }
};

const SAMPLE_MARK = "仅用于契约测试";
const fixture = join(repo, "packages/site-kit/fixtures/content");
const FIXTURE_VERSION = "0.0.0-fixture";

const productSites = () =>
  JSON.parse(readFileSync(join(repo, "site.config.json"), "utf8")).apps.filter(
    ({ dir }) => existsSync(join(repo, dir, ".vitepress/config.mjs")),
  );

const buildProduct = ({ dir }, name, contentDir) => {
  const outDir = join(tmp, name);
  const result = run(
    "pnpm",
    ["exec", "vitepress", "build", "--outDir", outDir],
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
];

const testProductSite = (site) => {
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
    const home = read(built.dist, "index.html");
    expect(
      `${name} 首页显示版本和演示入口`,
      home.includes(FIXTURE_VERSION) && home.includes(`${base}demo/`),
    );
    expect(
      `${name} 演示原样发布`,
      read(built.dist, "demo/index.html") ===
        read(join(fixture, FIXTURE_VERSION), "demo/index.html"),
    );
    const assembled = copySite(`${name}-assembled`);
    rmSync(join(assembled, base), { recursive: true });
    cpSync(built.dist, join(assembled, base), { recursive: true });
    const result = check(assembled);
    expect(`${name} 夹具产物通过站点检查`, result.status === 0, result.output);
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

  const formal = join(repo, "dist", base);
  expect(
    `${name} 正式站显示建设中`,
    read(formal, "index.html").includes("文档建设中"),
  );
  const leaked = allText(formal).find((text) => text.includes(SAMPLE_MARK));
  expect(`${name} 正式站不含夹具内容`, leaked === undefined);
};

const allText = (dir) =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(?:html|js)$/.test(entry.name))
    .map((entry) => readFileSync(join(entry.parentPath, entry.name), "utf8"));

try {
  testCheckSite();
  testAnalytics();
  productSites().forEach(testProductSite);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\n${failures.length} 项失败：\n${failures.join("\n")}`);
  process.exit(1);
}
console.log("站点测试全部通过");
