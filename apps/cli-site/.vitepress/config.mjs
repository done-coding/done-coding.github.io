import { defineProductSite } from "@done-coding/site-kit/product";

export default defineProductSite({
  configUrl: import.meta.url,
  base: "/cli/",
  title: "cli",
  tagline: "done-coding 命令行工具",
  packages: [
    {
      name: "@done-coding/cli-cc-switch",
      doc: "packages/cc-switch.md",
    },
    {
      name: "done-coding",
      doc: "packages/cli.md",
    },
    {
      name: "@done-coding/cli-skills",
      doc: "packages/cli-skills.md",
    },
    {
      name: "@done-coding/cli-component",
      doc: "packages/component.md",
    },
    {
      name: "@done-coding/cli-config",
      doc: "packages/config.md",
    },
    {
      name: "create-done-coding",
      doc: "packages/create.md",
    },
    {
      name: "@done-coding/cli-dex",
      doc: "packages/dex.md",
    },
    {
      name: "@done-coding/cli-extract",
      doc: "packages/extract.md",
    },
    {
      name: "@done-coding/cli-generator",
      doc: "packages/generator.md",
    },
    {
      name: "@done-coding/cli-git",
      doc: "packages/git.md",
    },
    {
      name: "@done-coding/cli-harness",
      doc: "packages/harness.md",
    },
    {
      name: "@done-coding/cli-inject",
      doc: "packages/inject.md",
    },
    {
      name: "@done-coding/cli-mcp",
      doc: "packages/mcp.md",
    },
    {
      name: "@done-coding/cli-publish",
      doc: "packages/publish.md",
    },
    {
      name: "@done-coding/cli-template",
      doc: "packages/template.md",
    },
    {
      name: "@done-coding/cli-utils",
      doc: "packages/utils.md",
    },
  ],
});
