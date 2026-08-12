"use client";

import { useTranslations } from "next-intl";
import type { SignatureStamp } from "@/lib/signature-stamps";

// Galerie de vignettes présentationnelle. Rendue uniquement quand `stamps` est non vide — le parent
// passe `stampsForTone(tone)`, donc la galerie disparaît intégralement en ton "serious" (fun-only).
// Chaque vignette est un radio accessible au clavier (role="radio" + aria-checked), avec un SVG
// role="img" étiqueté (labels i18n). Le tracé réutilise les mêmes polylignes normalisées que le
// tampon posé sur le canvas, donc la vignette est fidèle au rendu final.
export function StampGallery({
  stamps,
  selected,
  onPick,
}: {
  stamps: ReadonlyArray<SignatureStamp>;
  selected: string | null;
  onPick: (stamp: SignatureStamp) => void;
}) {
  const t = useTranslations("signatureStamps");
  if (stamps.length === 0) return null;

  return (
    <div
      className="stamp-gallery"
      role="radiogroup"
      aria-label={t("galleryAria")}
    >
      {stamps.map((stamp) => {
        const label = t(`labels.${stamp.id}`);
        const isSelected = stamp.id === selected;
        return (
          <button
            key={stamp.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`stamp-thumb${isSelected ? " is-selected" : ""}`}
            onClick={() => onPick(stamp)}
          >
            <svg viewBox="0 0 100 100" role="img" aria-label={label}>
              {stamp.strokes.map((stroke, i) => (
                <polyline
                  key={i}
                  points={stroke.map(([x, y]) => `${x * 100},${y * 100}`).join(" ")}
                  fill="none"
                  stroke="#e11d8f"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>
          </button>
        );
      })}
    </div>
  );
}
