// 黑盒验收入口：pnpm acceptance [--group=template,forge,cli] [--only=<用例标题片段>] [--keep]
// 只用 npm 上已发布的包和公开模板；用例串行，各自在临时目录中从零开始。
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { arch, release, tmpdir, totalmem, type } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { cliCases } from "./cases/cli.mjs";
import { forgeCase } from "./cases/forge.mjs";
import { discoverTemplates, templateCase } from "./cases/templates.mjs";
import { finalizeCase, totals, writeOutputs } from "./lib/report.mjs";
import { TEMP_PREFIX } from "./lib/temp.mjs";

const { values: args } = parseArgs({
  options: {
    group: { type: "string", default: "template,forge,cli" },
    only: { type: "string" },
    keep: { type: "boolean", default: false },
    out: { type: "string" },
  },
});
const groups = new Set(args.group.split(","));
const repo = resolve(import.meta.dirname, "..");
const log = (message) => process.stderr.write(`[acceptance] ${message}\n`);

const capture = (command, commandArgs, options = {}) =>
  execFileSync(command, commandArgs, { encoding: "utf8", ...options }).trim();

const latest = (name) => capture("npm", ["view", name, "version"]);

// 项目里的日期都按北京时间记
const date = new Date().toLocaleDateString("sv-SE", {
  timeZone: "Asia/Shanghai",
});
const outDir = args.out
  ? resolve(args.out)
  : join(repo, "docs/governance/audits/acceptance", date);

const toolsDir = mkdtempSync(join(tmpdir(), `${TEMP_PREFIX}tools-`));
const installedVersion = (name) =>
  JSON.parse(
    readFileSync(join(toolsDir, "node_modules", name, "package.json"), "utf8"),
  ).version;

const realPath = (path) => {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
};

try {
  log(`安装被测 CLI 到临时目录`);
  capture("npm", ["init", "-y"], { cwd: toolsDir });
  capture(
    "npm",
    [
      "install",
      "--no-audit",
      "--no-fund",
      "create-done-coding@latest",
      "done-coding@latest",
    ],
    { cwd: toolsDir },
  );
  const packages = {
    "create-done-coding": installedVersion("create-done-coding"),
    "done-coding": installedVersion("done-coding"),
  };

  // vue-tsc 依赖 TypeScript 的 JS API，取最新的 5.x，避免把工具链不兼容算到 forge 头上
  const typescript5 = JSON.parse(
    capture("npm", ["view", "typescript@5", "version", "--json"]),
  ).at(-1);
  const forgeToolchain = groups.has("forge")
    ? {
        "@done-coding/forge": latest("@done-coding/forge"),
        vue: latest("vue"),
        vite: latest("vite"),
        "@vitejs/plugin-vue": latest("@vitejs/plugin-vue"),
        "vue-tsc": latest("vue-tsc"),
        typescript: typescript5,
      }
    : null;
  if (forgeToolchain) {
    packages["@done-coding/forge"] = forgeToolchain["@done-coding/forge"];
  }

  // 包管理器缓存沿用本机，项目目录和配置仍从零开始
  const sharedEnv = {
    npm_config_store_dir: capture("pnpm", ["store", "path"]),
    npm_config_cache: capture("npm", ["config", "get", "cache"]),
  };
  const ctx = {
    toolsDir,
    packages,
    forgeToolchain,
    sharedEnv,
    replacements: (dirs) => [
      [realPath(dirs.root), "<tmp>"],
      [dirs.root, "<tmp>"],
      [realPath(toolsDir), "<tools>"],
      [toolsDir, "<tools>"],
      // 折行的长路径不会整体命中上面几项，至少去掉本机的系统临时目录
      [realPath(tmpdir()), "<systmp>"],
      [tmpdir(), "<systmp>"],
      [repo, "<repo>"],
      [process.env.HOME, "~"],
    ],
  };
  const matches = (title) => !args.only || title.includes(args.only);

  const rawCases = [];
  const record = (testCase) => {
    rawCases.push(testCase);
    const failed = testCase.steps.filter((step) =>
      ["fail", "timeout"].includes(step.status),
    );
    log(
      `${failed.length > 0 ? "失败" : "完成"}：${testCase.title}${failed.length > 0 ? `（${failed.map((step) => step.name).join("、")}）` : ""}`,
    );
  };
  const notes = [];

  if (groups.has("template")) {
    log("枚举模板");
    const discovery = await discoverTemplates(ctx);
    record({
      id: "template-discovery",
      group: "template",
      title: "列出全部模板",
      reproduce: [
        `npx -y create-done-coding@${packages["create-done-coding"]} -n probe`,
        "# 在交互界面中查看「请选择模板」与各模板的「请选择模板分支」",
      ],
      steps: discovery.steps,
      notes: [
        `发现 ${discovery.variants.length} 个模板变体；${discovery.entries.length > 0 ? `「${discovery.entries.join("」「")}」是自填地址的入口，不是模板，未纳入矩阵` : "没有自填地址入口"}。`,
        "非交互模式没有列出模板的参数，只能在交互界面中查看；本运行器用伪终端读取。",
      ],
    });
    for (const variant of discovery.variants) {
      const title = variant.branch
        ? `${variant.label}（${variant.branch}）`
        : variant.label;
      if (!matches(title)) {
        continue;
      }
      log(`模板：${title}`);
      record(await templateCase(ctx, variant));
    }
  }
  if (groups.has("forge") && matches("forge")) {
    log("forge 消费者");
    record(await forgeCase(ctx));
    notes.push(
      `forge 消费者的 TypeScript 取 5.x 最新版 ${typescript5}，因为 vue-tsc 依赖 TypeScript 的 JS API。`,
    );
  }
  if (groups.has("cli")) {
    log("cli 子命令");
    for (const testCase of await cliCases(ctx)) {
      if (matches(testCase.title)) {
        record(testCase);
      }
    }
  }

  const cases = rawCases.map(finalizeCase);
  const results = {
    schemaVersion: 1,
    date,
    environment: {
      os: `${type()} ${release()}`,
      arch: arch(),
      memoryGB: Math.round(totalmem() / 2 ** 30),
      node: process.version,
      pnpm: capture("pnpm", ["--version"]),
      npm: capture("npm", ["--version"]),
      git: capture("git", ["--version"]).replace("git version ", ""),
      python: capture("python3", ["--version"]).replace("Python ", ""),
    },
    packages,
    forgeToolchain,
    groupTitles: {
      template: "项目模板",
      forge: "forge 消费者",
      cli: "cli 子命令",
    },
    filter: { groups: [...groups], only: args.only ?? null },
    notes,
    totals: totals(cases),
    cases,
  };
  mkdirSync(outDir, { recursive: true });
  const { written, stale } = writeOutputs(outDir, results, rawCases);
  log(`结果：${JSON.stringify(results.totals)}，写入 ${outDir}`);
  if (written.length > 0) {
    log(`新问题草稿：${written.join("、")}`);
  }
  if (stale.length > 0) {
    log(`以下草稿对应的失败本次未出现，请复核：${stale.join("、")}`);
  }
  process.exitCode = results.totals.fail > 0 ? 1 : 0;
} finally {
  if (!args.keep) {
    rmSync(toolsDir, { recursive: true, force: true });
  }
}
