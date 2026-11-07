# AppTheme（主题切换器积木）

> 主题切换 UI：bridge.theme 直读直写（架构反转——真相源在 bridge，不经 app store）——亮/暗/系统三态恒显 + 风格下拉条件显示。
> 使用场景：AppLayout `#themeSwitcher` 内容锚默认内容；布局插件可复用作 scope.Default。

## 定位

- 架构反转：主题能力在 bridge——AppTheme 经 `inject(APP_LAYOUT_BRIDGE_KEY)` 拿布局桥窄化实例，直读 bridge 主题态、直写 bridge.theme 动作；store 仅为 isDarkTheme 旧消费方转发兜底，新 UI 走 bridge 直连
- 亮/暗/系统三态 RadioGroup（icon + tooltip）**恒显**；风格下拉仅 `list.length > 1` 且 `bridge.showThemeStyleSwitcher !== false` 时显示——开关只管风格切换，不影响亮暗
- 零 props：无对外配置项，行为全由 bridge 态决定

## 快速上手（最小可用）

无 props 可配，挂载即用——经 `#themeSwitcher` 锚由 shell 落位（缺省内容即内置 AppTheme，无需显式引用）：

- 三态切换：亮色 / 暗色 / 跟随系统（icon + tooltip，恒显）
- 风格切换：已注册风格 > 1 且 `showThemeStyleSwitcher !== false` 时显示下拉（`bridge.theme.labelOf(name)` 渲染显示名）

## 能力边界 / 按需使用

- **亮/暗/系统三态恒显**：挂载即用、无任何开关——默认即够用（`#themeSwitcher` 锚缺省内容即内置 AppTheme，业务不填锚即获得）。
- **风格下拉条件显示**：仅当「已注册风格 > 1 且 `bridge.showThemeStyleSwitcher !== false`」才显示——只注册一种风格时自动隐藏，无需配置；`showThemeStyleSwitcher` 只管风格切换，不影响亮暗三态。
- **业务覆盖锚内容时需自供等效切换 UI**：自供 `#themeSwitcher` 锚内容即失去默认切换器——须自供等效 UI 且走 bridge 直读直写（真相源在 bridge，[MUST NOT] 自造主题状态）。
- **完整能力演示**（自供 shell）：`apps/reference/src/pages/layout/app-layout/shell/`

## bridge 直读直写语义

| 方向 | 访问                            | 语义                                                                        |
| ---- | ------------------------------- | --------------------------------------------------------------------------- |
| 读   | `bridge.themeMode.value`        | 当前亮/暗/系统三态                                                          |
| 读   | `bridge.themeStyle.value`       | 当前风格名                                                                  |
| 读   | `bridge.theme.list.value`       | 已注册风格名列表（length > 1 才显示风格下拉）                               |
| 读   | `bridge.showThemeStyleSwitcher` | 是否显示风格下拉（bridge init 静态选项，缺省 true；亮暗切换不受此控、恒显） |
| 读   | `bridge.theme.labelOf(name)`    | 风格显示名                                                                  |
| 写   | `bridge.theme.setMode(mode)`    | 切亮/暗/系统                                                                |
| 写   | `bridge.theme.setStyle(name)`   | 切风格                                                                      |

## API

### Props

无

### Emits

无

### Slots

无

### Expose

无

## 反模式 / 注意

- **勿绕过 bridge 自造主题状态**：真相源在 bridge，切换一律 `bridge.theme.setMode` / `bridge.theme.setStyle`，[MUST NOT] 手写类名/样式副作用造成双真相
- 业务无视 themeSwitcher 默认内容时须自供等效切换 UI（声明驱动测试纪律）
- 风格下拉显隐受 `showThemeStyleSwitcher` 控制；亮暗三态不受此控、恒显

## 关联

- 主题能力：`bridge/theme.ts`（createBridgeThemeHook：风格 map + setStyle/setDark + 持久化）
- 落位：AppShell `#themeSwitcher` 锚（scope.Default = 内置 AppTheme；业务可覆盖），AppLayout 5 内容锚之一
- 范式页：`apps/reference/src/pages/layout/app-layout/shell/`

> 目录迁移：本组件及配套归入 `components/config/app-theme`；仅源码位置变化，包根导入、props、slots 与实例契约保持。

## 无障碍语义（td1v4s 收窄版 B）

风格下拉名为“主题风格”，模式组名为“配色模式”；不新增 prop，不插入隐藏文字或样式。图标单选项的原生 input 仍缺独立名称，收窄版 B 接受该限制；自动扫描许可不表示无障碍达标。
