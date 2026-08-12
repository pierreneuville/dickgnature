"use client";

import { useActionState, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import type { Tone } from "@/lib/tone";
import type { SignActionState, SignatureMode } from "@/lib/signatures";
import { ModePicker } from "./mode-picker";
import { SignatureCanvas } from "./signature-canvas";

const initialState: SignActionState = {};

// Orchestration client (état du mode + image capturée). Glue navigateur : exclue du coverage.
// L'action serveur est déjà liée (contractId ou token) et passée en prop — même formulaire pour
// l'auto-signature (S2) et le flux tokenisé sans compte (S3). Les invariants métier (mode autorisé,
// image valide) sont revérifiés côté serveur dans les deux cas.
export function SignForm({
  tone,
  action,
  submitLabel,
}: {
  tone: Tone;
  action: (
    state: SignActionState,
    formData: FormData,
  ) => Promise<SignActionState>;
  submitLabel?: string;
}) {
  const t = useTranslations("sign");
  const [mode, setMode] = useState<SignatureMode>("handwritten");
  const [image, setImage] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

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

      <label className="consent-field">
        <input
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          required
        />
        <span>{t("consent")}</span>
      </label>

      {state.error ? <p className="error">{state.error}</p> : null}

      <button type="submit" disabled={pending || image === null || !consent}>
        {pending ? t("savePending") : (submitLabel ?? t("submit"))}
      </button>
    </form>
  );
}
