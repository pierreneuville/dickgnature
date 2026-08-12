import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui";
import type { ContractStatus } from "@/lib/contract-status";
import type { LinkState } from "@/lib/participants";

// Vue « suivi créateur » : qui a signé, qui est en attente, et le lien à transmettre. Le calcul
// d'état (participantLinkState) est fait côté serveur ; ce composant reste purement présentiel
// (type-only import du domaine → aucune dépendance Prisma dans le bundle/les tests).
export type ParticipantRow = {
  id: string;
  name: string;
  email: string;
  token: string;
  linkState: LinkState;
};

export function ParticipantsList({
  participants,
  status,
  rowAction,
}: {
  participants: ParticipantRow[];
  status: ContractStatus;
  // Action optionnelle rendue par ligne (ex. bouton « renvoyer l'invitation »). Injectée par la
  // page serveur pour garder ce composant présentiel sans dépendance serveur (aucun import Prisma).
  rowAction?: (participant: ParticipantRow) => ReactNode;
}) {
  const t = useTranslations();

  return (
    <div className="participants">
      <p className="contract-status">
        {t("participants.statusLabel")}:{" "}
        <strong>{t(`contractStatus.${status}`)}</strong>
      </p>

      {participants.length === 0 ? (
        <p className="participants-empty">{t("participants.empty")}</p>
      ) : (
        <ul className="participants-list">
          {participants.map((participant) => {
            const action = rowAction?.(participant);

            return (
              <li key={participant.id} className="participant-item">
                <span className="participant-identity">
                  <strong className="participant-name">{participant.name}</strong>
                  <span className="participant-email">{participant.email}</span>
                </span>
                <span
                  className={`participant-state is-${participant.linkState}`}
                >
                  {t(`linkState.${participant.linkState}`)}
                </span>
                {participant.linkState === "open" || action ? (
                  <div className="participant-actions">
                    {participant.linkState === "open" ? (
                      <ButtonLink
                        className="participant-link"
                        href={`/sign/${participant.token}`}
                        size="sm"
                      >
                        {t("participants.openLink")}
                      </ButtonLink>
                    ) : null}
                    {action}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
