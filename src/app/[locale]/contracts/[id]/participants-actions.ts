"use server";

import { redirect } from "next/navigation";
import { actionErrorCode } from "@/lib/action-error";
import type { ErrorMessageKey } from "@/lib/error-codes";
import type { EmailTransport } from "@/lib/email-transport";
import { addParticipants } from "@/lib/participants";
import { resendInvitation, sendInvitationEmails } from "@/lib/invitation-email";

// L'action renvoie un **code** d'erreur stable (= clé i18n `errors`) ; le formulaire client le
// localise via useTranslations. Le domaine reste hors contexte de requête.
export type ParticipantsState = { error?: ErrorMessageKey };

// contractId est lié côté serveur via .bind(null, id). Le formulaire envoie des champs répétés
// name[]/email[] (une paire par ligne). On zippe, on ignore les lignes entièrement vides, puis on
// délègue la validation (email, non-vide) et la génération de tokens au domaine. Succès → on envoie
// l'email d'invitation à chaque participant PUIS on redirige vers la page contrat.
//
// L'email est le SEUL canal de distribution du lien tokenisé : un échec d'envoi n'annule PAS la
// création en base (participant + token restent créés), mais est remonté au créateur via une notice
// (`?notice=invite-email-failed`) pour qu'il puisse réessayer avec « Renvoyer l'invitation ».
export async function addParticipantsAction(
  contractId: string,
  _prevState: ParticipantsState,
  formData: FormData,
  // Injection de transport réservée aux tests (comme SignAsParticipantOptions.emailTransport) :
  // en production, sendInvitationEmails choisit le transport Resend/Log par défaut.
  transport?: EmailTransport,
): Promise<ParticipantsState> {
  const names = formData.getAll("name").map(String);
  const emails = formData.getAll("email").map(String);

  const inputs = names
    .map((name, index) => ({
      name: name.trim(),
      email: (emails[index] ?? "").trim(),
    }))
    .filter((row) => row.name.length > 0 || row.email.length > 0);

  let created;
  try {
    created = await addParticipants(contractId, inputs);
  } catch (error) {
    return {
      error: actionErrorCode(error, {
        fallback: "addSignerFailed",
        onInvalidInput: "invalidSigner",
      }),
    };
  }

  // Envoi hors transaction : les participants sont déjà commités. Toute erreur inattendue est
  // traitée comme un échec d'envoi (notice) plutôt que de perdre la création.
  let anyEmailFailed = false;
  try {
    const result = await sendInvitationEmails(contractId, created, transport);
    anyEmailFailed = result.failed.length > 0;
  } catch {
    anyEmailFailed = true;
  }

  const query = anyEmailFailed ? "?notice=invite-email-failed" : "";
  redirect(`/contracts/${contractId}${query}`);
}

// Renvoi manuel d'une invitation depuis la page de suivi créateur. Lié à (contractId, participantId)
// via .bind. Redirige avec une notice de succès ou d'échec, sans jamais toucher l'état en base.
export async function resendInvitationAction(
  contractId: string,
  participantId: string,
  // Le <form> transmet son FormData en 3e argument positionnel après le bind (contractId,
  // participantId) ; le renvoi n'en a pas besoin. `transport` reste en dernier, injecté par les tests.
  _formData?: FormData,
  transport?: EmailTransport,
): Promise<void> {
  let notice = "invite-resent";
  try {
    const result = await resendInvitation(contractId, participantId, transport);
    if (result.status !== "sent") {
      notice = "invite-resend-failed";
    }
  } catch {
    notice = "invite-resend-failed";
  }

  redirect(`/contracts/${contractId}?notice=${notice}`);
}
