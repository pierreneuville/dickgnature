"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { burstConfetti } from "@/lib/confetti";

// Respecte la préférence système : si l'utilisateur réduit les animations (ou si matchMedia est
// indisponible), on n'anime pas — le message reste affiché.
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Bandeau du clin d'œil : chaleureux, dismissible, ne bloque jamais la signature. Le nom sert à
// personnaliser le message ; les confettis ne partent qu'en l'absence de prefers-reduced-motion.
export function EasterEggBanner({ name }: { name: string }) {
  const t = useTranslations("easterEgg");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!prefersReducedMotion()) {
      void burstConfetti();
    }
  }, []);

  if (dismissed) {
    return null;
  }

  return (
    <div
      className="easter-egg"
      role="status"
      aria-live="polite"
      aria-label={t("regionLabel")}
    >
      <div className="easter-egg-body">
        <p className="easter-egg-heading">{t("heading", { name })}</p>
        <p className="easter-egg-text">{t("body")}</p>
      </div>
      <button
        type="button"
        className="easter-egg-dismiss"
        onClick={() => setDismissed(true)}
      >
        {t("dismiss")}
      </button>
    </div>
  );
}
