import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * GitHub Pages project sites are served at /<repo-name>/.
 * CI sets PAGES_BASE from the repository name so renames keep working.
 */
function pagesBase(): string {
  if (process.env.GITHUB_PAGES !== "true") return "/";
  const fromEnv = process.env.PAGES_BASE?.trim();
  if (fromEnv) {
    return fromEnv.endsWith("/") ? fromEnv : `${fromEnv}/`;
  }
  return "/secret-response/";
}

export default defineConfig({
  base: pagesBase(),
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    include: ["@secret-response/core", "@secret-response/shared"],
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    emptyOutDir: true,
  },
});
