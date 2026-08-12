import { defineRouting } from "next-intl/routing";

// Routing i18n : EN = langue par défaut, SANS préfixe (les liens déjà distribués — dont les liens
// de signature tokenisés `/sign/[token]` — restent valides). FR/PT/ES sont préfixés (/fr, /pt,
// /es). Le middleware next-intl négocie la locale (cookie puis Accept-Language) sur la racine.
export const routing = defineRouting({
  locales: ["en", "fr", "pt", "es"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
