// report.mjs 的纯函数与本地写出行为。
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  caseStatus,
  failedSteps,
  finalizeCase,
  issueName,
  renderReport,
  totals,
  writeOutputs,
} from "../lib/report.mjs";

const ENVIRONMENT = {
  os: "darwin",
  arch: "arm64",
  memoryGB: 16,
  node: "v24.0.0",
  pnpm: "12.0.0",
  npm: "11.0.0",
};

const makeStep = (name, status, extra = {}) => ({
  name,
  command: `run ${name}`,
  status,
  exitCode: status === "pass" ? 0 : 1,
  durationMs: 5,
  reason: extra.reason ?? null,
  summary: extra.summary ?? [],
  output: extra.output ?? "",
  ...extra,
});

const makeCase = (id, steps, extra = {}) => ({
  id,
  group: "demo",
  title: id,
  versions: {},
  reproduce: ["pnpm test"],
  steps,
  ...extra,
});

const makeResults = (cases) => ({
  date: "2026-11-05",
  environment: ENVIRONMENT,
  packages: { "done-coding": "1.0.0" },
  cases,
});

test("caseStatus：fail/timeout 判失败，全部 skipped 才跳过", () => {
  assert.equal(caseStatus([makeStep("build", "pass")]), "pass");
  assert.equal(caseStatus([makeStep("build", "fail")]), "fail");
  assert.equal(
    caseStatus([makeStep("build", "pass"), makeStep("lint", "timeout")]),
    "fail",
  );
  assert.equal(
    caseStatus([makeStep("a", "skipped"), makeStep("b", "skipped")]),
    "skipped",
  );
  assert.equal(
    caseStatus([makeStep("a", "skipped"), makeStep("b", "pass")]),
    "pass",
  );
  assert.equal(caseStatus([makeStep("build", "absent")]), "pass");
  assert.equal(caseStatus([makeStep("build", "blocked")]), "pass");
});

test("totals：按状态累计并保留全部初始键", () => {
  assert.deepEqual(
    totals([
      { status: "pass" },
      { status: "pass" },
      { status: "fail" },
      { status: "skipped" },
    ]),
    { pass: 2, fail: 1, skipped: 1 },
  );
});

test("failedSteps 与 issueName：只收 fail/timeout 并生成草稿名", () => {
  const failing = makeCase("forge-consumer", [
    makeStep("vite build", "fail", { reason: "退出码 1" }),
    makeStep("typecheck", "pass"),
  ]);
  const timedOut = makeCase("cli-gen", [
    makeStep("generator --help", "timeout", { reason: "超时" }),
  ]);
  const skipped = makeCase("cli-x", [
    makeStep("real usage", "skipped", { reason: "需要账号" }),
  ]);
  const failures = failedSteps([failing, timedOut, skipped]);
  assert.deepEqual(
    failures.map(({ step, file }) => [step.name, file]),
    [
      ["vite build", "forge-consumer--vite-build.md"],
      ["generator --help", "cli-gen--generator-help.md"],
    ],
  );
  assert.equal(
    issueName({ id: "Case ID" }, { name: "Build Step" }),
    "case-id--build-step",
  );
});

test("finalizeCase：状态取步骤结果，公开步骤去掉 output 与 parsed", () => {
  const raw = makeCase("demo", [
    {
      ...makeStep("build", "pass", { output: "raw output" }),
      parsed: { ok: true },
    },
  ]);
  const finalized = finalizeCase(raw);
  assert.equal(finalized.status, "pass");
  assert.ok(!("output" in finalized.steps[0]));
  assert.ok(!("parsed" in finalized.steps[0]));
  assert.equal(raw.steps[0].output, "raw output");
  assert.deepEqual(raw.steps[0].parsed, { ok: true });
});

