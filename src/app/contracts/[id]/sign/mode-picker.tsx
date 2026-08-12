"use client";

import type { Tone } from "@/lib/tone";
import {
  availableSignatureModes,
  type SignatureMode,
} from "@/lib/signatures";

const MODE_LABELS: Record<SignatureMode, string> = {
  handwritten: "Draw it yourself",
  pattern: "Use the cheeky stamp",
};

const MODE_HINTS: Record<SignatureMode, string> = {
  handwritten: "Draw your real signature with a finger or mouse.",
  pattern: "Trace the guide or drop the stamp in one tap.",
};

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
  const modes = availableSignatureModes(tone);

  if (modes.length < 2) {
    return null;
  }

  return (
    <div className="mode-picker" role="radiogroup" aria-label="Signature style">
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={selected === mode}
          className={`mode-tab${selected === mode ? " is-active" : ""}`}
          onClick={() => onSelect(mode)}
        >
          <span className="mode-tab-label">{MODE_LABELS[mode]}</span>
          <span className="mode-tab-hint">{MODE_HINTS[mode]}</span>
        </button>
      ))}
    </div>
  );
}
