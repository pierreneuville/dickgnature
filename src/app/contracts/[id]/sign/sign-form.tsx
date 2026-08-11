"use client";

import { useActionState, useCallback, useState } from "react";
import type { Tone } from "@/lib/tone";
import type { SignatureMode } from "@/lib/signatures";
import { submitSignatureAction, type SignState } from "./actions";
import { ModePicker } from "./mode-picker";
import { SignatureCanvas } from "./signature-canvas";

const initialState: SignState = {};

// Orchestration client (état du mode + image capturée). Glue navigateur : exclue du coverage.
// Les invariants métier (mode autorisé, image valide) sont revérifiés côté serveur.
export function SignForm({
  contractId,
  tone,
}: {
  contractId: string;
  tone: Tone;
}) {
  const [mode, setMode] = useState<SignatureMode>("handwritten");
  const [image, setImage] = useState<string | null>(null);

  const action = submitSignatureAction.bind(null, contractId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const handleChange = useCallback((dataUrl: string | null) => {
    setImage(dataUrl);
  }, []);

  const selectMode = (next: SignatureMode) => {
    setMode(next);
    setImage(null);
  };

  return (
    <form action={formAction} className="sign-form">
      <ModePicker tone={tone} selected={mode} onSelect={selectMode} />
      <SignatureCanvas key={mode} mode={mode} onChange={handleChange} />

      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="image" value={image ?? ""} />

      {state.error ? <p className="error">{state.error}</p> : null}

      <button type="submit" disabled={pending || image === null}>
        {pending ? "Enregistrement…" : "Signer le contrat"}
      </button>
    </form>
  );
}
