# shells — 主题外壳族

**内部件，不在包导出面。** `package.json` 的 `exports` 只开了 `.`（`themePlugin` + 类型）
与 `./assets/*`——shell 不由下游直接 import，而是被 preset 引用、经 `themePlugin` 注册进
core bridge，由 `AppLayout` 按当前主题的 `preset.layout.shell` 渲染。

> 故本文件只写**族级 API 与约束**，[MUST NOT] 逐 shell 写文档（28 个 shell + 19 个 decor
> 逐件成文没人读，是为覆盖率而产的废纸）。真相源 = `types.ts` + 组件源码；文档与源码冲突
> 以源码为准。

包安装身份为 `@done-coding/forge-plugin-theme`，preset 子路径为 `@done-coding/forge-plugin-theme/assets/*`；目录改名不改变 shell/decor API。

## 族内构成

| 子族     | 成员                                                                                                                                                                                                             | 职责                                                         |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 基类     | `FrameShellBase` / `CockpitShellBase`                                                                                                                                                                            | 套框 / 座舱两种拓扑的公共骨架，具体 shell 在其上做视觉与编排 |
| 座舱系   | `BrutalSteelCockpitShell` / `LiquidInkCockpitShell` / `MonoPaperCockpitShell` / `NeuralFieldCockpitShell` + `CockpitStatusBar`                                                                                   | 底部状态条 + 中控式布局                                      |
| 套框系   | `AppliedIntelligenceFrameShell` / `FilmGradeShell` / `PerspectiveDeckShell`                                                                                                                                      | viewport 边框圈 + decor 装饰带                               |
| 工坊系   | `StudioStageShell`（亮·端用）/ `StudioInkShell` / `KitchenFoundryShell`（暗·编排熔炉）+ `KitchenPassRail`                                                                                                        | 姐妹旗舰，制版台 / 热压脊两种叙事                            |
| 导航拓扑 | `TopNavShell` / `TriColumnShell` / `IconRailShell` + `HeaderNavMenu`                                                                                                                                             | 顶导通栏 / 三栏 / 图标轨                                     |
| 其他视觉 | `AuroraMeshShell` / `CosmosShell` / `CoilingDragonShell` / `NeonSetShell` / `QuantumOrbitShell` / `ScanlineShell` / `SignalTealShell` / `StageChatShell` / `SynapseGridShell` / `AppliedIntelligenceNebulaShell` | 各自一套视觉语言                                             |
| `decor/` | 19 件装饰层 + `use-frame-geometry`                                                                                                                                                                               | 见 [decor/README](./decor/README.md)                         |

## 写 / 改 shell 的硬约束

**① [MUST NOT] 感知路由**（项目 CLAUDE.md 规则 16）
交付代码 [MUST NOT] import vue-router、[MUST NOT] 读 `location` / query / hash 做分支。
路由是消费方 app 的职责；主题包感知路由会强加依赖、污染下游。显隐与容器逻辑走 core 的
`meta.layout` + bridge inject。vue-router 只允许本包 demo 用，且 [MUST NOT] 进
`dependencies` / `peerDependencies`。

**② 样式 [MUST] 内联，[MUST NOT] 依赖抽取的 scoped CSS**
plugin 的 `<style scoped>` 在消费应用**不生效**（scoped CSS 被抽到独立 style.css，而下游
不该 import 整包样式——那会一次性加载所有主题、破坏资产隔离）。故 shell / decor 的样式
一律走 `:style` 内联，`@keyframes` 类改 WAAPI 运行时驱动。**样式随组件渲染而生**：
主题未被选中时它的样式根本不存在。

**③ CSS 变量只用两类来源**（规则 14）
`--dc-core-*`（core 主题系，随风格 + 亮暗自适配）优先，`--el-*` 兜底。
[MUST NOT] 写死色值、[MUST NOT] 自造 CSS 变量——自造的脱离主题两套注入，切主题不响应。

**④ 能力守恒**
主题可以改布局拓扑，但 [MUST NOT] 砍功能。不渲染的模块尺寸归 0，而非删掉挂载点。

**⑤ 视觉决策 [MUST] 经 UI/UX**（规则 18）
token / persona 风格 / 视觉 [MUST] 先提炼取向再实现，并经 UI/UX 验收；
[MUST NOT] 用 build / lint / 单测冒充视觉验收。

**⑥ 注入 `<style>` 的 id [MUST] 带模块期随机后缀**
纯固定全局 id 跨 module instance / 微前端会撞，dedup 静默跳过即断样式。
外部锚点走稳定 `data-*` 属性。

## 对外契约

shell 不直接对外，它经 `CoreThemeEntry.layout.shell` 被引用。preset 的完整契约见
`../types.ts` 与 core 的 `bridge/theme/types.ts`（`CoreThemePresetLayout`）。

## C 依赖适配

框架引用由旧admin-core改为@done-coding/forge聚合；只改入口与manifest依赖，组件/API/视觉不变。本包不加入聚合，不在此批改名或统一版本。
