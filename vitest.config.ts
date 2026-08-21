import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    css: false,
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "tests/**"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
