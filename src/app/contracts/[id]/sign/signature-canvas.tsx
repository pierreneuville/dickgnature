"use client";

import { useEffect, useRef } from "react";
import SignaturePad from "signature_pad";
import type { SignatureMode } from "@/lib/signatures";

// Tracé du motif « tampon » : une signature-gag préfabriquée, apposée en un tap. Coordonnées
// normalisées (0..1) redimensionnées à la taille du canvas. Fun-only par construction (le bouton
// n'existe qu'en mode "pattern", lui-même réservé au ton "fun" côté domaine).
const STAMP_PATH: ReadonlyArray<readonly [number, number]> = [
  [0.30, 0.62],
  [0.34, 0.42],
  [0.40, 0.34],
  [0.47, 0.36],
  [0.50, 0.46],
  [0.50, 0.60],
  [0.52, 0.60],
  [0.52, 0.46],
  [0.55, 0.36],
  [0.62, 0.34],
  [0.68, 0.42],
  [0.72, 0.62],
];

// Glue navigateur (canvas HTML5 via signature_pad). Non couvrable en jsdom (pas de contexte 2D) :
// exclue du coverage, comme la glue de routing. La logique testable vit dans src/lib/signatures.ts
// et dans mode-picker/signatures-list.
export function SignatureCanvas({
  mode,
  onChange,
}: {
  mode: SignatureMode;
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pad = new SignaturePad(canvas, {
      penColor: "#111827",
      minWidth: 1.2,
      maxWidth: 3,
    });
    padRef.current = pad;

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const { width } = canvas.getBoundingClientRect();
      canvas.width = width * ratio;
      canvas.height = 200 * ratio;
      const ctx = canvas.getContext("2d");
      ctx?.scale(ratio, ratio);
      pad.clear();
      onChange(null);
    };

    resize();
    window.addEventListener("resize", resize);

    const emit = () =>
      onChange(pad.isEmpty() ? null : pad.toDataURL("image/png"));
    pad.addEventListener("endStroke", emit);

    return () => {
      window.removeEventListener("resize", resize);
      pad.removeEventListener("endStroke", emit);
      pad.off();
      padRef.current = null;
    };
  }, [onChange]);

  const clear = () => {
    padRef.current?.clear();
    onChange(null);
  };

  const undo = () => {
    const pad = padRef.current;
    if (!pad) return;
    const data = pad.toData();
    data.pop();
    pad.fromData(data);
    onChange(pad.isEmpty() ? null : pad.toDataURL("image/png"));
  };

  const stamp = () => {
    const pad = padRef.current;
    const canvas = canvasRef.current;
    if (!pad || !canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const w = canvas.width / ratio;
    const h = canvas.height / ratio;
    const points = STAMP_PATH.map(([x, y]) => ({
      x: x * w,
      y: y * h,
      time: Date.now(),
      pressure: 0,
    }));
    pad.fromData([
      ...pad.toData(),
      {
        penColor: "#e11d8f",
        dotSize: 0,
        minWidth: 1.5,
        maxWidth: 3.5,
        velocityFilterWeight: 0.7,
        compositeOperation: "source-over",
        points,
      },
    ]);
    onChange(pad.toDataURL("image/png"));
  };

  return (
    <div className="signature-canvas">
      <div className={`canvas-frame${mode === "pattern" ? " has-stencil" : ""}`}>
        {mode === "pattern" ? (
          <svg
            className="stencil"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polyline
              points={STAMP_PATH.map(([x, y]) => `${x * 100},${y * 100}`).join(
                " ",
              )}
              fill="none"
              stroke="#e11d8f"
              strokeWidth="2"
              strokeDasharray="3 3"
              opacity="0.35"
            />
          </svg>
        ) : null}
        <canvas
          ref={canvasRef}
          className="canvas-surface"
          aria-label="Zone de signature"
        />
      </div>

      <div className="canvas-actions">
        <button type="button" className="ghost" onClick={undo}>
          Annuler le dernier trait
        </button>
        <button type="button" className="ghost" onClick={clear}>
          Effacer
        </button>
        {mode === "pattern" ? (
          <button type="button" className="ghost" onClick={stamp}>
            Tampon
          </button>
        ) : null}
      </div>
    </div>
  );
}
