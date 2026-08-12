"use server";

import { redirect } from "next/navigation";
import { actionErrorCode } from "@/lib/action-error";
import type { ErrorMessageKey } from "@/lib/error-codes";
import { addParticipants } from "@/lib/participants";

// L'action renvoie un **code** d'erreur stable (= clé i18n `errors`) ; le formulaire client le
// localise via useTranslations. Le domaine reste hors contexte de requête.
export type ParticipantsState = { error?: ErrorMessageKey };

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
    return {
      error: actionErrorCode(error, {
        fallback: "addSignerFailed",
        onInvalidInput: "invalidSigner",
      }),
    };
  }

  redirect(`/contracts/${contractId}`);
}
