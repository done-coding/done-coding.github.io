# FormShadowCloneDispatch（form 族 · 影分身骨架：漏斗开关 + popup）

## 定位

form 族系**通用影分身骨架**——本体就地渲染（default 槽）+ 分身位（label 字段文字 + 漏斗按钮整块，表头筛选惯例入口，点击漏斗 popover 弹层）+ popup 内容（clone 槽）。

**职责收敛**：双渲染位编排 + 漏斗展示（含高亮标识）+ popup 骨架。**零值逻辑**——不持有 v-model、不知道值本身；值由消费方插槽内容自己持有（同源绑定驱动双处视图一致）。

漏斗只是「影分身触发 popover 的开关」，非筛选语义组件。

## 快速上手（最小可用）

```vue
<FormShadowCloneDispatch
  shadow-clone
  teleport-to=".head-slot"
  label="标题"
  :highlighted="hasValue"
>
  <!-- 本体位：实际组件形态（消费方写死绑定，无需 scope） -->
  <FormInput v-model="keyword" />
  <!-- clone 槽（popup 内容）：不传即自动显示 default 同款 -->
  <template #clone>
    <FormInput v-model="keyword" size="small" />
  </template>
</FormShadowCloneDispatch>
```

## 能力边界 / 按需使用

- **影分身**：`shadowClone` + `teleportTo` 开启 → 分身位 = **label（prop 传入）+ 漏斗按钮整块**（对齐排序 chip 形态：自带字段文字，表格 headerRender 只需留 teleportTo 容器、无需再写列名）；未开启/未配置 teleportTo 时仅渲染 default 槽（单份，零行为变化）
- **高亮**：分身整块（label + 漏斗）按 `highlighted` 展示激活态（同 primary）；插槽作用域同步暴露 `{ highlighted }` 供消费方在插槽内**同级处理**（包外层/加提示等），不影响插槽内实际组件（FormInput/FormSelect）的纯粹性——判定逻辑上移消费方（默认规则 + `isHighlighted` 方法覆盖，见 FormInputShadowClone）
- **晚渲染目标**：teleport 目标晚出现（表头在表单下方）由内部 ShadowClone（display 族）MutationObserver 等待自动激活，无需手控

## 依赖关系

- display 族 `ShadowClone`（影分身双渲染位机制，单向依赖）；form 族 `FormInputShadowClone` / `FormSelectShadowClone` 基于本组件实现

## API

> ⚠️ API 以 types.ts 与组件源码为真相源；与文档冲突时以源码为准。

### Props

| name           | type                | 默认    | 语义                                                                                            |
| -------------- | ------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `shadowClone`  | `boolean`           | `false` | 影分身开关（本体 default 槽 + 分身 label+漏斗双渲染位，点击漏斗 popover 弹层展示 clone 槽内容） |
| `teleportTo`   | `string \| Element` | —       | 分身目标容器（表头预埋唯一选择器；`shadowClone` 时生效，未配置不分身）                          |
| `label`        | `string`            | —       | 分身位字段文字（表头列名；label + 漏斗整块展示、高亮整块——不传仅漏斗，向后兼容）                |
| `highlighted`  | `boolean`           | `false` | 分身整块高亮标识（外部判定后传入，如筛选有值；插槽作用域同步暴露）                              |
| `popoverWidth` | `number \| string`  | `220`   | popover 弹层宽度（表头空间内弹层，默认容纳输入框/选择器）                                       |

### Emits

无（零值逻辑：v-model 由消费方组件持有，经插槽同源绑定驱动双处视图一致）。

### Slots

| name      | 作用域参数                 | 语义                                                                                             |
| --------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| `default` | `{ highlighted: boolean }` | 本体位内容（实际组件形态；一般直接写死绑定，无需 scope——scope 仅在需要拿高亮标识做同级处理时用） |
| `clone`   | `{ highlighted: boolean }` | **popup 弹层内容**（漏斗点击后展示）；**默认 fallback = default 插槽内容**（不传即与本体同形态） |

### Exposes

无（内部 ShadowClone / ElPopover 实例不对外暴露）。

> 目录迁移：实现与配套收纳到 `components/form/form-shadow-clone-dispatch`，包根 API 与演示能力保持。

## B 包迁移

本件实现及配套测试/类型迁入 `@done-coding/forge-form`；旧 admin-core 根的原导出范围、别名、props/槽/事件保持。内部件不会因迁移加入旧根公开面；公共桶以 package.json exports 为准。共享注入契约仍由 forge-core 定义。

## 无障碍语义（td1v4s）

漏斗按钮名称来自既有 label（“筛选 + label”），未提供 label 时为“筛选”，不新增 prop。
