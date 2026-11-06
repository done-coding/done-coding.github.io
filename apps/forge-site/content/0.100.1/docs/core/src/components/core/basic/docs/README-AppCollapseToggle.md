# AppCollapseToggle

> 文档定位：API · 布局包使用的折叠把手原语；沿用既有行为。

提供 sidebar/aside 两侧折叠把手，配合外层布局 setter。包间消费入口为 `@done-coding/forge-core/components/basic`；应用通常使用布局组件提供的把手。

| API      | 类型            | 说明                                        |
| -------- | --------------- | ------------------------------------------- |
| show     | boolean         | 控制把手渲染                                |
| collapse | boolean         | 当前折叠态，控制提示与箭头                  |
| side     | sidebar / aside | 悬挂方向                                    |
| toggle   | 无载荷事件      | 鼠标或 Enter/Space 激活；由父组件更新折叠态 |

本原语只发toggle，不改bridge/store，也不重复发sidebar/aside总线事件。样式与原实现一致。
