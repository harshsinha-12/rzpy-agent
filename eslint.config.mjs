import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

const webFiles = ["apps/web/**/*.{js,jsx,ts,tsx}"];
const nodeFiles = [
  "apps/api/**/*.ts",
  "apps/worker/**/*.ts",
  "packages/**/*.ts",
];

const scopeToFiles = (configs, files) =>
  configs.map((config) => ({ ...config, files }));

export default defineConfig([
  ...scopeToFiles(nextVitals, webFiles),
  ...scopeToFiles(nextTypescript, webFiles),
  ...scopeToFiles(tseslint.configs.recommended, nodeFiles),
  {
    files: nodeFiles,
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  globalIgnores([
    "**/.next/**",
    "**/coverage/**",
    "**/dist/**",
    "**/node_modules/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
