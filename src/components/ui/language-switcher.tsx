"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

// Étiquettes natives de chaque langue (endonymes) — jamais traduites.
const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  pt: "Português",
  es: "Español",
};

// Sélecteur de langue accessible et mobile-first : un <select> natif (clavier + lecteurs d'écran
// gratuits) qui remplace la locale du chemin courant en conservant la page. Progressif : fonctionne
// même pendant la transition de route.
export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <label className="lang-switcher">
      <span className="lang-switcher__label">{t("language")}</span>
      <select
        className="lang-switcher__select"
        value={locale}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.value as Locale;
          startTransition(() => {
            router.replace(pathname, { locale: next });
          });
        }}
      >
        {routing.locales.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
