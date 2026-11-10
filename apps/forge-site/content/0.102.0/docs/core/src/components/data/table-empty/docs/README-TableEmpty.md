# TableEmpty（列表空态）

## 定位

只负责展示加载中、错误、尚未查询与暂无数据；TableMain 负责请求和状态切换。它不发请求、不弹消息，也不记录 console。

## 快速上手

```vue
<script setup lang="ts">
import { TableEmpty } from "@done-coding/forge";
</script>

<template>
  <TableEmpty :has-requested="true" error="「天数」须为数字" />
</template>
```

## 能力边界

展示优先级为 loading → error → 尚未请求 → 暂无数据。error 未传（undefined）时不显示错误；传空字符串仍表示失败。成功后由状态持有者清除 error。无重试按钮，重试入口由外层提供。

## API

| Prop         | 类型    | 默认      | 说明                                            |
| ------------ | ------- | --------- | ----------------------------------------------- |
| loading      | boolean | false     | 展示「加载中...」                               |
| hasRequested | boolean | false     | false 显示「欢迎触发查询」；true 显示默认空结果 |
| error        | string  | undefined | 展示「加载失败：」加错误正文；优先于欢迎/空结果 |

无 emits、slots 或 expose。
