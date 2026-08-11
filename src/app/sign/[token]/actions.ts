"use server";

import { redirect } from "next/navigation";
import { ParticipantError, signAsParticipant } from "@/lib/participants";
import { isSignatureMode, SignatureError } from "@/lib/signatures";

export type SignState = { error?: string };

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

  try {
    await signAsParticipant(token, { mode, image });
  } catch (error) {
    if (error instanceof ParticipantError || error instanceof SignatureError) {
      return { error: error.message };
    }
    return { error: "Signature invalide. Réessaie." };
  }

  redirect(`/sign/${token}`);
}
