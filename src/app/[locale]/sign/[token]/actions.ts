"use server";

import { redirect } from "next/navigation";
import { actionErrorCode } from "@/lib/action-error";
import type { ErrorMessageKey } from "@/lib/error-codes";
import { signAsParticipant } from "@/lib/participants";
import { isSignatureMode } from "@/lib/signatures";

export type SignState = { error?: ErrorMessageKey };

// token est lié côté serveur via .bind(null, token) avant d'être passé au SignForm client.
// La règle « pattern → fun uniquement » et l'usage unique/expiration du lien sont appliqués dans
// signAsParticipant ; ici on ne fait que router l'erreur vers l'UI. En cas de succès, on redirige
// vers la même page : le lien devient « déjà signé » (usage unique visible).
export async function signViaTokenAction(
  token: string,
  _prevState: SignState,
  formData: FormData,
): Promise<SignState> {
  const rawMode = formData.get("mode");
  const mode = isSignatureMode(rawMode) ? rawMode : "handwritten";
  const image = String(formData.get("image") ?? "");
  const consent = formData.get("consent") === "on";

  try {
    await signAsParticipant(token, { mode, image, consent });
  } catch (error) {
    return { error: actionErrorCode(error, { fallback: "signFailed" }) };
  }

  redirect(`/sign/${token}`);
}
