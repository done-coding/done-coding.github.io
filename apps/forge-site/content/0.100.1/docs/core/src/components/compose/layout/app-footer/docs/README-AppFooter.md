# AppFooter（底部状态条积木）

> 底部状态条积木：零 props/emits/slots/expose——高度与样式完全由 `appStore.footerStyle` 驱动（inject APP_LAYOUT_APP_STORE_KEY 直取），随 store 变化 0.3s 过渡。
> 使用场景：AppLayout 组装 shell 吐出的 Footer 组件引用，经 AppBody #footer 槽落位（内置默认 AppShell 吐 AppFooter）。

## 定位

AppFooter 是族内最薄的积木：自身无任何对外接口（无 props / emits / slots / expose），只做一件事——inject 应用 store 窄化实例（`APP_LAYOUT_APP_STORE_KEY`），把 `appStore.footerStyle` 绑到根盒 `:style` 上渲染底部状态条（高度 / 背景 / 圆角 / 横向内呼吸由 store 驱动，阴影走主题 var）。显隐与高度变化全部由 AppLayout/store 侧控制，消费方不直接挂载、也无可配置项。

**面貌三项与 AppHeader 同源同口径**（对称积木，[MUST] 一起改）：

| 项         | 默认                                                    | 覆盖法                                        |
| ---------- | ------------------------------------------------------- | --------------------------------------------- |
| 背景       | `APP_LAYOUT_FOOTER_CONFIG.background ?? 主题 bodyColor` | 配 `background`                               |
| 圆角       | `var(--dc-core-radius, var(--el-border-radius-base))`   | `APP_LAYOUT_FOOTER_CONFIG.style.borderRadius` |
| 横向内呼吸 | 间距阶梯**模块档**（默认 **8px**）                      | `APP_LAYOUT_FOOTER_CONFIG.style.padding`      |

圆角 / padding 的默认值在 `...cfg.style` 展开**之前**写入 ⇒ 逃生舱同名键恒赢；`height` / `marginTop` / `background` / `color` 仍是引擎托管键（展开之后，压过外部）。

## 能力边界 / 按需使用

- **零配置、零 props——样式与显隐全由 `appStore.footerStyle` 驱动**（随 store 变化 0.3s 过渡）：要改高度/显隐走 store（footerStyle），[MUST NOT] 给 AppFooter 加 props 透传；消费方不直接挂载（内置经典布局已经 shell → AppBody #footer 自动落位）。**完整能力演示**（NoFooter 变体）：`apps/reference/src/pages/layout/app-layout/layout/`

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

- **勿给 AppFooter 加 props 透传**：其样式是 store 真相源（footerStyle），不是 prop 驱动——要改高度/显隐走 store
- 消费方不应直接挂载——内置经典布局已经 shell → AppBody #footer 自动落位

## 关联

- 落位链：AppLayout → AppShell 默认 scoped slot（`AppShellDefaultSlotScope`：`{ Footer: Component }`）→ AppBody #footer
- store：`APP_LAYOUT_APP_STORE_KEY`（footerStyle 驱动）
- 范式页：`apps/reference/src/pages/layout/app-layout/layout/`（NoFooter 变体）

> 目录迁移：实现与配套归入 `components/compose/layout/app-footer`；公开契约、兼容别名与 panel 废弃时间点不变。

## C 源码迁移

本组件及配套类型/hooks/测试/API迁至 `packages/forge-compose/src/components`，去掉 pro 重复层。应用消费 `@done-coding/forge`；组件 API、槽与事件不变，Panel已由pn1031退役（C拆包时曾保留）。
