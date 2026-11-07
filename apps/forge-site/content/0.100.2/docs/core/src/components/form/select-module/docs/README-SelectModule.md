# SelectModule（模块选择器）

> AppLayout 内「路由模块」下拉选择器：二级菜单选项 + 首项固定「全部」，v-model 透传 ElSelect。
> 范式页：`apps/reference/src/pages/home/Home.vue`

## 定位

- **何时用**：AppLayout 布局内需要「按路由模块切换」的下拉选择
- **前置**：必须挂在 `AppLayout` 内——inject `APP_LAYOUT_BRIDGE_KEY`，缺失即 throw「必须在 AppLayout 内使用」
- 数据源：`generateRouteMetaRawTree(getRoutes(), { filterFn: menuShow, sortFn: menuSort })`，仅二级（`ElOptionGroup`，注释明示未递归）
- 首项固定「全部」= `FORM_CONFIG_SELECT_ALL_VALUE`；选项 `value` = 路由 `path`
- **props/emits 面为空是设计使然**：无 defineProps / defineEmits / defineModel / defineExpose（`defineOptions({ name: "SelectModule", inheritAttrs: true })`），`v-model` 经 `inheritAttrs` 透传 `ElSelect`

## 快速上手（最小可用）

挂载于 AppLayout 内，单个 `v-model` 即够用：

```html
<SelectModule v-model="module" />
```

```ts
import { SelectModule } from "@done-coding/forge";

const module = ref<string>();
```

**要点**：

- `v-model` 绑定选中的路由 `path`；首项「全部」内置，无需特殊处理
- 挂载点必须在 `AppLayout` 内（bridge 注入契约）
- `inheritAttrs` 透传——ElSelect 属性（如 `placeholder`）照常传入

## 能力边界 / 按需使用

- **仅二级：选项只到路由模块一级（`ElOptionGroup`，注释明示未递归），多级菜单不承载。** 判据——模块选择器的粒度就是「切换模块」，不是全量多级菜单导航。
- **必须在 `AppLayout` 内使用：inject `APP_LAYOUT_BRIDGE_KEY`，缺失即 throw。** 挂载点脱离布局即报错，[MUST NOT] 在普通页面直接放。
- **`v-model` 经 `inheritAttrs` 透传 ElSelect：props 面为空是设计使然（透传代理组件）。** 消费方照常传 ElSelect 属性（`placeholder` 等）即生效；选项 `value` = 路由 `path`——选中值即路由路径，勿期待是模块名 / id。
- **完整能力演示**：`apps/reference/src/pages/home/Home.vue`——能力展示，非推荐默认。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

无（props 面为空；`v-model` 经 `inheritAttrs` 透传 `ElSelect`，消费方照常传 ElSelect 属性）

### Emits

无（`v-model` 变更经 ElSelect 透传）

### Slots

无

### Expose

无

## 反模式 / 注意

- **[MUST NOT] 在 `AppLayout` 外使用**：inject `APP_LAYOUT_BRIDGE_KEY` 缺失即 throw
- **仅二级**：注释明示未递归，不期望承载全量多级菜单
- **无 props 面 ≠ 残缺**：透传代理组件设计使然，消费方用法即 `<SelectModule v-model="..." />`
- 选项 `value` 是路由 `path`——选中值即路由路径，勿期待是模块名 / id

## 关联

- 注入契约：`APP_LAYOUT_BRIDGE_KEY`（core inject，跨包 `Symbol.for`）
- 数据源：`generateRouteMetaRawTree`（core utils）+ 菜单显隐 / 排序 `menuShow` / `menuSort`
- 常量：`FORM_CONFIG_SELECT_ALL_VALUE`（「全部」值）
- 范式页：`apps/reference/src/pages/home/Home.vue`

> 目录迁移：实现与配套收纳到 `components/form/select-module`，包根 API 与演示能力保持。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-form`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。

## 无障碍语义（td1v4s）

默认可访问名“选择模块”，可用既有 aria-label attr 覆盖；模块列表和 v-model 契约不变。