test("finalizeCase：通过的步骤不留摘要，失败的保留", () => {
  const finalized = finalizeCase(
    makeCase("demo", [
      makeStep("install", "pass", { summary: ["138 entries"] }),
      makeStep("build", "fail", { summary: ["error TS2304"] }),
    ]),
  );
  assert.deepEqual(finalized.steps[0].summary, []);
  assert.deepEqual(finalized.steps[1].summary, ["error TS2304"]);
});

test("renderReport：计数与 results 一致，失败项带草稿链接", () => {
  const passCase = makeCase("case-a", [makeStep("build", "pass")], {
    title: "用例 A",
  });
  const failCase = makeCase(
    "case-b",
    [makeStep("build", "fail", { reason: "退出码 1" })],
    { title: "用例 B" },
  );
  const skipCase = makeCase(
    "case-c",
    [makeStep("real usage", "skipped", { reason: "需要账号" })],
    { title: "用例 C" },
  );
  const absentCase = makeCase(
    "case-d",
    [makeStep("lint", "absent", { reason: "没有 lint 脚本" })],
    { title: "用例 D" },
  );
  const results = {
    ...makeResults(
      [passCase, failCase, skipCase, absentCase].map((item) =>
        finalizeCase(item),
      ),
    ),
    groupTitles: { demo: "演示分组" },
    notes: ["一条观察"],
  };
  const report = renderReport(results);
  const sum = totals(results.cases);
  assert.equal(sum.pass, 2);
  assert.equal(sum.fail, 1);
  assert.equal(sum.skipped, 1);
  assert.ok(
    report.includes(
      `结果：4 个用例，通过 ${sum.pass}，失败 ${sum.fail}，跳过 ${sum.skipped}。`,
    ),
  );
  assert.ok(report.includes("## 演示分组"));
  assert.ok(
    report.includes("[issues/case-b--build.md](issues/case-b--build.md)"),
  );
  assert.match(report, /## 跳过项[\s\S]*需要账号/);
  assert.match(report, /## 未提供的脚本[\s\S]*没有 lint 脚本/);
  assert.ok(report.includes("- 一条观察"));
});

test("writeOutputs：写文件、不覆盖已有草稿、失败消失后标记 stale", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "dc-acceptance-report-test-"));
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const failingCase = makeCase("demo-case", [
    makeStep("build", "fail", {
      reason: "退出码 1",
      summary: ["boom"],
      output: "raw output",
    }),
  ]);
  const failingResults = makeResults([finalizeCase(failingCase)]);
  const first = writeOutputs(dir, failingResults, [failingCase]);
  assert.deepEqual(first.written, ["demo-case--build.md"]);
  assert.deepEqual(first.stale, []);

  const issuePath = join(dir, "issues", "demo-case--build.md");
  assert.ok(existsSync(issuePath));
  assert.match(readFileSync(issuePath, "utf8"), /退出码 1/);
  assert.ok(existsSync(join(dir, "report.md")));

  const jsonText = readFileSync(join(dir, "results.json"), "utf8");
  const json = JSON.parse(jsonText);
  assert.ok(!("output" in json.cases[0].steps[0]));
  assert.ok(!("parsed" in json.cases[0].steps[0]));
  assert.ok(!jsonText.includes('"output"'));

  const changedCase = makeCase("demo-case", [
    makeStep("build", "fail", {
      reason: "新的原因",
      summary: ["boom again"],
      output: "raw output 2",
    }),
  ]);
  const second = writeOutputs(dir, makeResults([finalizeCase(changedCase)]), [
    changedCase,
  ]);
  assert.deepEqual(second.written, []);
  assert.deepEqual(second.stale, []);
  const kept = readFileSync(issuePath, "utf8");
  assert.match(kept, /退出码 1/);
  assert.ok(!kept.includes("新的原因"));

  const passingCase = makeCase("demo-case", [makeStep("build", "pass")]);
  const third = writeOutputs(dir, makeResults([finalizeCase(passingCase)]), [
    passingCase,
  ]);
  assert.deepEqual(third.written, []);
  assert.deepEqual(third.stale, ["demo-case--build.md"]);
});
