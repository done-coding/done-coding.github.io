// 项目模板：用已发布的 create-done-coding 交互创建，再按真实用户的步骤安装、构建、lint、测试。
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { install } from "../lib/install.mjs";
import { runStep, staticStep } from "../lib/process.mjs";
import { runInteractive } from "../lib/pty.mjs";
import { isolatedEnv, withTempDir } from "../lib/temp.mjs";

const TEMPLATE_PROMPT = "请选择模板$";
const BRANCH_PROMPT = "请选择模板分支";
// 「自定义模版路径」「某个git平台用户仓库」是让用户自填地址的入口，不是模板
const ENTRY_ONLY = /^(?:自定义模版路径|某个git平台用户仓库)/;
const MULTI_BRANCH = /\(\d+个细分分支\)$/;

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

/** 枚举全部模板及其分支，返回 [{label, branch}] 和发现阶段的步骤 */
export const discoverTemplates = (ctx) =>
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
        entries: [],
        steps: [
          {
            ...list,
            status: "fail",
            reason: list.reason ?? "交互界面中没有读到任何模板",
          },
        ],
      };
    }
    const variants = [];
    const steps = [list];
    for (const label of labels.filter((item) => !ENTRY_ONLY.test(item))) {
      if (!MULTI_BRANCH.test(label)) {
        variants.push({ label, branch: null });
        continue;
      }
      // 枚举分支要先选中模板，pty 驱动按 selects 处理前面的问题
      const branches = await runInteractive({
        name: `列出 ${templateName(label)} 的分支`,
        spec: {
          mode: "enumerate",
          argv: [createBin(ctx), "-n", "probe"],
          cwd: dirs.work,
          timeoutSec: 120,
          enumeratePrompt: BRANCH_PROMPT,
          preSelects: { [TEMPLATE_PROMPT]: label },
        },
        env: isolatedEnv(dirs, ctx.sharedEnv),
        replacements: ctx.replacements(dirs),
      });
      steps.push(branches);
      for (const branch of branches.parsed?.items ?? []) {
        variants.push({ label, branch });
      }
    }
    return {
      variants,
      entries: labels.filter((item) => ENTRY_ONLY.test(item)),
      steps,
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
export const templateCase = async (ctx, { label, branch }) => {
  const name = templateName(label);
  const project = `acc-${slug(name)}${branch ? `-${slug(branch.split("/").at(-1))}` : ""}`;
  const title = branch ? `${name}（${branch}）` : name;
  const selects = {
    [TEMPLATE_PROMPT]: label,
    ...(branch ? { [BRANCH_PROMPT]: branch } : {}),
  };
  const reproduce = [
    `npx -y create-done-coding@${ctx.packages["create-done-coding"]} -n ${project}`,
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
      meta: { template: name, branch, packageManager: manager },
      reproduce,
      steps,
    };
  });
};
