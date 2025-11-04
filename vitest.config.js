import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Disable worker threads since tests use process.chdir()
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
