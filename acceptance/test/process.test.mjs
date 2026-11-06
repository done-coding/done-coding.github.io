// process.mjs 的输出脱敏、摘要与步骤执行行为。
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  baseEnv,
  runStep,
  sanitize,
  summarizeOutput,
} from "../lib/process.mjs";

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const waitForGone = async (pid) => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      process.kill(pid, 0);
    } catch {
      return true;
    }
    await sleep(100);
  }
  return false;
};

test("sanitize：去 ANSI、替换路径与耗时", () => {
  assert.equal(
    sanitize("\u001b[31m失败\u001b[0m\r\nDone in 3.2s"),
    "失败\nDone in <t>",
  );
  assert.equal(
    sanitize("took 250ms at /tmp/dc/home", [["/tmp/dc/home", "<home>"]]),
    "took <t> at <home>",
  );
  assert.equal(
    sanitize(
      "Start at 00:41:16 clone 7a465d04-f015-42ee-b844-92306f7d6a52 exit 127",
    ),
    "Start at <clock> clone <uuid> exit 127",
  );
  assert.equal(
    sanitize(
      "╰─▶ <systmp>/dc-acceptance-\n      acc-node-server-hkZOwk/work/acc",
    ),
    "╰─▶ <tmp>/work/acc",
  );
});

test("summarizeOutput：报错行在前，再补末尾 4 行且不重复", () => {
  const text = [
    "开始",
    "安装完成",
    "warning: something",
    "Error: TS2322",
    "细节 1",
    "结束",
  ].join("\n");
  assert.deepEqual(summarizeOutput(text), [
    "Error: TS2322",
    "warning: something",
    "细节 1",
    "结束",
  ]);
  assert.deepEqual(summarizeOutput("error 1\nerror 2\nerror 3", 2), [
    "error 1",
    "error 2",
    "error 3",
  ]);
});

test("summarizeOutput：没有报错行时取末尾行", () => {
  assert.deepEqual(summarizeOutput("a\nb\nc\nd", 2), ["c", "d"]);
});

test("summarizeOutput：超长行截断", () => {
  const [line] = summarizeOutput("x".repeat(400));
  assert.equal(line, `${"x".repeat(300)}…`);
  assert.equal(line.length, 301);
});

test("runStep：命令成功返回 pass", async () => {
  const result = await runStep({
    name: "ok",
    command: process.execPath,
    args: ["-e", "process.exit(0)"],
  });
  assert.equal(result.status, "pass");
  assert.equal(result.exitCode, 0);
  assert.equal(result.reason, null);
  assert.ok(result.durationMs >= 0);
});

test("runStep：非零退出返回 fail", async () => {
  const result = await runStep({
    name: "bad",
    command: process.execPath,
    args: ["-e", "process.exit(3)"],
  });
  assert.equal(result.status, "fail");
  assert.equal(result.exitCode, 3);
  assert.equal(result.reason, "退出码 3");
});

test("runStep：check 返回原因时判 fail", async () => {
  const result = await runStep({
    name: "check",
    command: process.execPath,
    args: ["-e", 'process.stdout.write("hello")'],
    check: (text) => (text.includes("hello") ? "输出中出现了 hello" : null),
  });
  assert.equal(result.status, "fail");
  assert.equal(result.exitCode, 0);
  assert.equal(result.reason, "输出中出现了 hello");
});

test("runStep：超时返回 timeout 且确实结束", async () => {
  const started = Date.now();
  const result = await runStep({
    name: "slow",
    command: process.execPath,
    args: ["-e", "setTimeout(() => {}, 10000)"],
    timeoutMs: 300,
  });
  assert.equal(result.status, "timeout");
  assert.equal(result.exitCode, null);
  assert.match(result.reason, /未结束/);
  assert.ok(Date.now() - started < 5000);
});

test("runStep：超时会杀掉整个进程组", { timeout: 15000 }, async () => {
  const script = [
    'const { spawn } = require("node:child_process");',
    'const grandchild = spawn(process.execPath, ["-e", "setTimeout(() => {}, 30000)"], { stdio: "ignore" });',
    "console.log(grandchild.pid);",
    "setTimeout(() => {}, 30000);",
  ].join("\n");
  const result = await runStep({
    name: "group",
    command: process.execPath,
    args: ["-e", script],
    timeoutMs: 2000,
  });
  const pid = Number(result.output.trim());
  try {
    assert.equal(result.status, "timeout");
    assert.ok(
      Number.isInteger(pid) && pid > 0,
      `没有拿到孙进程 pid：${result.output}`,
    );
    assert.ok(await waitForGone(pid), `孙进程 ${pid} 在超时后仍然存活`);
  } finally {
    if (pid > 0) {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        // 已被超时清理回收
      }
    }
  }
});

test("baseEnv：去掉包管理器注入变量、凭据和 node_modules/.bin", () => {
  const env = baseEnv({
    PATH: "/repo/node_modules/.bin:/usr/bin:/opt/pnpm",
    HOME: "/home/u",
    npm_config_user_agent: "pnpm",
    npm_execpath: "/x",
    pnpm_config_verify_deps_before_run: "false",
    PNPM_PACKAGE_NAME: "repo",
    NPM_TOKEN: "secret",
    PNPM_HOME: "/opt/pnpm",
  });
  assert.deepEqual(env, {
    PATH: "/usr/bin:/opt/pnpm",
    HOME: "/home/u",
    PNPM_HOME: "/opt/pnpm",
  });
});
