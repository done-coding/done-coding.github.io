# FormSelectShadowClone

> 文档定位：API · 公开选择器影分身；源码与类型为准。

在原位置与指定容器的漏斗弹层中渲染同源 FormSelect，不持有业务数据。普通选择用 FormSelect。

## 快速上手

`<FormSelectShadowClone v-model="status" label="状态" :options="options" shadow-clone teleport-to=".filters" />`

## 能力边界

目标容器由调用方提供，本体/弹层共享同一 v-model；远程选项与事件经 FormSelect 原属性透传。

## API

modelValue 为选项值；shadowClone?:boolean 控制影分身；teleportTo?:string|Element 为目标；label?:string 为字段文字及默认可访问名；isHighlighted?:(value:unknown)=>boolean 覆盖高亮判断。update:modelValue 回传选项值，option 槽透出 data。其余属性和 option 槽沿 FormSelect，已有 aria-label attr 可覆盖本体/分身默认名。不新增公开 prop。
