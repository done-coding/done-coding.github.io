// pty-drive.py 的 Node 封装。
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { runStep, sanitize, summarizeOutput } from "./process.mjs";

const SCRIPT = join(import.meta.dirname, "pty-drive.py");

/** 步骤里记录的命令：被驱动的命令本身，不含驱动脚本路径和记录文件名 */
const describe = (spec, replacements) => {
  const [bin, ...rest] = spec.argv;
  const command = sanitize([basename(bin), ...rest].join(" "), replacements);
  return spec.mode === "enumerate"
    ? `${command}（交互，列出「${spec.enumeratePrompt}」的选项）`
    : `${command}（交互）`;
};

/** 运行交互式命令，返回步骤结果，附带 pty 的解析结果（枚举的选项等） */
export const runInteractive = async ({
  name,
  spec,
  env,
  replacements,
  display,
  timeoutMs,
}) => {
  const transcript = join(spec.cwd, `.pty-${process.pid}-${Date.now()}.log`);
  const step = await runStep({
    name,
    command: "python3",
    args: ["-I", SCRIPT, JSON.stringify({ ...spec, transcript })],
    cwd: spec.cwd,
    env,
    timeoutMs: timeoutMs ?? (spec.timeoutSec + 30) * 1000,
    replacements,
    display: display ?? describe(spec, replacements),
  });
  let parsed = null;
  try {
    parsed = JSON.parse(step.output.trim().split("\n").at(-1));
  } catch {
    // 驱动脚本自身出错，按原步骤结果返回
  }
  let text = step.output;
  try {
    text = sanitize(readFileSync(transcript, "utf8"), replacements);
  } catch {
    // 没有记录文件时使用驱动输出
  }
  if (!parsed) {
    return {
      ...step,
      status: "fail",
      reason: "伪终端驱动没有返回结果",
      parsed,
    };
  }
  const reason = parsed.timedOut
    ? `超过 ${spec.timeoutSec} 秒未结束`
    : parsed.unmatched
      ? `问题「${parsed.unmatched.question}」中找不到选项「${parsed.unmatched.label}」`
      : spec.mode === "answer" && parsed.exitCode !== 0
        ? `退出码 ${parsed.exitCode}`
        : null;
  return {
    ...step,
    status: parsed.timedOut ? "timeout" : reason ? "fail" : "pass",
    exitCode: parsed.exitCode,
    reason,
    summary: summarizeOutput(text),
    output: text,
    parsed,
  };
};
