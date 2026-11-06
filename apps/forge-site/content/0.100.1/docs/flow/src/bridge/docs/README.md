# bridge 基座（公开 API）

一个可作为 **Vue 插件**安装（`app.use(bridge)`）、自身又是**插件宿主**（`bridge.use(plugin)`）的轻量基座：只读响应式配置 + 增量 `update` + 命名空间化的 `storage` / `useState` 原语。无业务耦合，配置 map 由调用方泛型自定义。

> ⚠️ API 以 bridge/index.ts 与各模块源码为真相源（JSDoc 完整）。

## 快速上手

```ts
import { createBridge, BRIDGE_KEY } from "@done-coding/forge-kit-flow";

interface AppConfig {
  base: { title: string };
  theme: { dark: boolean };
}

const bridge = createBridge<AppConfig>({
  namespace: "myapp", // 派生 storage / useState 的 key 前缀
  config: { base: { title: "Hi" }, theme: { dark: false } },
});

// 1) 作为 Vue 插件：app.use(bridge) 经 provide(BRIDGE_KEY) 全局注入整个 bridge
app.use(bridge);
// 子组件：const bridge = inject(BRIDGE_KEY)

// 2) 单字段一级浅合并 update（未传字段保留，config 只读视图自动跟随）
bridge.update("theme", { dark: true });

// 3) 作为插件宿主：bridge.use(plugin, options)，按引用 / name 幂等安装
const logPlugin = {
  name: "log",
  install: (ctx) => ctx.update("base", { title: "by-plugin" }),
};
bridge.use(logPlugin);
```

## API

### createBridge<C extends object>(options): Bridge<C>

| options     | 类型      | 语义                                                                                      |
| ----------- | --------- | ----------------------------------------------------------------------------------------- |
| `config`    | `C`       | 初始配置 map（业务自定义；基座对字段语义不透明）                                          |
| `namespace` | `string?` | 派生内部 storage / useState 的 key 前缀；不传兜底 `"BRIDGE"`，空串额外 console.error 告警 |

### Bridge 实例

| 成员                    | 类型              | 语义                                                                                      |
| ----------------------- | ----------------- | ----------------------------------------------------------------------------------------- |
| `config`                | `DeepReadonly<C>` | 配置只读响应式视图（update 后自动跟随；[MUST NOT] 解构/快照取值）                         |
| `update(key, partial)`  | —                 | 单字段一级浅合并（未传字段保留；[MUST NOT] 期望深合并）                                   |
| `use(plugin, options?)` | —                 | 插件宿主：按引用 / name 幂等安装，返回 bridge 自身（链式）                                |
| `install(app)`          | —                 | Vue 插件 install：`app.provide(BRIDGE_KEY, bridge)`（opt-in，未 use 则 inject undefined） |
| `getStorage()`          | `Storage`         | 内部派生的命名空间化 storage 实例（引用稳定，多次调用 `===`）                             |
| `useState`              | `UseState`        | 内部派生 useState 实例方法（ns 已绑定，调用方零 ns 参）                                   |

### BRIDGE_KEY

`InjectionKey<Bridge>`（`Symbol.for` 全局注册：`@done-coding/forge-flow:BRIDGE_KEY`，历史 namespace 固定，不随安装包名变化）。

### 底层工厂（独立导出）

`createUseState` / `createStorageWithNamespace`——需要独立于 bridge 实例的场景（多命名空间 / 直接消费）。

## 插件契约

`install(ctx, options)`：

- `ctx.bridge`：屏蔽了 `use` / `install` 的 bridge 切片（`BridgePluginBridgeSlice`）——插件内不能互相嵌套安装
- `ctx.update`：配置更新便捷引用（同 bridge.update）
- 幂等：同一插件**引用**或**同名（name）**重复安装时跳过

## 注意

- **零模块级单例**：每次 `createBridge` 在闭包内独立构造（config / storage / 插件宿主状态仅存于闭包）——避免 dist/src 双 module instance 分裂；[MUST NOT] 用 globalThis 兜底
- namespace 决定 storage key 前缀与 useState cacheKey 前缀的一致性（两者共用同一 namespace）
