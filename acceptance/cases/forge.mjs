// forge 消费者：最小 Vite + Vue 3 项目，只依赖 npm 上 @done-coding/forge 的 latest，按 README 引入公开入口与样式。
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { install } from "../lib/install.mjs";
import { runStep } from "../lib/process.mjs";
import { isolatedEnv, withTempDir } from "../lib/temp.mjs";

const DIAGNOSTIC = /^(\S+?)\(\d+,\d+\): error (TS\d+)/;

/** 诊断所在的包：node_modules 下按包名归类，其余归消费者源码 */
export const diagnosticOwner = (file) => {
  const parts = file.split("node_modules/");
  if (parts.length === 1) {
    return "consumer";
  }
  const segments = parts.at(-1).split("/");
  return segments[0].startsWith("@")
    ? `${segments[0]}/${segments[1]}`
    : segments[0];
};

/** 诊断按归属计数，并保留 forge/消费者的诊断原文（路径缩短到包内） */
export const groupDiagnostics = (output) => {
  const byOwner = {};
  const forgeLines = [];
  for (const line of output.split("\n")) {
    const match = line.match(DIAGNOSTIC);
    if (match) {
      const owner = diagnosticOwner(match[1]);
      byOwner[owner] = (byOwner[owner] ?? 0) + 1;
      if (owner === "consumer" || owner.startsWith("@done-coding/")) {
        forgeLines.push(line.split("node_modules/").at(-1));
      }
    }
  }
  return { byOwner, forgeLines };
};

/** forge 自身（@done-coding/*）和消费者源码的诊断算 forge 问题，其余第三方单列 */
export const splitDiagnostics = (byOwner) => {
  const forge = {};
  const thirdParty = {};
  for (const [owner, count] of Object.entries(byOwner)) {
    (owner === "consumer" || owner.startsWith("@done-coding/")
      ? forge
      : thirdParty)[owner] = count;
  }
  return { forge, thirdParty };
};

const sum = (counts) =>
  Object.values(counts).reduce((total, count) => total + count, 0);

const writeProject = (dir, versions, skipLibCheck) => {
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify(
      {
        name: "forge-consumer",
        private: true,
        type: "module",
        dependencies: {
          "@done-coding/forge": versions["@done-coding/forge"],
          vue: versions.vue,
        },
        devDependencies: {
          vite: versions.vite,
          "@vitejs/plugin-vue": versions["@vitejs/plugin-vue"],
          "vue-tsc": versions["vue-tsc"],
          typescript: versions.typescript,
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(dir, "vite.config.ts"),
    'import { defineConfig } from "vite";\nimport vue from "@vitejs/plugin-vue";\n\nexport default defineConfig({ plugins: [vue()] });\n',
  );
  writeFileSync(
    join(dir, "index.html"),
    '<!doctype html>\n<html><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>\n',
  );
  // 与 forge README「安装与使用」一致
  writeFileSync(
    join(dir, "src/main.ts"),
    'import { createApp } from "vue";\nimport { AppLayout, FormMain, ModalPorter } from "@done-coding/forge";\nimport "@done-coding/forge/style.css";\nimport App from "./App.vue";\n\nconsole.log(AppLayout, FormMain, ModalPorter);\ncreateApp(App).mount("#app");\n',
  );
  writeFileSync(
    join(dir, "src/App.vue"),
    "<template>\n  <div>forge consumer</div>\n</template>\n",
  );
  writeFileSync(
    join(dir, "src/env.d.ts"),
    '/// <reference types="vite/client" />\n',
  );
  writeFileSync(
    join(dir, skipLibCheck ? "tsconfig.skip.json" : "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          strict: true,
          jsx: "preserve",
          noEmit: true,
          skipLibCheck,
          lib: ["ES2022", "DOM"],
        },
        include: ["src/**/*.ts", "src/**/*.vue"],
      },
      null,
      2,
    ),
  );
};

