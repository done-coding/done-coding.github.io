// 项目模板：用已发布的 create-done-coding 交互创建，再按真实用户的步骤安装、构建、lint、测试。
// 只验文档选用的模板；交互界面只验证能列出模板，不枚举清单里的全部模板和分支。
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { install } from "../lib/install.mjs";
import { runStep, staticStep } from "../lib/process.mjs";
import { runInteractive } from "../lib/pty.mjs";
import { isolatedEnv, withTempDir } from "../lib/temp.mjs";

const TEMPLATE_PROMPT = "请选择模板$";
/**
 * 待验模板的唯一声明：与已发布文档选用的（不需要登录的）模板一致，逐项写明来源。
 * 条目格式：{ name: 模板名, branch: 分支或 null, source: "<文件>:<行>" }
 * 来源文件：apps/cli-site/content/<当前版本>/docs/packages/create.md（create-done-coding 的 README 导出）
 * 与 apps/*-site/content 下的其他文档。截至 cli 0.24.0，文档只写 `npm create done-coding [projectName]`，
 * 没有选用任何具体模板，所以为空；文档选用模板后在此登记，不要自行挑选。
 */
export const DOCUMENTED_TEMPLATES = [];

const BRANCH_PROMPT = "请选择模板分支";
// 「自定义模版路径」「某个git平台用户仓库」是让用户自填地址的入口，不是模板
const ENTRY_ONLY = /^(?:自定义模版路径|某个git平台用户仓库)/;

/** 多个模板共有的已知现象，合并为一份草稿 */
const SHARED_FAILURES = [
  {
    step: "测试",
    pattern: /No test files found/,
    issueKey: "templates-test-without-test-files",
    reason: "测试脚本找不到任何测试文件，以退出码 1 结束",
    expected:
      "新建项目的 `test` 脚本可以直接通过：模板自带测试，或在没有测试文件时不判失败。",
  },
  {
    step: "构建",
    pattern: /error TS2304: Cannot find name '(?:ref|computed|watch|provide)'/,
    issueKey: "templates-build-missing-auto-import-types",
    reason: "全新项目首次构建时类型检查找不到 ref、computed 等自动导入的名字",
    expected:
      "按创建完成时提示的步骤，全新项目可以直接 `pnpm run build` 成功。",
  },
];

const tagSharedFailure = (step) => {
  const known = SHARED_FAILURES.find(
    ({ step: name, pattern }) =>
      step.status !== "pass" && step.name === name && pattern.test(step.output),
  );
  return known
    ? {
        ...step,
        issueKey: known.issueKey,
        reason: known.reason,
        expected: known.expected,
      }
    : step;
};

const templateName = (label) => label.replace(/\(.*\)$/, "");

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z\d]+/g, "-")
    .replace(/^-|-$/g, "");

const createBin = (ctx) =>
  join(ctx.toolsDir, "node_modules/.bin/create-done-coding");

const enumerate = ({ ctx, dirs, name, prompt }) =>
  runInteractive({
    name,
    spec: {
      mode: "enumerate",
      argv: [createBin(ctx), "-n", "probe"],
      cwd: dirs.work,
      timeoutSec: 120,
      enumeratePrompt: prompt,
    },
    env: isolatedEnv(dirs, ctx.sharedEnv),
    replacements: ctx.replacements(dirs),
  });

/** 在列表中找出文档选用的模板，返回待验变体和列表里找不到的声明 */
export const selectDocumented = (labels, documented = DOCUMENTED_TEMPLATES) => {
  const variants = [];
  const missing = [];
  for (const { name, branch = null, source } of documented) {
    const label = labels.find((item) => templateName(item) === name);
    if (label) {
      variants.push({ label, branch, source });
    } else {
      missing.push({ name, branch, source });
    }
  }
  return { variants, missing };
};

/** 列出交互界面中的模板，返回文档选用的待验变体和发现阶段的步骤 */
export const discoverTemplates = (ctx, documented = DOCUMENTED_TEMPLATES) =>
  withTempDir("discover", async (dirs) => {
    const list = await enumerate({
      ctx,
      dirs,
      name: "列出模板",
      prompt: TEMPLATE_PROMPT,
    });
    const labels = list.parsed?.items ?? [];
    if (list.status !== "pass" || labels.length === 0) {
      return {
        variants: [],
        listed: [],
        missing: [],
        steps: [
          {
            ...list,
            status: "fail",
            reason: list.reason ?? "交互界面中没有读到任何模板",
          },
        ],
      };
    }
    const { variants, missing } = selectDocumented(labels, documented);
    return {
      variants,
      missing,
      listed: labels.filter((item) => !ENTRY_ONLY.test(item)),
      steps: [list],
    };
  });

