"use client";

import type { Tone } from "@/lib/tone";
import {
  availableSignatureModes,
  type SignatureMode,
} from "@/lib/signatures";

const MODE_LABELS: Record<SignatureMode, string> = {
  handwritten: "Signature manuscrite",
  pattern: "Motif",
};

const MODE_HINTS: Record<SignatureMode, string> = {
  handwritten: "Dessine ta vraie signature au doigt ou à la souris.",
  pattern: "Suis le pochoir ou appose le tampon en un tap.",
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
    <div className="mode-picker" role="radiogroup" aria-label="Mode de signature">
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
