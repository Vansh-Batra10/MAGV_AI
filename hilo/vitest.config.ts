import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src"), "@messages": path.resolve(__dirname, "messages") } },
  test: { include: ["tests/unit/**/*.test.ts"], environment: "node", testTimeout: 30000 },
});
