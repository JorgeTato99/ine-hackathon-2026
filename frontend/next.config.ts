import type { NextConfig } from "next";
import { getBuildWorkers } from "./scripts/build-budget.ts";

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  experimental: {
    cpus: getBuildWorkers(),
    workerThreads: false,
    webpackMemoryOptimizations: true,
  },
};

export default config;
