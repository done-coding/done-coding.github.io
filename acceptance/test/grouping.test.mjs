import assert from "node:assert/strict";
import { test } from "node:test";
import { ignoredPackages } from "../lib/install.mjs";
import { issueGroups, renderIssue } from "../lib/report.mjs";

const step = (name, status, extra = {}) => ({
  name,
  status,
  command: name,
  reason: status === "pass" ? null : "退出码 1",
  summary: [],
  ...extra,
});

const results = {
  date: "2026-01-01",
  environment: {
    os: "Darwin",
    arch: "x64",
    node: "v22",
    pnpm: "12",
    npm: "11",
  },
  packages: { "create-done-coding": "1.0.0" },
};

test("issueGroups：同 issueKey 的失败合并为一份草稿，其余各自一份", () => {
  const cases = ["a", "b"].map((id) => ({
    id: `template-${id}`,
    title: id,
    reproduce: [`create ${id}`],
    steps: [
      step("安装依赖", "fail", { issueKey: "templates-pnpm-ignored-builds" }),
      step("构建", "fail"),
    ],
  }));
  const groups = issueGroups(cases);
  assert.deepEqual(
    groups.map(({ file, failures }) => [file, failures.length]),
    [
      ["templates-pnpm-ignored-builds.md", 2],
      ["template-a--build.md", 1],
      ["template-b--build.md", 1],
    ],
  );
  const draft = renderIssue(groups[0], results);
  assert.match(draft, /同一现象出现在 2 个用例中/);
  assert.match(draft, /- a \/ 安装依赖/);
  assert.match(draft, /- b \/ 安装依赖/);
  assert.match(draft, /create a/);
});

test("ignoredPackages：解析 pnpm 报出的被拦截包，含换行续写", () => {
  const output = [
    "Error: ERR_PNPM_IGNORED_BUILDS",
    "  ╰─▶ Ignored build scripts: esbuild@0.20.2, esbuild@0.23.1, vue-demi@0.14.10,",
    "      vue-demi@0.14.7",
    '  help: Run "pnpm approve-builds" to pick which dependencies',
  ].join("\n");
  assert.deepEqual(ignoredPackages(output), [
    "esbuild@0.20.2",
    "esbuild@0.23.1",
    "vue-demi@0.14.10",
    "vue-demi@0.14.7",
  ]);
  assert.deepEqual(ignoredPackages("all good"), []);
});
