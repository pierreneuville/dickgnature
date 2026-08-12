"use client";

import { useTranslations } from "next-intl";
import type { Tone } from "@/lib/tone";
import {
  availableSignatureModes,
  type SignatureMode,
} from "@/lib/signatures";

const MODE_LABEL_KEYS = {
  handwritten: "pickerHandwrittenLabel",
  pattern: "pickerPatternLabel",
} as const;

const MODE_HINT_KEYS = {
  handwritten: "pickerHandwrittenHint",
  pattern: "pickerPatternHint",
} as const;

// Sélecteur de mode purement présentiel : il n'affiche QUE les modes autorisés pour le ton.
// En "serious", seul le manuscrit est proposé — le motif parodique est absent du DOM (pas juste
// masqué), ce qui garantit qu'aucun humour n'est imposé au signataire (testé).
export function ModePicker({
  tone,
  selected,
  onSelect,
}: {
  tone: Tone;
  selected: SignatureMode;
  onSelect: (mode: SignatureMode) => void;
}) {
  const t = useTranslations("signatureMode");
  const modes = availableSignatureModes(tone);

  if (modes.length < 2) {
    return null;
  }

  return (
    <div className="mode-picker" role="radiogroup" aria-label={t("styleAria")}>
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={selected === mode}
          className={`mode-tab${selected === mode ? " is-active" : ""}`}
          onClick={() => onSelect(mode)}
        >
          <span className="mode-tab-label">{t(MODE_LABEL_KEYS[mode])}</span>
          <span className="mode-tab-hint">{t(MODE_HINT_KEYS[mode])}</span>
        </button>
      ))}
    </div>
  );
}
