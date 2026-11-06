# decor — 装饰层

**内部件，不在包导出面。** 由各 shell 内部渲染，19 件装饰 + 一个共享几何 hook。

> 族级文档，[MUST NOT] 逐件写。真相源 = 组件源码。

## 构成

- **装饰件**（19）：按 shell 配对，如 `KitchenFoundryDecor` ↔ `KitchenFoundryShell`、
  `StudioStageDecor` ↔ `StudioStageShell`、`PerspectiveDeckDecor` ↔ `PerspectiveDeckShell`；
  另有通用件 `StarfieldDecor` / `ScanlineDecor` / `AuroraFrameDecor` 等。
- **`CockpitFrameMatte`**：座舱系的不透明遮罩带。
- **`use-frame-geometry.ts`**：套框几何 + 明暗态读取（`bridge?.themeIsDark`，缺省按亮场
  保守不滥放动效）。

## 硬约束（除 shells/README 那六条外，decor 另有两条）

**⑦ [MUST NOT] 喧宾夺主 —— 装饰约束进边框圈**
decor [MUST] 用 mask 抠空内容矩形，只在 viewport 边距带绘制。内容区保持干净。
实测教训：装饰跨内容区会被甲方直接判否。

**⑧ z-index 管绘序、不管透明度**
半透明 decor **压不住**内容——要挡住内容必须用不透明的 `bodyColor` matte（且只铺边距带），
[MUST NOT] 指望调 z-index 解决"透过来了"的问题。

## 验证注意

**element 截图不含 fixed 层**，验叠加效果 [MUST] 用整屏截图，否则会假绿。
