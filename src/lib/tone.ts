// Ton d'un contrat. Porté par le contrat, jamais imposé au 2e signataire (décision Gate 1).
// Défaut = "fun" (choix utilisateur). Le mode "serious" doit rester neutre sur toutes les
// surfaces (page, email, PDF) — exigence de spec.

export const TONES = ["fun", "serious"] as const;

export type Tone = (typeof TONES)[number];

export const DEFAULT_TONE: Tone = "fun";

export function isTone(value: unknown): value is Tone {
  return typeof value === "string" && (TONES as readonly string[]).includes(value);
}

export type ToneTheme = {
  label: string;
  brand: string;
  tagline: string;
  showParodyDisclaimer: boolean;
  accent: string;
};

const THEMES: Record<Tone, ToneTheme> = {
  fun: {
    label: "Fun",
    brand: "dickgnature",
    tagline: "The most serious-ish agreement of your life.",
    showParodyDisclaimer: true,
    accent: "#e11d8f",
  },
  serious: {
    // Mode serious : neutre, aucune marque parodique.
    label: "Serious",
    brand: "Signature",
    tagline: "Agreement between two parties.",
    showParodyDisclaimer: false,
    accent: "#1f2937",
  },
};

export function themeFor(tone: Tone): ToneTheme {
  return THEMES[tone];
}
