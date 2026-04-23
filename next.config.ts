import type { NextConfig } from "next";

const rawBasePath = process.env.NEXT_BASE_PATH ?? "";
const normalizedBasePath =
  rawBasePath === "/" ? "" : rawBasePath.replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: normalizedBasePath,
  assetPrefix: normalizedBasePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: normalizedBasePath,
  },
};

export default nextConfig;
