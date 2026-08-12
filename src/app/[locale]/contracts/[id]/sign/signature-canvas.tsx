"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import type { SignatureMode } from "@/lib/signatures";
import type { Tone } from "@/lib/tone";
import {
  stampsForTone,
  stampToPointGroups,
  type SignatureStamp,
} from "@/lib/signature-stamps";
import { StampGallery } from "./stamp-gallery";

// Glue navigateur (canvas HTML5 via signature_pad). Non couvrable en jsdom (pas de contexte 2D) :
// exclue du coverage, comme la glue de routing. La logique testable vit dans src/lib/signatures.ts,
// src/lib/signature-stamps.ts et dans mode-picker/stamp-gallery/signatures-list.
export function SignatureCanvas({
  mode,
  tone,
  onChange,
}: {
  mode: SignatureMode;
  tone: Tone;
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null);

  // Fun-only : vide en ton "serious", d'où une galerie qui ne se rend jamais hors "fun".
  const stamps = stampsForTone(tone);

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
      setSelectedStamp(null);
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
    setSelectedStamp(null);
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

  // Apposer un motif de la galerie : on repart d'un canvas propre puis on injecte les tracés du
  // motif (redimensionnés à la taille CSS du canvas), exactement comme signature_pad enregistre un
  // tracé manuel. L'export PNG est donc identique à toute autre signature → aucune régression preuve.
  const pickStamp = (stamp: SignatureStamp) => {
    const pad = padRef.current;
    const canvas = canvasRef.current;
    if (!pad || !canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const w = canvas.width / ratio;
    const h = canvas.height / ratio;
    pad.clear();
    pad.fromData(stampToPointGroups(stamp, w, h));
    setSelectedStamp(stamp.id);
    onChange(pad.toDataURL("image/png"));
  };

  return (
    <div className="signature-canvas">
      <div className="canvas-frame">
        <canvas
          ref={canvasRef}
          className="canvas-surface"
          aria-label="Signature area"
        />
      </div>

      <div className="canvas-actions">
        <button type="button" className="ghost" onClick={undo}>
          Undo last stroke
        </button>
        <button type="button" className="ghost" onClick={clear}>
          Clear the lot
        </button>
      </div>

      {mode === "pattern" ? (
        <StampGallery
          stamps={stamps}
          selected={selectedStamp}
          onPick={pickStamp}
        />
      ) : null}
    </div>
  );
}
