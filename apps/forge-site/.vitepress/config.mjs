import { defineProductSite } from "@done-coding/site-kit/product";

export default defineProductSite({
  configUrl: import.meta.url,
  base: "/forge/",
  title: "forge",
  tagline: "组件库：表单、数据、导航、反馈与布局编排组件",
  packages: [
    {
      name: "@done-coding/forge",
    },
    {
      name: "@done-coding/forge-compose",
    },
    {
      name: "@done-coding/forge-core",
    },
    {
      name: "@done-coding/forge-data",
    },
    {
      name: "@done-coding/forge-feedback",
    },
    {
      name: "@done-coding/forge-form",
    },
    {
      name: "@done-coding/forge-kit-agent",
    },
    {
      name: "@done-coding/forge-kit-flow",
    },
    {
      name: "@done-coding/forge-nav",
    },
    {
      name: "@done-coding/forge-plugin-report",
    },
    {
      name: "@done-coding/forge-plugin-theme",
    },
    {
      name: "@done-coding/forge-plugin-tour",
    },
  ],
});
