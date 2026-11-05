module.exports = {
  root: true,
  extends: ["alloy", "alloy/typescript"],
  plugins: ["import", "regexp"],
  parser: "@typescript-eslint/parser",
  parserOptions: {},
  env: {
    browser: true,
    node: true,
  },
  globals: {
    // 可以在此添加自定义全局变量
  },
  rules: {
    /** import 规范 */
    "import/first": "error",
    "import/no-duplicates": "warn",
    "import/no-mutable-exports": "error",

    /** TypeScript 规则 */
    // 允许定义空接口 (如 interface A extends B {})
    "@typescript-eslint/no-empty-interface": "off",
    // 强制使用 as 风格的类型断言
    "@typescript-eslint/consistent-type-assertions": "warn",
    // 强制使用 import type 导入类型声明
    "@typescript-eslint/consistent-type-imports": "warn",

    /** 正则表达式规范 */
    "regexp/no-useless-escape": "warn",
    "regexp/no-useless-character-class": "warn"
  },
  overrides: [
    /**
     * .vue 单文件组件：vue-eslint-parser 解析模板，<script> 交 @typescript-eslint/parser。
     * 仅作用于 *.vue，纯 TS 包的 lint 行为不变。alloy/vue 默认用 babel 解析 <script>，此处显式覆盖为 TS。
     */
    {
      files: ["*.vue"],
      extends: ["alloy/vue"],
      parser: "vue-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".vue"],
      },
      rules: {
        // 同一元素允许 class / :class、style / :style 并存
        "vue/no-duplicate-attributes": [
          "error",
          { allowCoexistClass: true, allowCoexistStyle: true },
        ],
      },
    },
  ],
  // 构建产物和产品仓导出的内容不由本站维护。
  ignorePatterns: ["node_modules", "**/dist/**", "apps/*-site/content/**"],
};
