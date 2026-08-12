"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { addParticipants, ParticipantError } from "@/lib/participants";

export type ParticipantsState = { error?: string };

// contractId est lié côté serveur via .bind(null, id). Le formulaire envoie des champs répétés
// name[]/email[] (une paire par ligne). On zippe, on ignore les lignes entièrement vides, puis on
// délègue la validation (email, non-vide) et la génération de tokens au domaine. Succès → redirect
// vers la page contrat (liste + statut rafraîchis).
export async function addParticipantsAction(
  contractId: string,
  _prevState: ParticipantsState,
  formData: FormData,
): Promise<ParticipantsState> {
  const names = formData.getAll("name").map(String);
  const emails = formData.getAll("email").map(String);

  const inputs = names
    .map((name, index) => ({
      name: name.trim(),
      email: (emails[index] ?? "").trim(),
    }))
    .filter((row) => row.name.length > 0 || row.email.length > 0);

  try {
    await addParticipants(contractId, inputs);
  } catch (error) {
    if (error instanceof ParticipantError) {
      return { error: error.message };
    }
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? "That signer doesn't look valid." };
    }
    return { error: "Couldn't add that signer. Give it another go." };
  }

  redirect(`/contracts/${contractId}`);
}
