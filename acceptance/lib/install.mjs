// 安装依赖。pnpm 11 起默认拦截依赖的构建脚本并以 ERR_PNPM_IGNORED_BUILDS 失败，
// 真实用户会按提示 `pnpm approve-builds --all` 后重装；这里照做，让后续构建、lint、测试仍能验证。
import { runStep } from "./process.mjs";

export const IGNORED_BUILDS = /ERR_PNPM_IGNORED_BUILDS/;

/** 报错中列出的被拦截包，如 esbuild@0.21.5 */
export const ignoredPackages = (output) => {
  const match = output.match(
    /Ignored build scripts:([\s\S]*?)(?:\n\s*help:|$)/,
  );
  return match
    ? match[1]
        .split(/[,\s]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
};

/**
 * 返回 { steps, installed }：installed 表示依赖最终可用。
 * ignoredBuilds 决定首次安装因拦截构建脚本失败时如何记录：
 *   "finding"：记为失败（模板应自带配置），并挂 issueKey 合并草稿
 *   "setup"：消费者项目由运行器自建，批准后视为正常准备步骤
 */
export const install = async ({
  manager,
  cwd,
  env,
  replacements,
  ignoredBuilds,
  issueKey,
}) => {
  const base = { cwd, env, replacements };
  const first = await runStep({
    ...base,
    name: "安装依赖",
    command: manager,
    args: ["install"],
    timeoutMs: 900_000,
  });
  if (
    manager !== "pnpm" ||
    first.status === "pass" ||
    !IGNORED_BUILDS.test(first.output)
  ) {
    return { steps: [first], installed: first.status === "pass" };
  }
  const packages = ignoredPackages(first.output);
  const firstStep =
    ignoredBuilds === "setup"
      ? {
          ...first,
          status: "pass",
          reason: null,
          note: `pnpm 拦截构建脚本（${packages.join("、")}），按提示批准后继续`,
        }
      : {
          ...first,
          reason: `pnpm 拦截了依赖的构建脚本：${packages.join("、")}`,
          issueKey,
          expected:
            "按创建完成时提示的步骤执行 `pnpm install` 即可成功，不需要用户额外批准构建脚本。",
        };
  const approve = await runStep({
    ...base,
    name: "批准构建脚本",
    command: "pnpm",
    args: ["approve-builds", "--all"],
    timeoutMs: 600_000,
  });
  if (approve.status !== "pass") {
    return { steps: [firstStep, approve], installed: false };
  }
  const second = await runStep({
    ...base,
    name: "批准后重新安装",
    command: "pnpm",
    args: ["install"],
    timeoutMs: 900_000,
  });
  return {
    steps: [firstStep, approve, second],
    installed: second.status === "pass",
  };
};
