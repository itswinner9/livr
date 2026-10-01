import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "supabase/tests/**/*.test.ts"],
    testTimeout: 60_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "lib/test/server-only-stub.ts"),
    },
  },
});