const readPackage = (dir) => {
  const path = join(dir, "package.json");
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
};

const packageManager = (dir, pkg) => {
  if (existsSync(join(dir, "package-lock.json"))) {
    return "npm";
  }
  if (
    existsSync(join(dir, "yarn.lock")) ||
    pkg?.packageManager?.startsWith("yarn")
  ) {
    return "yarn";
  }
  return "pnpm";
};

const SCRIPT_STEPS = [
  ["构建", "build", 600_000],
  ["lint", "lint", 300_000],
  ["测试", "test", 600_000],
];

/** 单个模板变体：创建 → 安装 → 构建 → lint → 测试（有则跑） */
export const templateCase = async (ctx, { label, branch, source }) => {
  const name = templateName(label);
  const project = `acc-${slug(name)}${branch ? `-${slug(branch.split("/").at(-1))}` : ""}`;
  const title = branch ? `${name}（${branch}）` : name;
  const selects = {
    [TEMPLATE_PROMPT]: label,
    ...(branch ? { [BRANCH_PROMPT]: branch } : {}),
  };
  const reproduce = [
    `npm create done-coding@${ctx.packages["create-done-coding"]} ${project}`,
    `# 交互中选择模板「${label}」${branch ? `、分支「${branch}」` : ""}，其余问题回车取默认值`,
    `cd ${project}`,
  ];
  return withTempDir(project, async (dirs) => {
    const env = isolatedEnv(dirs, ctx.sharedEnv);
    const replacements = ctx.replacements(dirs);
    const steps = [];
    const create = await runInteractive({
      name: "创建",
      spec: {
        mode: "answer",
        argv: [createBin(ctx), "-n", project],
        cwd: dirs.work,
        timeoutSec: 300,
        selects,
        fallbackAnswer: "acceptance",
      },
      env,
      replacements,
      display: `create-done-coding -n ${project}（交互选择 ${title}）`,
    });
    // 克隆需要登录时 git 会立刻失败（运行环境关闭了交互登录），合并为一份草稿
    if (
      /could not read Username|Authentication failed|terminal prompts disabled/i.test(
        create.output,
      )
    ) {
      create.issueKey = "templates-clone-requires-login";
      create.reason = "克隆模板仓库需要登录，无法匿名获取";
      create.expected = "公开模板列表中的模板都能匿名克隆并创建项目。";
    }
    steps.push(create);
    const projectDir = join(dirs.work, project);
    const pkg = readPackage(projectDir);
    if (create.status !== "pass" || !pkg) {
      if (create.status === "pass") {
        steps[0] = {
          ...create,
          status: "fail",
          reason: "创建结束但项目目录中没有 package.json",
        };
      }
      return {
        id: `template-${project}`,
        group: "template",
        title,
        reproduce,
        steps,
      };
    }
    const manager = packageManager(projectDir, pkg);
    reproduce.push(`${manager} install`);
    const { steps: installSteps, installed } = await install({
      manager,
      cwd: projectDir,
      env,
      replacements,
      ignoredBuilds: "finding",
      issueKey: "templates-pnpm-ignored-builds",
    });
    steps.push(...installSteps);
    for (const [stepName, script, timeoutMs] of SCRIPT_STEPS) {
      if (!pkg.scripts?.[script]) {
        steps.push(
          staticStep({
            name: stepName,
            status: "absent",
            reason: `package.json 没有 ${script} 脚本`,
          }),
        );
        continue;
      }
      if (!installed) {
        steps.push(
          staticStep({
            name: stepName,
            status: "blocked",
            reason: "依赖安装失败，未执行",
            command: `${manager} run ${script}`,
          }),
        );
        continue;
      }
      reproduce.push(`${manager} run ${script}`);
      steps.push(
        tagSharedFailure(
          await runStep({
            name: stepName,
            command: manager,
            args: ["run", script],
            cwd: projectDir,
            env,
            timeoutMs,
            replacements,
          }),
        ),
      );
    }
    return {
      id: `template-${project}`,
      group: "template",
      title,
      meta: { template: name, branch, source, packageManager: manager },
      reproduce,
      steps,
    };
  });
};
