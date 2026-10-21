import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import globals from "globals";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  prettier,
  {
    files: ["**/*.{mjs,mts}", "*.config.ts", ".storybook/*.{ts,tsx}"],
    languageOptions: { globals: globals.node },
  },
  {
    rules: {
      eqeqeq: "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  globalIgnores([
    "artifacts/**",
    ".cache/**",
    ".next/**",
    "out/**",
    "coverage/**",
    "storybook-static/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);
