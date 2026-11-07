# FormActiveFilter（生效筛选条件条）

> 当前已生效查询条件的投影展示条：条件 chips + 单项 × 移除 + 清除全部（可选）。纯 UI 组件——投影 / value→label / 表单值同步清除等逻辑在消费方 hook（ListLayout 内 `use-active-filter`）完成，本组件只收数据 + 发事件。
> 业界对标：SAP Fiori "Filter Feedback Bar" / react-admin `<FilterValue>` / MUI FilterChipBar。
> 范式页：`apps/reference/src/pages/layout/list-layout/active-filter/`（ListLayout 集成场景）；独立裸用见同页组件区。

## 定位

- **ListLayout 的生效条件展示位**：ListLayout 开 `formActiveFilter` 后，在表单卡片顶部一行渲染（条件条在上、表单在下），数据 = `use-active-filter` hook 从 query 投影的条目
- **独立裸用当**：任何「已生效筛选条件展示 + 移除」场景（非 ListLayout 体系、条件数据自持的页面/组件）
- **何时不用**：无生效条件概念的场景；仅需静态展示用 ElTag 直写

## 快速上手（最小可用）

```html
<FormActiveFilter
  :filters="filters"
  :allow-clear="true"
  @remove="onRemove"
  @clear="onClearAll"
/>
```

**要点**：

- `filters` 条目形状 `FormActiveFilterEntry`：`{ field, label, displayValue }`——`field` 是 query 字段名（× 移除事件的载荷），`label` 展示名，`displayValue` 展示值（枚举类应传 options 匹配后的 label，取不到传原值）
- × 移除 = `@remove(field)`；清除全部 = `@clear()`（仅 `allowClear` 开启时显示按钮）——事件是纯上抛，**同步清表单值 / 重查是消费方职责**
- **空态恒展示**：`filters` 为空时渲染灰字「暂无生效筛选条件」占位（行高与单条 tag 一致，新增生效条件不跳动）；「清除全部」仅在至少一条生效条件时出现

## 能力边界 / 按需使用

- **默认即够用：`filters` 一个 prop 即为完整条件条**（chips + 单项 ×）。以下按需开：
- `allowClear`：默认关；仅当需要一键清空全部生效条件才开（通常与「清空后重查」配合）
- 单项移除始终可用（chips 自带 closable ×）——`allowClear` 只额外加「清除全部」按钮
- **value→label 不在组件内**：组件不持有表单字段 config（保持纯 UI）——投影逻辑放消费方 hook（ListLayout 的 `use-active-filter` 从 `config.props.options` 取 label，取不到原值兜底）

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name         | type                              | 默认    | 语义                                         |
| ------------ | --------------------------------- | ------- | -------------------------------------------- |
| `filters`    | `FormActiveFilterEntry[]`（必填） | —       | 生效条件条目（field / label / displayValue） |
| `allowClear` | `boolean`                         | `false` | 显示「清除全部」按钮（一键清空全部生效条件） |

### Emits

| name     | 载荷            | 语义                                                         |
| -------- | --------------- | ------------------------------------------------------------ |
| `remove` | `field: string` | 点击单项 × ——消费方应移除 query 该字段 + 同步清表单值 + 重查 |
| `clear`  | —               | 点击清除全部——消费方应清空全部生效条件 + 重查                |

## 相关

- 投影与联动逻辑：`list-layout/use-active-filter.ts`（ListLayout 内部 hook，不导出）
- 集成组件：`ListLayout.formActiveFilter` / `ListLayout.allowClear`（见 list-layout docs）

> 目录迁移：实现与配套收纳到 `components/form/form-active-filter`，包根 API 与演示能力保持。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-form`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。
