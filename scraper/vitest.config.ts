import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    globals: false,
    // Force sequential execution so tests that install module mocks don't
    // bleed into one another when they share worker state.
    pool: "forks",
    testTimeout: 10_000,
  },
});