const typeCheck = async ({ dir, env, replacements, skipLibCheck }) => {
  const project = skipLibCheck ? "tsconfig.skip.json" : "tsconfig.json";
  const step = await runStep({
    name: `vue-tsc skipLibCheck=${skipLibCheck}`,
    command: "pnpm",
    args: ["exec", "vue-tsc", "--noEmit", "--pretty", "false", "-p", project],
    cwd: dir,
    env,
    timeoutMs: 600_000,
    replacements,
  });
  const { byOwner, forgeLines } = groupDiagnostics(step.output);
  const { forge, thirdParty } = splitDiagnostics(byOwner);
  const forgeCount = sum(forge);
  const diagnostics = { total: sum(byOwner), forge, thirdParty };
  if (step.status === "timeout") {
    return { ...step, diagnostics };
  }
  // 只有第三方诊断时不算 forge 失败；无法解析诊断的非零退出仍算失败
  const unexplained = step.exitCode !== 0 && sum(byOwner) === 0;
  return {
    ...step,
    status: forgeCount > 0 || unexplained ? "fail" : "pass",
    reason:
      forgeCount > 0
        ? `forge 或消费者源码有 ${forgeCount} 条类型诊断`
        : unexplained
          ? `退出码 ${step.exitCode}，未解析到诊断`
          : null,
    diagnostics,
    // 草稿需要看到具体诊断，替换默认摘要
    summary: forgeLines.length > 0 ? forgeLines : step.summary,
    expected:
      "forge 公开入口与样式在严格模式下无类型诊断（第三方库诊断单列，不计入）。",
  };
};

export const forgeCase = async (ctx) => {
  const versions = ctx.forgeToolchain;
  const forgeVersion = versions["@done-coding/forge"];
  const reproduce = [
    "mkdir forge-consumer && cd forge-consumer",
    `pnpm add @done-coding/forge@${forgeVersion} vue@${versions.vue}`,
    `pnpm add -D vite@${versions.vite} @vitejs/plugin-vue@${versions["@vitejs/plugin-vue"]} vue-tsc@${versions["vue-tsc"]} typescript@${versions.typescript}`,
    "# src/main.ts 按 forge README 引入 { AppLayout, FormMain, ModalPorter } 和 @done-coding/forge/style.css",
    "pnpm exec vite build",
    "pnpm exec vue-tsc --noEmit  # tsconfig strict，分别设 skipLibCheck true / false",
  ];
  return withTempDir("forge", async (dirs) => {
    const env = isolatedEnv(dirs, ctx.sharedEnv);
    const replacements = ctx.replacements(dirs);
    const dir = join(dirs.work, "forge-consumer");
    writeProject(dir, versions, true);
    writeProject(dir, versions, false);
    const steps = [];
    const { steps: installSteps, installed } = await install({
      manager: "pnpm",
      cwd: dir,
      env,
      replacements,
      ignoredBuilds: "setup",
    });
    steps.push(...installSteps);
    if (installed) {
      steps.push(
        await runStep({
          name: "vite build",
          command: "pnpm",
          args: ["exec", "vite", "build"],
          cwd: dir,
          env,
          timeoutMs: 600_000,
          replacements,
        }),
      );
      for (const skipLibCheck of [true, false]) {
        steps.push(await typeCheck({ dir, env, replacements, skipLibCheck }));
      }
    }
    const notes = steps
      .filter((step) => step.note)
      .map((step) => `${step.name}：${step.note}`);
    notes.push(
      ...steps
        .filter((step) => step.diagnostics)
        .map(
          (step) =>
            `${step.name}：共 ${step.diagnostics.total} 条诊断，forge/消费者 ${sum(step.diagnostics.forge)} 条，第三方 ${sum(step.diagnostics.thirdParty)} 条${
              Object.keys(step.diagnostics.thirdParty).length > 0
                ? `（${Object.entries(step.diagnostics.thirdParty)
                    .map(([owner, count]) => `${owner} ${count}`)
                    .join("、")}）`
                : ""
            }`,
        ),
    );
    return {
      id: "forge-consumer",
      group: "forge",
      title: `@done-coding/forge@${forgeVersion} 消费者`,
      versions,
      reproduce,
      steps,
      notes,
    };
  });
};
