// 汇总用例结果，生成 results.json、report.md 和问题草稿。
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FAILED = new Set(["fail", "timeout"]);

/** 用例状态：任一步失败即失败；全部步骤跳过才算跳过 */
export const caseStatus = (steps) => {
  if (steps.some((step) => FAILED.has(step.status))) {
    return "fail";
  }
  if (steps.length > 0 && steps.every((step) => step.status === "skipped")) {
    return "skipped";
  }
  return "pass";
};

// 通过的步骤不留输出摘要：并行脚本的输出顺序、依赖解析数量每次都可能不同
const publicStep = (step) => {
  const copy = { ...step };
  delete copy.output;
  delete copy.parsed;
  if (copy.status === "pass") {
    copy.summary = [];
  }
  return copy;
};

export const finalizeCase = (testCase) => ({
  ...testCase,
  status: caseStatus(testCase.steps),
  // 完整输出只用于生成草稿，不进 results.json
  steps: testCase.steps.map(publicStep),
});

export const totals = (cases) =>
  cases.reduce(
    (sum, { status }) => ({ ...sum, [status]: (sum[status] ?? 0) + 1 }),
    { pass: 0, fail: 0, skipped: 0 },
  );

const STATUS_TEXT = {
  pass: "通过",
  fail: "失败",
  timeout: "超时",
  skipped: "跳过",
  absent: "无此脚本",
  blocked: "未执行",
};

const cell = (value) => String(value ?? "").replace(/\|/g, "\\|");

const STEP_KEYS = {
  创建: "create",
  安装依赖: "install",
  构建: "build",
  测试: "test",
  真实用法: "usage",
  列出模板: "list",
  列出子命令: "help",
};

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z\d]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** 失败步骤对应的问题草稿文件名，中文步骤名映射为稳定的英文键 */
export const issueName = (testCase, step) =>
  `${slug(testCase.id)}--${slug(STEP_KEYS[step.name] ?? step.name) || "step"}`;

/** 失败步骤，带草稿文件名；同 issueKey 的失败指向同一份草稿 */
export const failedSteps = (cases) =>
  cases.flatMap((testCase) =>
    testCase.steps
      .filter((step) => FAILED.has(step.status))
      .map((step) => ({
        testCase,
        step,
        file: `${step.issueKey ?? issueName(testCase, step)}.md`,
      })),
  );

/** 按草稿文件归并失败，一份草稿对应一组同因失败 */
export const issueGroups = (cases) => {
  const groups = new Map();
  for (const failure of failedSteps(cases)) {
    const list = groups.get(failure.file) ?? [];
    list.push(failure);
    groups.set(failure.file, list);
  }
  return [...groups].map(([file, failures]) => ({ file, failures }));
};

