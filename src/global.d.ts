import type { routing } from "@/i18n/routing";
import type messages from "./messages/en.json";

// Augmentation next-intl : locales connues + typage des clés de messages depuis le catalogue EN
// (source de vérité). Une clé manquante dans une traduction ou un t("…") invalide devient une
// erreur de typecheck.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
