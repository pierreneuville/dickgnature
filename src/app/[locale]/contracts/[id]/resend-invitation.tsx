"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { resendInvitationAction } from "./participants-actions";

// Glue navigateur : petit formulaire de renvoi d'invitation par participant ouvert. L'action serveur
// (liée à contractId + participantId) revalide côté serveur puis redirige avec une notice ; ce
// composant ne porte aucun état métier. Exclu du coverage comme les autres formulaires.
export function ResendInvitation({
  contractId,
  participantId,
  name,
}: {
  contractId: string;
  participantId: string;
  name: string;
}) {
  const t = useTranslations("participants");
  const action = resendInvitationAction.bind(null, contractId, participantId);

  return (
    <form action={action} className="participant-resend">
      <Button
        type="submit"
        variant="quiet"
        size="sm"
        aria-label={t("resendAria", { name })}
      >
        {t("resend")}
      </Button>
    </form>
  );
}
