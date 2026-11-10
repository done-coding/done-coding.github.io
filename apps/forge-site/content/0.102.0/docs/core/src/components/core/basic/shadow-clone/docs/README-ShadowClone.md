# ShadowClone（影分身）

> 零 DOM 输出双渲染位原语：插槽内容渲染两处——本体就地 + 分身 teleport 到 `to` 目标（`disabled` 关闭分身仅就地）。「分身」≠「瞬移」：官方 teleport 是搬移（源位置不留内容），本组件本体与分身同时存在。分身位内容可选 `clone` 具名槽**独立提供**（本体/分身可不同 props，如交互模式差异）；未提供时 fallback 渲染默认槽（双份一致，向后兼容）。
> 范式页：`apps/reference/src/pages/basic/shadow-clone/`（影分身专项展示）+ `apps/reference/src/pages/form/sort/showcase/`（FormSortSwitchGroup 排序分身到表格表头场景）。

## 定位

- **同一受控内容的多渲染位底层机制**：表单控件分身到表格表头（FormSortSwitchGroup `shadowClone` per-option 影分身）、配置化体系的「一处配置多处展示」等
- **独立裸用当**：任何「同一内容需要同时出现在两个位置」的场景（表头副本 / 悬浮副本等）
- **何时不用**：单处展示直接写；「搬移」语义用 Vue 原生 `<teleport>`

## 快速上手（最小可用）

```html
<ShadowClone to=".table-head">
  <MySortWidget v-model="sortRules" />
</ShadowClone>
```

**要点**：

- `to` 传 CSS 选择器或 DOM 元素；**目标晚渲染是常态**（表格表头在表单下方）——组件内置 MutationObserver 等待目标出现后自动激活分身，零时序手控
- `to` 无效（空 / selector 未命中）时分身静默等待不挂载——**不会触发 Vue 的「Invalid Teleport target」warn**（peer vue ^3.4 无 teleport `defer`，此为自实现等价物）
- `disabled` 关闭分身（仅就地单处）

## 分身位独立内容（clone 具名槽）

本体与分身需要**不同 props / 内容**时（如排序本体整块循环、分身点小箭头），用 `clone` 具名槽独立提供分身内容：

```html
<ShadowClone to=".table-head">
  <!-- 本体位：默认槽 -->
  <FormSortSwitch v-model="dir" mode="cycle" />
  <!-- 分身位：#clone 槽（未提供时 fallback 默认槽，双份一致） -->
  <template #clone>
    <FormSortSwitch v-model="dir" mode="dual-arrow" />
  </template>
</ShadowClone>
```

- **两处各自独立组件实例**（v-model 绑同一 ref 即同源同步、交互可不同）——与默认槽双份渲染同属「状态全外置」边界
- 未提供 `#clone` 时行为与旧版完全一致（分身位渲染默认槽内容）——**向后兼容，消费方可渐进升级**

## 使用边界（[MUST] 消费方遵守）

- 两份 vnode 树 = **两个独立组件实例**——只适合「无内部状态 / 状态全外置的受控组件」（v-model 绑同一 ref 即同源同步）；有内部状态组件会状态分叉
- 静态固定 id 内容双份渲染会撞 id（随机 id 各自生成不撞）——消费方负责
- 根类豁免（规则 17）：组件无根元素（零 DOM 输出是语义核心），无 `dc-` 根类

## 依赖关系

- **被依赖**：form 族 `FormSortSwitchGroup`（`shadowClone` per-option 影分身，分身位 `#clone` 独立 mode）——form 族 → display 族单向依赖
- 内部件不导出：`use-shadow-target`（目标有效性判定 + MutationObserver 等待 hook）

## 测试

- 独立测试：`src/components/basic/shadow-clone/__tests__/ShadowClone.test.ts`（9 用例）——双渲染位 / 目标无效零 warn / MutationObserver 晚渲染自动激活 / disabled / Element 目标 / 空插槽 / **clone 槽 fallback 与独立内容**
- 集成消费：`FormSortSwitchGroup.test.ts`（per-option 分身、分身位 `#clone` 独立 mode）

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name       | type                        | 默认    | 语义                                        |
| ---------- | --------------------------- | ------- | ------------------------------------------- |
| `to`       | `string \| Element`（必填） | —       | 分身 teleport 目标（CSS 选择器 / DOM 元素） |
| `disabled` | `boolean`                   | `false` | 关闭分身（仅就地渲染单处）                  |

### Slots

| name      | 语义                                                                        |
| --------- | --------------------------------------------------------------------------- |
| `default` | 分身内容（本体 + 分身双渲染）                                               |
| `clone`   | 分身位**独立**内容（可选）——未提供时 fallback 渲染 `default` 槽（双份一致） |

> 目录迁移：本组件及配套归入 `components/basic/shadow-clone`；仅源码位置变化，包根导入、props、slots 与实例契约保持。
