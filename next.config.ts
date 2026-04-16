import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid Next.js inferring the workspace root when multiple lockfiles exist.
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
