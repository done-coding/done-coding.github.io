# @done-coding/forge@0.100.1：消费者关闭 skipLibCheck 时 forge 类型声明有 7 条诊断

> 黑盒验收草稿，协调者已于 2026-11-06 复核归因并定稿；只写现象，不猜实现原因。

## 现象

只依赖 forge latest 的最小 Vite + Vue 3 项目，按 README 引入公开入口与样式后，`vite build` 和 `skipLibCheck: true` 的 `vue-tsc` 都通过；改为 `skipLibCheck: false` 后，forge 发布的类型声明（`@done-coding/forge-compose`、`forge-core`、`forge-data` 的 `types/`）报 7 条诊断，消费者自己的源码没有诊断。

另有 56 条诊断来自第三方库（@vueuse/core 16 条、element-plus 40 条），不计入本草稿。

## 复现命令

```bash
mkdir forge-consumer && cd forge-consumer
pnpm add @done-coding/forge@0.100.1 vue@3.5.45
pnpm add -D vite@8.3.6 @vitejs/plugin-vue@6.0.10 vue-tsc@3.3.14 typescript@5.9.3
# src/main.ts 按 forge README 引入 { AppLayout, FormMain, ModalPorter } 和 @done-coding/forge/style.css
pnpm exec vite build
pnpm exec vue-tsc --noEmit  # tsconfig strict，分别设 skipLibCheck true / false
```

## 期望

forge 公开入口与样式在严格模式下无类型诊断（第三方库诊断单列，不计入）。

## 实际

运行 `pnpm exec vue-tsc --noEmit --pretty false -p tsconfig.json`：forge 或消费者源码有 7 条类型诊断。输出摘要：

```text
@done-coding/forge-compose/types/components/layout/app-sidebar/AppSidebar.vue.d.ts(27,148): error TS2344: Type 'GlobalComponents' does not satisfy the constraint 'Record<string, Component<any, any, any, ComputedOptions, MethodOptions, {}, any>>'.
@done-coding/forge-core/types/components/basic/action-btn/ActionBtn.vue.d.ts(12,12): error TS2300: Duplicate identifier 'evt'.
@done-coding/forge-core/types/components/basic/action-btn/ActionBtn.vue.d.ts(12,26): error TS2300: Duplicate identifier 'evt'.
@done-coding/forge-core/types/components/data/badge-mark/BadgeMark.vue.d.ts(88,32): error TS2344: Type 'GlobalComponents' does not satisfy the constraint 'Record<string, Component<any, any, any, ComputedOptions, MethodOptions, {}, any>>'.
@done-coding/forge-core/types/utils/export.d.ts(10,85): error TS2344: Type '"label"' does not satisfy the constraint '"install" | "setPropsDefaults"'.
@done-coding/forge-data/types/components/data-grid-view/types.d.ts(42,124): error TS2344: Type '"type" | "label" | "render" | "prop"' does not satisfy the constraint '"fixed" | "type" | "render" | "align" | "install" | "prop" | "columnKey" | "headerAlign" | "filterPlacement" | "setPropsDefaults" | "headerRender"'.
@done-coding/forge-data/types/components/shared/types.d.ts(35,45): error TS2344: Type '"label" | "prop"' does not satisfy the constraint '"fixed" | "type" | "render" | "align" | "install" | "prop" | "columnKey" | "headerAlign" | "filterPlacement" | "setPropsDefaults" | "headerRender"'.
```

## 环境

- Darwin 22.6.0 x64，Node v24.22.2，pnpm 12.15.0，npm 11.19.1
- 被测版本：@done-coding/forge@0.100.1、vue@3.5.45、vite@8.3.6、@vitejs/plugin-vue@6.0.10、vue-tsc@3.3.14、typescript@5.9.3
- 验收日期：2026-11-06，临时目录与隔离的 HOME，无全局安装
