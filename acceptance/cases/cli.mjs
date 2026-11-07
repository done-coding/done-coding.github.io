// done-coding CLI 子命令冒烟：每个子命令 --help 加一条最小真实用法，用法取自 --help 与公开 README。
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runStep, staticStep } from "../lib/process.mjs";
import { runInteractive } from "../lib/pty.mjs";
import { isolatedEnv, withTempDir } from "../lib/temp.mjs";

const NEEDS_ACCOUNT = {
  publish: "真实用法会向 npm 发布，需要账号且是对外动作",
  "cc-switch": "真实用法需要模型服务的账号与 API Key",
  dex: "真实用法需要模型服务的账号与 API Key",
};

const governanceFixture = (dir) => {
  const gov = join(dir, "docs/governance");
  mkdirSync(join(gov, "backlog"), { recursive: true });
  writeFileSync(
    join(gov, "MODULES.md"),
    "# 领域模块\n\n| 领域模块 | 一句能力 | status | paths |\n|---|---|---|---|\n| `demo` | 演示 | active | `src/**` |\n",
  );
  writeFileSync(
    join(gov, "backlog/abc123-demo.md"),
    '---\nid: abc123\ntitle: 演示条目\nmodules: [demo]\ncreated: 2026-01-01\nparent: ""\n---\n\n演示。\n',
  );
};

// template init 只能交互回答，按真实用户在终端里回车取默认值的方式执行
const INTERACTIVE = new Set(["template init"]);

/** 子命令 → 最小真实用法（按顺序执行的参数列表）及准备函数 */
const USAGES = {
  create: {
    runs: [
      ["create", "template-config"],
      ["create", "instances", "ls"],
    ],
  },
  inject: { runs: [["inject", "init"], ["inject"]] },
  extract: { runs: [["extract", "init"], ["extract"]] },
  template: { runs: [["template", "init"], ["template"]] },
  component: { runs: [["component", "list"]] },
  generator: {
    runs: [
      ["generator", "list"],
      ["generator", "init", "page"],
    ],
  },
  config: { runs: [["config", "check"]] },
  harness: {
    prepare: governanceFixture,
    runs: [
      ["harness", "lists"],
      ["harness", "lists", "-c"],
      ["harness", "check"],
    ],
  },
  completion: { runs: [["completion"]] },
};

/** 从 done-coding --help 读出子命令列表 */
export const parseSubcommands = (helpText) =>
  [...helpText.matchAll(/^\s+done-coding\s+([a-z][\w-]*)\s/gm)].map(
    ([, name]) => name,
  );

/** 典型前端项目的最小结构：package.json、README.md、src/ */
const projectFixture = (dir) => {
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify(
      { name: "cli-smoke", version: "0.0.0", private: true },
      null,
      2,
    ),
  );
  writeFileSync(join(dir, "README.md"), "# cli-smoke\n");
  writeFileSync(join(dir, "src/index.ts"), "export const answer = 42;\n");
};

