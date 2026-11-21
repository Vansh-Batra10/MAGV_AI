import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["test/**/*.exports.test.ts"], testTimeout: 600_000, hookTimeout: 120_000 } });
