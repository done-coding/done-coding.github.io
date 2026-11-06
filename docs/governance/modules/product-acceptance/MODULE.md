---
module: "product-acceptance"
capability: "只用已发布产物对 done-coding 各产品做黑盒验收"
kind: "kernel"
host: null
status: "active"
paths: ["acceptance/**", "docs/governance/audits/acceptance/**"]
---

# product-acceptance

> 文档定位：规范 · 领域定义；现状见 [模块快照](SNAPSHOT.md)。

职责：站在真实用户的位置，只用 npm 上已发布的包和公开模板，验证 done-coding 各产品能装、能建、能用；结果可复跑，问题写成草稿交给产品仓。

不变式：
- 不读取、不克隆 forge、cli、template-hub 等产品仓的实现代码；只用 registry 与公开文档。
- 不发布、不改产品仓；问题只写成本仓的问题草稿，由总协调转交产品仓。
- 不进 CI 工作流（不加项目私有检查）；由本机命令运行。

合并／撤销条件：产品仓各自建立同等的发布后验收并持续运行时，本模块可退役。
