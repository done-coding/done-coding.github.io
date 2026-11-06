// 运行单个验收步骤：限时、整组进程回收、输出脱敏后只留摘要。
import { spawn } from "node:child_process";
import { TEMP_PREFIX } from "./temp.mjs";

const ANSI = /\x1b\[[0-9;?]*[A-Za-z]|\x1b[78]/g;
const DURATION = /\b\d+(?:\.\d+)?\s?(?:ms|s|m)\b/g;
const CLOCK = /\b\d{2}:\d{2}:\d{2}\b/g;
// 被折行的用例临时目录（随机后缀与前缀不在同一行），整体换成 <tmp>
const WRAPPED_TEMP = new RegExp(
  `<systmp>/${TEMP_PREFIX}[\\w\\s-]*?-[A-Za-z\\d]{6}/`,
  "g",
);
const UUID = /\b[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\b/gi;
const ERROR_LINE = /error|错误|失败|failed|ERR!|ERR_|✖|cannot|not found|无法/i;

// 由 pnpm/npm 脚本启动时注入的变量，以及任何凭据，不传给被测命令
const LEAKED_ENV = /^(?:npm_|pnpm_|PNPM_PACKAGE_NAME$)/;
const CREDENTIAL = /TOKEN|SECRET|PASSWORD/i;

/**
 * 被测命令的基础环境：去掉包管理器脚本注入的变量、凭据和 PATH 中的 node_modules/.bin，
 * 无论用 `pnpm acceptance` 还是 `node acceptance/run.mjs` 启动，被测命令看到的环境都相同。
 */
export const baseEnv = (source = process.env) => {
  const env = Object.fromEntries(
    Object.entries(source).filter(
      ([key]) => !LEAKED_ENV.test(key) && !CREDENTIAL.test(key),
    ),
  );
  if (env.PATH) {
    env.PATH = env.PATH.split(":")
      .filter((entry) => !/[\\/]node_modules[\\/]\.bin$/.test(entry))
      .join(":");
  }
  return env;
};

/** 替换临时目录、家目录、耗时、时刻和随机 ID，保证重复运行结果一致 */
export const sanitize = (text, replacements = []) => {
  let output = text.replace(ANSI, "").replace(/\r/g, "");
  for (const [from, to] of replacements) {
    if (from) {
      output = output.split(from).join(to);
    }
  }
  return output
    .replace(WRAPPED_TEMP, "<tmp>/")
    .replace(DURATION, "<t>")
    .replace(CLOCK, "<clock>")
    .replace(UUID, "<uuid>");
};

/** 报错行优先，再补末尾几行（常含报错的细节）；没有报错行时只取末尾 */
export const summarizeOutput = (text, limit = 8) => {
  const lines = text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "");
  const errors = lines.filter((line) => ERROR_LINE.test(line)).slice(0, limit);
  const tail = lines.slice(-(errors.length > 0 ? 4 : limit));
  const picked = [...new Set([...errors, ...tail])];
  return picked.map((line) =>
    line.length > 300 ? `${line.slice(0, 300)}…` : line,
  );
};

/**
 * 执行命令并返回步骤结果。超时后杀掉整个进程组，避免残留子进程。
 * check 可进一步判定输出（返回失败原因字符串表示不通过）。
 */
export const runStep = ({
  name,
  command,
  args = [],
  cwd,
  env = {},
  timeoutMs = 300_000,
  input,
  replacements = [],
  check,
  display,
}) =>
  new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, args, {
      cwd,
      env: { ...baseEnv(), ...env },
      detached: true,
      stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
    });
    let output = "";
    let timedOut = false;
    const collect = (chunk) => {
      output += chunk;
      if (output.length > 2_000_000) {
        output = output.slice(-1_000_000);
      }
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    if (input !== undefined) {
      child.stdin.end(input);
    }
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    }, timeoutMs);
    const finish = (exitCode, spawnError) => {
      clearTimeout(timer);
      const text = sanitize(
        spawnError ? `${output}\n${spawnError.message}` : output,
        replacements,
      );
      const reason = timedOut
        ? `超过 ${Math.round(timeoutMs / 1000)} 秒未结束`
        : exitCode !== 0
          ? `退出码 ${exitCode}`
          : check?.(text) || null;
      resolve({
        name,
        command:
          display ?? sanitize([command, ...args].join(" "), replacements),
        status: timedOut ? "timeout" : reason ? "fail" : "pass",
        exitCode: timedOut ? null : exitCode,
        durationMs: Date.now() - started,
        reason,
        summary: summarizeOutput(text),
        output: text,
      });
    };
    child.on("error", (error) => finish(null, error));
    child.on("close", (code) => finish(code));
  });

/** 不执行命令的步骤：缺脚本或因需账号跳过 */
export const staticStep = ({ name, status, reason, command = "" }) => ({
  name,
  command,
  status,
  exitCode: null,
  durationMs: 0,
  reason,
  summary: [],
  output: "",
});
