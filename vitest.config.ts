import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globalSetup: ["./test/global-setup.ts"],
    env: {
      DATABASE_URL: "file:./test.db",
    },
    // Les tests d'intégration partagent une même base SQLite (test.db) : on désactive le
    // parallélisme entre fichiers pour éviter que leurs resets (deleteMany) ne se percutent.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // Glue de routing Next (rendu/fetch/formulaire) : couverte par le build + les tests
        // de composant/action ; la logique testable vit dans lib/ et contract-view.tsx.
        "src/**/layout.tsx",
        "src/**/page.tsx",
        "src/**/globals.css",
        "**/*.d.ts",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 60,
      },
    },
  },
});
