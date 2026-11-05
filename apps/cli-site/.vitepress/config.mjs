import { defineProductSite } from "@done-coding/site-kit/product";

export default defineProductSite({
  configUrl: import.meta.url,
  base: "/cli/",
  title: "cli",
  tagline: "done-coding 命令行工具",
});
