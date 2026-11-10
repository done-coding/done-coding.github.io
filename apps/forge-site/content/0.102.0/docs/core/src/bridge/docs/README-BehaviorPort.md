# 可选行为端口（v0.101.0）

## 定位与职责

forge bridge 产生组件事件，行为端口挑选用户意图、裁剪载荷并补充上下文，应用 `send` 再接自己的采集/实验平台。端口不实现传输、存储、匿名 ID 生成、实验分流或统计分析，不依赖供应商。`forge-plugin-report` 的 EventInspector 是本地有界调试观察器，不能当作分析系统。

## 快速上手

在应用根组件 setup 中接一次；bridge 须已由祖先或 app.use 提供。不要在每个按钮接一份全局订阅。

```ts
import { useBehaviorPort } from "@done-coding/forge";

const behavior = useBehaviorPort({
  context: () => ({
    page: { path: route.path, name: "注册" },
    actor: { kind: "anonymous", id: anonymousId },
    sessionId,
    experiments: { signup: variant.value },
  }),
  send: (record) => applicationSink(record),
});
// 变体实际呈现后显式调用，不在分配分组时调用：
behavior.exposure({ experiment: "signup", variant: variant.value });
```

## API

- `createBehaviorPort(bridge, options): BehaviorPort`：独立工厂，只需要 bridge 的 onEvent；调用即订阅，由使用方 dispose。
- `useBehaviorPort(options): BehaviorPort`：inject CORE_BRIDGE_KEY，setup 即接线（可收到子组件 mounted 的曝光），失活退订、重激活恢复，scope 销毁退订。显式 dispose 是永久停止，不会在重激活时复活。
- 无 bridge 返回空操作句柄，不读取 context、不调用 send。未调用工厂/组合函数时零订阅；bridge 无其他订阅且镜像关闭时 collecting=false，事件 thunk 不求值。
- `BehaviorPortOptions.send(record): void | Promise<void>` 必填。同步/异步失败均隔离，不重试、不缓存、不制造 report-error 循环；应用负责错误提示、可靠投递及背压。
- `BehaviorPortOptions.context(): BehaviorContext` 必填，每条记录取当时值并按契约复制快照；不保留 reactive 对象引用。取值失败丢弃该条。
- `BehaviorContext`：`{ page?: { path: string; name?: string }, actor: { kind: "anonymous" | "user"; id: string }, sessionId: string, experiments?: Record<string,string> }`。应用提供不含正文的稳定标识；page.path 推荐无 query/hash 的路由路径。
- `events?: readonly BridgeEventName[]` 覆盖默认集，`[]` 不订阅动作但仍可显式曝光。覆盖意味着应用已核实自己的调用链；把 mixed/program 事件加入会失去默认用户意图保证，端口不能自动识别真实来源。
- `BehaviorRecord`：`{ kind: "action" | "exposure", event: BridgeEventName | "exposure", origin: "user" | "unverified", trackKey?: string, source?: "standalone" | "group", data: Record<string, string | number | boolean>, context: BehaviorContext, timestamp: number }`。
- `exposure({ experiment: string, variant: string, trackKey?: string }): void`：产生 `kind/event: "exposure"`，data 仅 experiment/variant。不改 context.experiments、不自动曝光、不去重；应用决定一次实际呈现何时计数。origin=user 表示面向用户的呈现/意图，不声称曝光是鼠标动作。动作记录仅对 `BEHAVIOR_DEFAULT_EVENTS` 内经核查的事件标 user；应用经 events 追加的 mixed/program 事件标 `unverified`，不冒充用户意图。
- `dispose(): void`：幂等退订；其后动作和曝光均不再 send。

## 数据边界

只复制事件逐项允许的标量字段；不透传 meta/path、自定义 groupMeta、确认 title/content、表单字段名或输入值。form-submit/reset/cancel/valid/invalid 的 data 一律为空对象，即使应用显式选入也不复制表单。按钮只保留 type/key/index/rowKey/confirmed；source 与 trackKey 提升为记录顶层。其他已登记事件只允许契约中的计数、布尔、路径或标识，未列出的字段丢弃。