export const cliCases = async (ctx) => {
  const bin = join(ctx.toolsDir, "node_modules/.bin/done-coding");
  const version = ctx.packages["done-coding"];
  const help = await withTempDir("cli-help", (dirs) =>
    runStep({
      name: "列出子命令",
      command: bin,
      args: ["--help"],
      cwd: dirs.work,
      env: isolatedEnv(dirs, ctx.sharedEnv),
      replacements: ctx.replacements(dirs),
      display: "done-coding --help",
    }),
  );
  const subcommands = parseSubcommands(help.output);
  const cases = [];
  if (help.status !== "pass" || subcommands.length === 0) {
    return [
      {
        id: "cli-help",
        group: "cli",
        title: "done-coding --help",
        reproduce: [`npx -y done-coding@${version} --help`],
        steps: [
          {
            ...help,
            status: "fail",
            reason: help.reason ?? "没有解析到子命令",
          },
        ],
      },
    ];
  }
  for (const name of subcommands) {
    const usage = USAGES[name];
    const reproduce = [
      "mkdir -p cli-smoke/src && cd cli-smoke && npm init -y && echo '# cli-smoke' > README.md",
      `npx -y done-coding@${version} ${name} --help`,
    ];
    const testCase = await withTempDir(`cli-${name}`, async (dirs) => {
      const env = isolatedEnv(dirs, ctx.sharedEnv);
      const replacements = ctx.replacements(dirs);
      const cwd = join(dirs.work, "cli-smoke");
      projectFixture(cwd);
      usage?.prepare?.(cwd);
      const run = (args) =>
        INTERACTIVE.has(args.join(" "))
          ? runInteractive({
              name: args.join(" "),
              spec: {
                mode: "answer",
                argv: [bin, ...args],
                cwd,
                timeoutSec: 120,
              },
              env,
              replacements,
              display: `done-coding ${args.join(" ")}（交互，回车取默认值）`,
            })
          : runStep({
              name: args.join(" "),
              command: bin,
              args,
              cwd,
              env,
              timeoutMs: 120_000,
              replacements,
              display: `done-coding ${args.join(" ")}`,
            });
      const steps = [
        { ...(await run([name, "--help"])), name: `${name} --help` },
      ];
      if (NEEDS_ACCOUNT[name]) {
        steps.push(
          staticStep({
            name: "真实用法",
            status: "skipped",
            reason: NEEDS_ACCOUNT[name],
          }),
        );
      } else if (!usage) {
        steps.push(
          staticStep({
            name: "真实用法",
            status: "fail",
            reason: "运行器没有为这个新出现的子命令配置用法，需补充",
          }),
        );
      } else {
        for (const args of usage.runs) {
          reproduce.push(`npx -y done-coding@${version} ${args.join(" ")}`);
          const step = await run(args);
          steps.push(step);
          if (step.status !== "pass") {
            break;
          }
        }
      }
      return {
        id: `cli-${name}`,
        group: "cli",
        title: `done-coding ${name}`,
        reproduce: usage?.prepare
          ? [
              ...reproduce.slice(0, 1),
              "# 准备最小治理目录 docs/governance（MODULES.md 一个领域、backlog 一个条目）",
              ...reproduce.slice(1),
            ]
          : reproduce,
        steps,
      };
    });
    cases.push(testCase);
  }
  cases.push(await readmeUsageCase(ctx));
  return cases;
};

/** README 写的 `create-done-coding <projectName>` 与 `-c`：非交互下应进入模板选择，而不是报未知选项 */
const readmeUsageCase = (ctx) =>
  withTempDir("create-readme", async (dirs) => {
    const bin = join(ctx.toolsDir, "node_modules/.bin/create-done-coding");
    const version = ctx.packages["create-done-coding"];
    const unknownOption = (text) =>
      /无法识别|Unknown argument/i.test(text)
        ? "报未知选项，README 的用法不可用"
        : null;
    const steps = [];
    for (const args of [["acc-readme"], ["acc-readme", "-c"]]) {
      const step = await runStep({
        name: `位置参数 ${args.join(" ")}`,
        command: bin,
        args,
        cwd: dirs.work,
        env: isolatedEnv(dirs, ctx.sharedEnv),
        input: "",
        replacements: ctx.replacements(dirs),
        timeoutMs: 120_000,
        display: `create-done-coding ${args.join(" ")}`,
      });
      // 非交互模式下缺模板本应失败；只判断是否走到了模板选择这一步
      const reason = unknownOption(step.output);
      steps.push({
        ...step,
        status: reason ? "fail" : "pass",
        reason,
        expected:
          "与 README「API 文档」一致：项目名作为位置参数被接受，`-c` 是 `--justCloneFromDoneCoding` 的简写；非交互时进入模板选择并因缺少模板参数退出。",
      });
    }
    return {
      id: "cli-create-readme-usage",
      group: "cli",
      title: "create-done-coding 按 README 的位置参数用法",
      reproduce: [
        `npm create done-coding@${version} acc-readme < /dev/null`,
        `npm create done-coding@${version} acc-readme -- -c < /dev/null`,
      ],
      steps,
    };
  });
