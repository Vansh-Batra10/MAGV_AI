import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/.data/**", "**/out/**", "docs/**", "**/*.config.*", "**/next-env.d.ts", "**/test-results/**", "**/playwright-report/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-restricted-properties": ["error", { object: "Math", property: "random", message: "Use the seeded PRNG (packages/renderer/src/prng.ts); renders must be deterministic." }]
    }
  },
  {
    files: ["**/*.mjs", "**/*.cjs", "**/scripts/**"],
    languageOptions: { globals: { process: "readonly", console: "readonly", __dirname: "readonly", window: "readonly", document: "readonly", URLSearchParams: "readonly", setTimeout: "readonly", Buffer: "readonly", URL: "readonly", fetch: "readonly" } }
  }
);
