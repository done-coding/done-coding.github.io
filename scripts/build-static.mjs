// 占位站点的构建：把 public/ 原样复制到 dist/。换成 VitePress 等工具时替换该 app 的 build 脚本即可。
import { cpSync, rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
cpSync("public", "dist", { recursive: true });
