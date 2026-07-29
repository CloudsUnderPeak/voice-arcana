import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset URLs work on both user/organization Pages and
  // repository Pages mounted under /<repository>/.
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    sourcemap: false,
  },
});

