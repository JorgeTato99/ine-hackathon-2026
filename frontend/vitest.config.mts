import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { workersFor } from "./scripts/execution-profile.ts";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/vitest.setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
    pool: "forks",
    maxWorkers: workersFor("unit"),
    maxConcurrency: 1,
    clearMocks: true,
    testTimeout: 10_000,
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
      reporter: ["text", "html", "json", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      // El layout y el renderer Canvas dependen del navegador y se verifican en E2E real.
      exclude: [
        "src/app/layout.tsx",
        "src/components/map/**",
        "**/*.d.ts",
        "**/*.stories.{ts,tsx}",
      ],
      thresholds: { statements: 90, lines: 90, functions: 90, branches: 80 },
    },
  },
});
