// 每个用例一个临时目录，用后必删；含隔离的 HOME 和 TMPDIR，避免读到本机配置或留下残留。
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const TEMP_PREFIX = "dc-acceptance-";

/**
 * 在临时目录中执行 fn，无论成败都清理。
 * fn 收到 { root, home, tmp, work, gitConfig }。
 */
export const withTempDir = async (label, fn, { keep = false } = {}) => {
  const root = mkdtempSync(join(tmpdir(), `${TEMP_PREFIX}${label}-`));
  const dirs = {
    root,
    home: join(root, "home"),
    tmp: join(root, "tmp"),
    work: join(root, "work"),
    gitConfig: join(root, "home", ".gitconfig"),
  };
  for (const dir of [dirs.home, dirs.tmp, dirs.work]) {
    mkdirSync(dir, { recursive: true });
  }
  // 真实用户的 git 都配好了身份，否则模板创建的提交会失败
  writeFileSync(
    dirs.gitConfig,
    "[user]\n\tname = acceptance\n\temail = acceptance@example.com\n[init]\n\tdefaultBranch = main\n",
  );
  try {
    return await fn(dirs);
  } finally {
    if (!keep) {
      rmSync(root, { recursive: true, force: true });
    }
  }
};

/** 用例进程的隔离环境：临时 HOME/TMPDIR，包管理器缓存沿用本机以免重复下载 */
export const isolatedEnv = (dirs, shared = {}) => ({
  HOME: dirs.home,
  USERPROFILE: dirs.home,
  TMPDIR: dirs.tmp,
  GIT_CONFIG_GLOBAL: dirs.gitConfig,
  // 系统级配置可能启用钥匙串等凭据助手，会让被测命令用上本机账号
  GIT_CONFIG_NOSYSTEM: "1",
  XDG_CONFIG_HOME: join(dirs.home, ".config"),
  // 需要登录的仓库立即失败，而不是卡在用户名提示上
  GIT_TERMINAL_PROMPT: "0",
  CI: "",
  ...shared,
});