标识本身由应用负责，禁止把自由输入塞进 trackKey、actor.id、实验键或路由等字段。此裁剪不等于对恶意生产者的内容识别。不会采集“填写”的输入正文或每次按键；示例中的填写是本地表单步骤，行为链以曝光、开始按钮、提交/取消按钮意图关联。

## 事件分类（逐发射点核查）

下表路径相对仓根。user 表示当前组件接线只在交互回调发射；program 表示状态/结果通知；mixed 表示同一入口也可被程序调用或监听状态变化。人工 emitEvent 和脚本合成 DOM 点击无法由总线鉴真，不能用 origin 作为安全或防作弊依据。

| 事件                      | 分类    | 默认 | 依据文件:行与调用链                                                                                                                                  |
| ------------------------- | ------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| action-click              | user    | 是   | `packages/forge-core/src/components/basic/action-btn/ActionBtn.vue:173`，点击守卫后发；Group 只传定位                                                |
| confirm-open              | user    | 是   | `packages/forge-core/src/components/basic/action-btn/ActionBtn.vue:194`，上述点击通过 beforeOpen 后打开                                              |
| confirm-close             | user    | 是   | `packages/forge-core/src/components/feedback/action-confirm/ActionConfirm.vue:104`、`:113`、`:159`，确认结算或取消；卸载本身不报                     |
| form-valid                | program | 否   | `packages/forge-form/src/components/form-main/FormMain.vue:291`，公开 validate 结果                                                                  |
| form-invalid              | program | 否   | `packages/forge-form/src/components/form-main/FormMain.vue:280`，公开 validate 结果                                                                  |
| form-submit               | mixed   | 否   | `packages/forge-form/src/components/form-submit-panel/FormSubmitPanel.vue:215`，slot 暴露 submit；可程序调用                                         |
| form-reset                | mixed   | 否   | `packages/forge-form/src/components/form-submit-panel/FormSubmitPanel.vue:197`，按钮与 slot reset 共用                                               |
| form-cancel               | mixed   | 否   | `packages/forge-form/src/components/form-submit-panel/FormSubmitPanel.vue:188`，按钮与 slot cancel 共用                                              |
| search                    | mixed   | 否   | `packages/forge-form/src/components/form-search/FormSearch.vue:277`、`:302`，公开 triggerSearch                                                      |
| search-reset              | mixed   | 否   | `packages/forge-form/src/components/form-search/FormSearch.vue:271`、`:301`，公开 triggerReset                                                       |
| search-toggle             | mixed   | 否   | `packages/forge-form/src/components/form-search/FormSearch.vue:254`、`:303`，公开 toggleCollapse                                                     |
| nest-list-add             | mixed   | 否   | `packages/forge-form/src/components/form-item-nest-form-list/FormItemNestFormList.vue:214`、`:230`，footerRender 得到 add                            |
| nest-list-remove          | user    | 是   | `packages/forge-form/src/components/form-item-nest-form-list/FormItemNestFormList.vue:47`、`:219`，仅删除按钮确认回调                                |
| table-page-change         | mixed   | 否   | `packages/forge-data/src/components/table-main/TableMain.vue:121`；EP 分页 update 也会由页数归一触发；hook 有保护但未证明所有程序路径排除            |
| table-size-change         | mixed   | 否   | `packages/forge-data/src/components/table-main/TableMain.vue:127`；EP page-sizes 变化也会自动调整容量，不能按 update 认定用户                        |
| table-selection-change    | user    | 是   | `packages/forge-data/src/components/table-main/use-table-report.ts:84`、`:99`，仅 EP select/select-all，不接 selection-change                        |
| table-row-select          | user    | 是   | `packages/forge-data/src/components/table-main/use-table-report.ts:89`，同上，明确行选择                                                             |
| table-scroll              | mixed   | 否   | `packages/forge-data/src/components/table-main/use-table-report.ts:34`，DOM scroll 也来自程序滚动                                                    |
| table-export              | user    | 是   | `packages/forge-data/src/components/TableToolbar.vue:7`、`:213`，下拉 command，防并发后发                                                            |
| table-view-toggle         | user    | 是   | `packages/forge-data/src/components/TableToolbar.vue:42`，ElSwitch change，不 watch model                                                            |
| dataview-selection-change | mixed   | 否   | `packages/forge-data/src/components/data-list-view/DataListView.vue:211`、`:235`，公开 toggleAllSelection/toggleRowSelection                         |
| dataview-row-select       | mixed   | 否   | `packages/forge-data/src/components/data-list-view/DataListView.vue:221`、`:235`，同上                                                               |
| datagrid-selection-change | mixed   | 否   | `packages/forge-data/src/components/data-grid-view/DataGridView.vue:610`、`:622`，gridInstance 暴露选择方法                                          |
| datagrid-row-select       | mixed   | 否   | `packages/forge-data/src/components/data-grid-view/DataGridView.vue:599`、`:621`，同上                                                               |
| refresh                   | user    | 否   | `packages/forge-core/src/components/other/auto-refresh-group/use-auto-refresh-group-report.ts:8`，实际仅手动；自动定时不发。按保守默认策略排除       |
| auto-refresh-toggle       | mixed   | 否   | `packages/forge-core/src/components/other/auto-refresh/use-auto-refresh-report.ts:26`，watch enabled，含程序赋值                                     |
| tab-change                | mixed   | 否   | `packages/forge-nav/src/components/tabs-main/use-tabs-report.ts:33`，watch 有效 key，含程序赋值与 query 变化                                         |
| menu-select               | user    | 是   | `packages/forge-nav/src/components/menu-tree/MenuTree.vue:111` 与 `packages/forge-nav/src/components/MenuItemLeaf.vue:46`，select / \_blank 点击委托 |
| modal-open                | mixed   | 否   | `packages/forge-feedback/src/components/modal-shelf/modal-shelf-core.ts:150`，公开 controller/remote 发射，无输入来源区分                            |
| modal-close               | mixed   | 否   | `packages/forge-feedback/src/components/modal-shelf/modal-shelf-core.ts:78`，公开 close/remove 与界面关闭共用                                        |
| modal-update              | program | 否   | `packages/forge-feedback/src/components/modal-shelf/modal-shelf-core.ts:112`，控制器更新通知                                                         |
| body-scroll               | mixed   | 否   | `packages/forge-compose/src/components/layout/app-body/use-body-report.ts:22`，文档 scroll，含程序滚动                                               |
| sidebar-toggle            | mixed   | 否   | `packages/forge-core/src/bridge/layout.ts:191`，setter 被按钮、store、主题及 openMenuTo 共用                                                         |
| aside-toggle              | mixed   | 否   | `packages/forge-core/src/bridge/layout.ts:201`，setter 被按钮、store、主题共用                                                                       |

默认 9 个事件，由 `BEHAVIOR_DEFAULT_EVENTS` 导出。6 个 app/request 预留事件无自动源，report-error 为诊断，均不在默认集。mixed 的遗漏是明确限制，本次不改它们的组件逻辑；可用 ActionBtn 的稳定 trackKey 补业务意图，不能将整个总线默认标成 user。

核查材料来自当前仓源码及已装 Element Plus 2.13.7 分页实现（本仓既有 MIT 依赖，未引入或复制外部实现）；分页的归一/公开方法限制需要随依赖升级复核。

## 示例与验证边界

`/other/integration/behavior-analytics` 是页面范围的内存 sink：A/B 显式分组，呈现后显式曝光，开始→填写→提交/取消。记录最多 100 条，不发网络、不写存储；程序切 tab 只产生被默认排除的 bridge 状态事件。切换分组本身不曝光，需点击展示变体。默认表单 mixed 事件不收，按钮意图也不冒充提交成功。

示例与单测验证端口接线和本地行为，不证明应用的传输、实验分流正确性或平台统计结果。
