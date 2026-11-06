// forge 诊断归类与 CLI --help 子命令解析。
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSubcommands } from "../cases/cli.mjs";
import {
  diagnosticOwner,
  groupDiagnostics,
  splitDiagnostics,
} from "../cases/forge.mjs";

test("diagnosticOwner：按 node_modules 下的包名归类", () => {
  assert.equal(
    diagnosticOwner(
      "node_modules/.pnpm/a@1/node_modules/@done-coding/forge-core/x.d.ts",
    ),
    "@done-coding/forge-core",
  );
  assert.equal(
    diagnosticOwner("node_modules/element-plus/x.d.ts"),
    "element-plus",
  );
  assert.equal(diagnosticOwner("src/main.ts"), "consumer");
});

test("groupDiagnostics：按归属计数，并保留 forge/消费者诊断原文", () => {
  const output = [
    "src/main.ts(1,2): error TS2322: Type 'string' is not assignable.",
    "node_modules/@done-coding/forge-core/x.d.ts(3,4): error TS1005: ';' expected.",
    "node_modules/element-plus/x.d.ts(5,6): error TS2339: Property does not exist.",
    "src/App.vue(7,8): error TS2304: Cannot find name 'x'.",
    "not a diagnostic",
    "  src/indented.ts(9,10): error TS1111: ignored",
  ];
  assert.deepEqual(groupDiagnostics(output.join("\n")), {
    byOwner: {
      consumer: 2,
      "@done-coding/forge-core": 1,
      "element-plus": 1,
    },
    forgeLines: [
      "src/main.ts(1,2): error TS2322: Type 'string' is not assignable.",
      "@done-coding/forge-core/x.d.ts(3,4): error TS1005: ';' expected.",
      "src/App.vue(7,8): error TS2304: Cannot find name 'x'.",
    ],
  });
});

test("splitDiagnostics：@done-coding/* 与 consumer 归 forge", () => {
  assert.deepEqual(
    splitDiagnostics({
      consumer: 2,
      "@done-coding/forge-core": 1,
      "element-plus": 1,
      vue: 3,
    }),
    {
      forge: { consumer: 2, "@done-coding/forge-core": 1 },
      thirdParty: { "element-plus": 1, vue: 3 },
    },
  );
});

test("parseSubcommands：从 --help 文本读出子命令", () => {
  const help = [
    "Usage: done-coding <command> [options]",
    "",
    "命令：",
    "  done-coding create [dir]       创建项目",
    "  done-coding inject             注入",
    "  done-coding extract            抽取",
    "  done-coding template           模板",
    "  done-coding component          组件",
    "  done-coding generator          生成器",
    "  done-coding config             配置",
    "  done-coding harness            治理",
    "  done-coding cc-switch          切换",
    "  done-coding completion         补全",
    "  done-coding --help             显示帮助",
    "",
  ].join("\n");
  assert.deepEqual(parseSubcommands(help), [
    "create",
    "inject",
    "extract",
    "template",
    "component",
    "generator",
    "config",
    "harness",
    "cc-switch",
    "completion",
  ]);
});
