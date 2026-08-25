import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // See tests/stubs/server-only.ts for why this is stubbed under Vitest.
      "server-only": path.resolve(__dirname, "./tests/stubs/server-only.ts"),
    },
  },
  test: {
    // Component tests opt into happy-dom individually via a
    // `// @vitest-environment happy-dom` docblock at the top of the file.
    // (jsdom is avoided here: its CSS color parsing chain currently pulls
    // in @csstools/css-calc, whose package.json exports only a "default"
    // condition pointing at an .mjs file with no "require" condition --
    // jsdom's CJS build calling require() on it throws ERR_REQUIRE_ESM.)
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/component/**/*.test.tsx"],
  },
});
