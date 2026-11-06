// 兼容性矩阵页：构建时读取最近一次黑盒验收的 results.json，填进 dist/compatibility.html。
// 只读结果，不运行验收。ACCEPTANCE_DIR 仅供测试指向临时结果目录。
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const MARKER = "<!-- compatibility -->";
const PAGE = "dist/compatibility.html";
const resultsRoot =
  process.env.ACCEPTANCE_DIR ||
  fileURLToPath(
    new URL("../../docs/governance/audits/acceptance", import.meta.url),
  );

// 每组验收的被测产品
const GROUP_PACKAGE = {
  template: "create-done-coding",
  forge: "@done-coding/forge",
  cli: "done-coding",
};
const STATUS_TEXT = { pass: "通过", fail: "失败", skipped: "跳过" };

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** 按日期命名的目录中最新且含 results.json 的一个 */
const latestResults = () => {
  if (!existsSync(resultsRoot)) {
    return null;
  }
  const latest = readdirSync(resultsRoot)
    .filter(
      (entry) =>
        /^\d{4}-\d{2}-\d{2}$/.test(entry) &&
        existsSync(join(resultsRoot, entry, "results.json")),
    )
    .sort()
    .at(-1);
  return latest
    ? JSON.parse(
        readFileSync(join(resultsRoot, latest, "results.json"), "utf8"),
      )
    : null;
};

const failedSteps = (testCase) =>
  testCase.steps
    .filter((step) => ["fail", "timeout"].includes(step.status))
    .map((step) => step.name);

const groupTable = (results, group) => {
  const cases = results.cases.filter((testCase) => testCase.group === group);
  if (cases.length === 0) {
    return "";
  }
  const name = GROUP_PACKAGE[group];
  const version = results.packages?.[name];
  const passed = cases.filter((testCase) => testCase.status === "pass").length;
  const rows = cases
    .map(
      (testCase) => `          <tr>
            <td>${escapeHtml(testCase.title)}</td>
            <td class="status-${escapeHtml(testCase.status)}">${escapeHtml(STATUS_TEXT[testCase.status] ?? testCase.status)}</td>
            <td>${escapeHtml(failedSteps(testCase).join("、"))}</td>
          </tr>`,
    )
    .join("\n");
  return `      <h2>${escapeHtml(results.groupTitles?.[group] ?? group)}</h2>
      <p class="meta">${escapeHtml(name ?? group)}${version ? ` ${escapeHtml(version)}` : ""}，${passed}/${cases.length} 通过</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th scope="col">用例</th><th scope="col">结果</th><th scope="col">未通过的步骤</th></tr>
          </thead>
          <tbody>
${rows}
          </tbody>
        </table>
      </div>`;
};

/** 渲染矩阵；没有结果时返回提示 */
export const renderCompatibility = (results) => {
  if (!results) {
    return '<p class="meta">暂无验收结果。</p>';
  }
  const { environment = {}, forgeToolchain } = results;
  const groups = [
    ...new Set(results.cases.map((testCase) => testCase.group)),
  ].filter((group) => group in GROUP_PACKAGE);
  const toolchain = forgeToolchain
    ? `<p class="meta">forge 消费者工具链：${Object.entries(forgeToolchain)
        .map(([name, version]) => `${escapeHtml(name)} ${escapeHtml(version)}`)
        .join("、")}</p>`
    : "";
  const partial =
    results.filter?.only || groups.length < Object.keys(GROUP_PACKAGE).length
      ? '<p class="meta">本次只运行了部分用例。</p>'
      : "";
  return [
    `<p class="meta">验收日期 ${escapeHtml(results.date)}；环境 ${escapeHtml(environment.os ?? "")} ${escapeHtml(environment.arch ?? "")}，Node ${escapeHtml(environment.node ?? "")}，pnpm ${escapeHtml(environment.pnpm ?? "")}；${results.totals.pass} 项通过，${results.totals.fail} 项失败。</p>`,
    partial,
    ...groups.map((group) => groupTable(results, group)),
    toolchain,
  ]
    .filter(Boolean)
    .join("\n");
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const html = readFileSync(PAGE, "utf8");
  if (!html.includes(MARKER)) {
    throw new Error(`${PAGE} 缺少占位注释 ${MARKER}`);
  }
  writeFileSync(
    PAGE,
    html.replace(MARKER, renderCompatibility(latestResults())),
  );
}