export const renderReport = (results) => {
  const { cases } = results;
  const sum = totals(cases);
  const groups = [...new Set(cases.map((testCase) => testCase.group))];
  const lines = [
    `# 黑盒验收报告 ${results.date}`,
    "",
    "> 由 `pnpm acceptance` 生成，与同目录 results.json 一致；不要手改。",
    "",
    `环境：${results.environment.os} ${results.environment.arch}，内存 ${results.environment.memoryGB} GB，Node ${results.environment.node}，pnpm ${results.environment.pnpm}，npm ${results.environment.npm}。`,
    "",
    `被测版本：${Object.entries(results.packages)
      .map(([name, version]) => `\`${name}@${version}\``)
      .join("、")}。`,
    "",
    `结果：${cases.length} 个用例，通过 ${sum.pass}，失败 ${sum.fail}，跳过 ${sum.skipped}。`,
  ];
  if (results.notes?.length > 0) {
    lines.push("", ...results.notes.map((note) => `- ${note}`));
  }
  for (const group of groups) {
    lines.push("", `## ${results.groupTitles?.[group] ?? group}`, "");
    lines.push("| 用例 | 结果 | 步骤 |", "|---|---|---|");
    for (const testCase of cases.filter((item) => item.group === group)) {
      const steps = testCase.steps
        .map((step) => `${step.name} ${STATUS_TEXT[step.status]}`)
        .join("；");
      lines.push(
        `| ${cell(testCase.title)} | ${STATUS_TEXT[testCase.status]} | ${cell(steps)} |`,
      );
    }
  }
  const skipped = cases.flatMap((testCase) =>
    testCase.steps
      .filter((step) => step.status === "skipped")
      .map((step) => `- ${testCase.title} / ${step.name}：${step.reason}`),
  );
  if (skipped.length > 0) {
    lines.push("", "## 跳过项", "", ...skipped);
  }
  const absent = cases.flatMap((testCase) =>
    testCase.steps
      .filter((step) => step.status === "absent")
      .map((step) => `- ${testCase.title} / ${step.name}：${step.reason}`),
  );
  if (absent.length > 0) {
    lines.push("", "## 未提供的脚本", "", ...absent);
  }
  const failures = failedSteps(cases);
  if (failures.length > 0) {
    lines.push("", "## 失败与问题草稿", "");
    for (const { testCase, step, file } of failures) {
      lines.push(
        `- ${testCase.title} / ${step.name}：${step.reason} → [issues/${file}](issues/${file})`,
      );
    }
  }
  const notes = cases.flatMap((testCase) =>
    (testCase.notes ?? []).map((note) => `- ${testCase.title}：${note}`),
  );
  if (notes.length > 0) {
    lines.push("", "## 观察", "", ...notes);
  }
  return `${lines.join("\n")}\n`;
};

export const renderIssue = ({ failures }, results) => {
  const [{ testCase, step }] = failures;
  const affected =
    failures.length > 1
      ? [
          "",
          `同一现象出现在 ${failures.length} 个用例中：`,
          "",
          ...failures.map(
            (failure) =>
              `- ${failure.testCase.title} / ${failure.step.name}：${failure.step.reason}`,
          ),
        ]
      : [];
  return [
    `# ${failures.length > 1 ? `${step.reason}（${failures.length} 个用例）` : `${testCase.title}：${step.name}失败`}`,
    "",
    "> 黑盒验收自动生成的草稿，定稿前由协调者复核归因；只写现象，不猜实现原因。",
    "",
    "## 现象",
    "",
    `${step.reason}。`,
    ...affected,
    "",
    "## 复现命令",
    "",
    ...(failures.length > 1 ? [`以「${testCase.title}」为例：`, ""] : []),
    "```bash",
    ...(testCase.reproduce ?? []),
    "```",
    "",
    "## 期望",
    "",
    step.expected ?? "命令成功结束，退出码为 0。",
    "",
    "## 实际",
    "",
    `运行 \`${step.command}\`：${step.reason}。输出摘要：`,
    "",
    "```text",
    ...step.summary,
    "```",
    "",
    "## 环境",
    "",
    `- ${results.environment.os} ${results.environment.arch}，Node ${results.environment.node}，pnpm ${results.environment.pnpm}，npm ${results.environment.npm}`,
    `- 被测版本：${Object.entries(testCase.versions ?? results.packages)
      .map(([name, version]) => `${name}@${version}`)
      .join("、")}`,
    `- 验收日期：${results.date}，临时目录与隔离的 HOME，无全局安装`,
    "",
  ].join("\n");
};

/**
 * 写出结果。已有草稿不覆盖（协调者可能已定稿），返回新写入的草稿和已过时的草稿。
 */
export const writeOutputs = (dir, results, rawCases) => {
  const issuesDir = join(dir, "issues");
  mkdirSync(issuesDir, { recursive: true });
  writeFileSync(
    join(dir, "results.json"),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  writeFileSync(join(dir, "report.md"), renderReport(results));
  const groups = issueGroups(rawCases);
  const written = [];
  for (const group of groups) {
    const path = join(issuesDir, group.file);
    if (!existsSync(path)) {
      writeFileSync(path, renderIssue(group, results));
      written.push(group.file);
    }
  }
  const expected = new Set(groups.map(({ file }) => file));
  const stale = readdirSync(issuesDir).filter(
    (file) => file.endsWith(".md") && !expected.has(file),
  );
  return { written, stale };
};
