"use server";

import { redirect } from "next/navigation";
import {
  createSignature,
  isSignatureMode,
  SignatureError,
} from "@/lib/signatures";

export type SignState = { error?: string };

// contractId est lié côté client via .bind(null, id). En cas de succès on redirige vers la page
// du contrat (la signature y est ré-affichée). La règle "pattern → fun uniquement" est appliquée
// dans createSignature ; ici on ne fait que router l'erreur vers l'UI.
export async function submitSignatureAction(
  contractId: string,
  _prevState: SignState,
  formData: FormData,
): Promise<SignState> {
  const rawMode = formData.get("mode");
  const mode = isSignatureMode(rawMode) ? rawMode : "handwritten";
  const image = String(formData.get("image") ?? "");
  if (formData.get("consent") !== "on") {
    return { error: "Please explicitly agree before signing this document." };
  }

  try {
    await createSignature({ contractId, mode, image });
  } catch (error) {
    if (error instanceof SignatureError) {
      return { error: error.message };
    }
    return { error: "That signature didn't stick. Give it another go." };
  }

  redirect(`/contracts/${contractId}`);
}
