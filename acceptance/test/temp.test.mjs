// temp.mjs 的临时目录生命周期与隔离环境。
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { isolatedEnv, withTempDir } from "../lib/temp.mjs";

test("withTempDir：返回 fn 的返回值并清理目录", async () => {
  let root = "";
  const value = await withTempDir("unit-return", (dirs) => {
    root = dirs.root;
    assert.ok(existsSync(dirs.home));
    assert.ok(existsSync(dirs.tmp));
    assert.ok(existsSync(dirs.work));
    assert.match(readFileSync(dirs.gitConfig, "utf8"), /name = acceptance/);
    return { answer: 42 };
  });
  assert.deepEqual(value, { answer: 42 });
  assert.notEqual(root, "");
  assert.equal(existsSync(root), false);
});

test("withTempDir：fn 抛错时也清理目录", async () => {
  let root = "";
  await assert.rejects(
    withTempDir("unit-throw", (dirs) => {
      root = dirs.root;
      throw new Error("boom");
    }),
    /boom/,
  );
  assert.notEqual(root, "");
  assert.equal(existsSync(root), false);
});

test("isolatedEnv：HOME、TMPDIR 指向临时目录，不读系统 git 配置", async () => {
  await withTempDir("unit-env", (dirs) => {
    const env = isolatedEnv(dirs);
    assert.equal(env.HOME, dirs.home);
    assert.equal(env.TMPDIR, dirs.tmp);
    assert.equal(env.USERPROFILE, dirs.home);
    assert.equal(env.GIT_CONFIG_GLOBAL, dirs.gitConfig);
    assert.equal(env.GIT_CONFIG_NOSYSTEM, "1");
    assert.equal(env.GIT_TERMINAL_PROMPT, "0");
    assert.equal(env.CI, "");
    assert.equal(isolatedEnv(dirs, { CI: "1" }).CI, "1");
  });
});
