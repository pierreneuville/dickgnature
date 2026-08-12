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
    // The disposable PostgreSQL database can be remote (for example, an isolated Neon
    // project in CI/verify), so integration tests need room for network round trips.
    testTimeout: 30_000,
    // next-intl est distribué en ESM et importe "next/navigation" en spécifieur nu ; on l'inline
    // pour que Vite le transforme et résolve les sous-chemins du paquet "next" comme en prod.
    server: {
      deps: {
        inline: ["next-intl"],
      },
    },
    // Integration tests share one disposable PostgreSQL database, so their deleteMany resets
    // must not race each other. test/global-setup.ts also refuses non-test database names.
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
        // Glue navigateur : canvas HTML5 (signature_pad) + orchestration client des formulaires
        // (signature, ajout de participants). Non exécutables en jsdom (pas de contexte 2D, actions
        // serveur liées). La logique métier vit dans src/lib/{signatures,participants,contract-status}
        // et est testée en unitaire + intégration ; le rendu présentiel via mode-picker/participants-list.
        "src/**/signature-canvas.tsx",
        "src/**/sign-form.tsx",
        "src/**/participants-form.tsx",
        "src/**/resend-invitation.tsx",
        // Glue navigateur : déclenchement de canvas-confetti (canvas 2D absent en jsdom). La
        // détection et le garde-fou prefers-reduced-motion vivent dans src/lib/easter-egg.ts et
        // easter-egg-banner.tsx, tous deux testés.
        "src/lib/confetti.ts",
        // Glue runtime i18n : wrappers next-intl liés au contexte App Router / requête serveur,
        // non exécutables en jsdom. La logique testable vit dans src/i18n/routing.ts (testé) et le
        // sélecteur language-switcher.tsx (testé). Le comportement de routing est validé au build.
        "src/i18n/navigation.ts",
        "src/i18n/request.ts",
        "src/proxy.ts",
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
