import { defineProductSite } from "@done-coding/site-kit/product";

export default defineProductSite({
  configUrl: import.meta.url,
  base: "/forge/",
  title: "forge",
  tagline: "组件库：表单、数据、导航、反馈与布局编排组件",
});
