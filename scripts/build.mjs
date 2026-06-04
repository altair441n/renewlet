import { spawnSync } from "node:child_process";

// 根 build 入口：Cloudflare Workers Builds 注入 WORKERS_CI；本地/CI 默认仍走 Docker/Go/PocketBase 构建链。
// 这个脚本只转发命令，不做环境探测，避免 Cloudflare 构建和 Docker 构建互相污染产物。
const target = process.env.WORKERS_CI === "1" ? "build:cloudflare" : "build:docker";
const result = spawnSync("pnpm", ["run", target], { stdio: "inherit", shell: process.platform === "win32" });

process.exit(result.status ?? 1);
