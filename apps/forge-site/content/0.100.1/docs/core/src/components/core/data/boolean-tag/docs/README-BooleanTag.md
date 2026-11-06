# BooleanTag（布尔状态标签）

> 布尔值 → ElTag 状态标签：value 派生 type（true → activeTagType 默认 success，false → inactiveTagType 默认 info），文案可配。
> 范式页：无独立范式页（典型消费：`apps/reference/src/pages/_shared/user-form.config.tsx` 表单列 render）

## 定位

- **何时用**：把 boolean 渲染为「是/否」「启用/禁用」等状态标签（表格列 / 表单只读渲染）
- **何时不用**：多态枚举标签用 `ElTag` 自配 type；纯文本用普通 span
- `inheritAttrs: false`——attrs（size/effect/round 等）透传 ElTag，但 `:type` 被 value 派生覆盖（消费方无法覆盖 type）

## 快速上手（最小可用）

典型消费（`_shared/user-form.config.tsx`——枚举→boolean 在调用点一行映射）：

```tsx
{
  key: "status",
  label: "状态",
  render: (scope) => (
    <BooleanTag
      value={scope.value === "enabled"}
      activeText="启用"
      inactiveText="禁用"
    />
  ),
},
```

**要点**：

- 枚举 → boolean 的映射在调用点一行完成（如上 `scope.value === "enabled"`）
- 默认「是/否」+ success/info 即可覆盖大多数场景，文案/type 按需覆盖

## 能力边界 / 按需使用

- **默认即够用**：默认「是/否」文案 + success/info 双态配色覆盖大多数场景（启用/禁用、上线/下线等）——零配置使用，典型消费仅一行 render 映射。
- **`activeText` / `inactiveText` / `activeTagType` / `inactiveTagType`：仅当默认文案 / 配色不符合业务语义才覆盖**（如「启用 / 禁用」、状态需醒目色）；均为按需单项覆盖，无需成套配。
- **attrs 透传（size / effect / round 等）：默认不加。** 仅视觉微调按需透传；⚠️ `:type` 被 value 派生独占，消费方 [MUST NOT] 覆盖。
- **适用范围：只吃 boolean。** 三态及以上枚举标签用 `ElTag` 自配 type；纯文本直接用 span。
- **完整能力演示**：典型消费 `apps/reference/src/pages/_shared/user-form.config.tsx`（表单列 render 一行映射）。

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name              | type              | 默认        | 语义              |
| ----------------- | ----------------- | ----------- | ----------------- |
| `value`           | `boolean`（必填） | —           | 布尔值            |
| `activeText`      | `string?`         | 「是」      | true 文案         |
| `inactiveText`    | `string?`         | 「否」      | false 文案        |
| `activeTagType`   | 同 ElTag type     | `"success"` | true 的标签 type  |
| `inactiveTagType` | 同 ElTag type     | `"info"`    | false 的标签 type |

### Emits

无

### Slots

无

### Expose

无

## 反模式 / 注意

- **覆盖 :type**：[MUST NOT]——type 由 value 派生独占，消费方无法覆盖（attrs 只透传 size/effect/round 等）
- **三态枚举**：只吃 boolean——三态及以上用 ElTag 自管

## 关联

- 基础：`ElTag`（element-plus）
- 典型消费：`apps/reference/src/pages/_shared/user-form.config.tsx`

> 目录迁移：本组件及配套归入 `components/data/boolean-tag`；仅源码位置变化，包根导入、props、slots 与实例契约保持。
