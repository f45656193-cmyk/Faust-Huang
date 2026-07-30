import type { NextConfig } from "next";

const githubRepositoryName =
  process.env.GITHUB_REPOSITORY?.split("/").filter(Boolean).at(-1) ??
  "Faust-Huang";

const nextConfig: NextConfig = {
  // 国内静态托管使用纯前端导出；现有 Sites 发布仍沿用默认构建。
  output:
    process.env.DOMESTIC_STATIC_EXPORT === "1" ? "export" : undefined,
  basePath:
    process.env.GITHUB_PAGES === "1"
      ? `/${githubRepositoryName}`
      : undefined,
  typescript: {
    // Cloudflare 专用 db/worker 类型不参与纯前端导出。
    ignoreBuildErrors: process.env.DOMESTIC_STATIC_EXPORT === "1",
  },
};

export default nextConfig;
