import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { DOCUMENTED_TEMPLATES, selectDocumented } from "../cases/templates.mjs";

const repo = resolve(import.meta.dirname, "../..");
const labels = ["template-a(2个细分分支)", "template-b", "自定义模版路径"];

test("selectDocumented：只取文档选用的模板，列表里的其余模板不进待验集合", () => {
  const { variants, missing } = selectDocumented(labels, [
    { name: "template-a", branch: "template/standalone", source: "x.md:1" },
    { name: "template-b", source: "x.md:2" },
  ]);
  assert.deepEqual(variants, [
    {
      label: "template-a(2个细分分支)",
      branch: "template/standalone",
      source: "x.md:1",
    },
    { label: "template-b", branch: null, source: "x.md:2" },
  ]);
  assert.deepEqual(missing, []);
});

test("selectDocumented：文档选用的模板不在列表里时单列为缺失", () => {
  const { variants, missing } = selectDocumented(labels, [
    { name: "template-gone", branch: null, source: "x.md:3" },
  ]);
  assert.deepEqual(variants, []);
  assert.deepEqual(missing, [
    { name: "template-gone", branch: null, source: "x.md:3" },
  ]);
});

test("selectDocumented：没有声明时待验集合为空，不回落到枚举全部", () => {
  assert.deepEqual(selectDocumented(labels, []), {
    variants: [],
    missing: [],
  });
});

test("DOCUMENTED_TEMPLATES：每项都写明存在的来源文件与行，且文件里确有该模板名", () => {
  for (const { name, source } of DOCUMENTED_TEMPLATES) {
    const [file, line] = source.split(/:(?=\d+$)/);
    assert.ok(existsSync(resolve(repo, file)), `${source} 的文件不存在`);
    const lines = readFileSync(resolve(repo, file), "utf8").split("\n");
    assert.ok(
      lines[Number(line) - 1]?.includes(name),
      `${source} 处没有 ${name}`,
    );
  }
});
