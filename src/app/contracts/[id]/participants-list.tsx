import Link from "next/link";
import {
  type ContractStatus,
  CONTRACT_STATUS_LABELS,
} from "@/lib/contract-status";
import type { LinkState } from "@/lib/participants";

const LINK_STATE_LABELS: Record<LinkState, string> = {
  open: "En attente",
  signed: "Signé",
  expired: "Expiré",
};

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
}: {
  participants: ParticipantRow[];
  status: ContractStatus;
}) {
  return (
    <div className="participants">
      <p className="contract-status">
        Statut : <strong>{CONTRACT_STATUS_LABELS[status]}</strong>
      </p>

      {participants.length === 0 ? (
        <p className="participants-empty">
          Aucun participant. Ajoute des signataires ci-dessous.
        </p>
      ) : (
        <ul className="participants-list">
          {participants.map((participant) => (
            <li key={participant.id} className="participant-item">
              <span className="participant-name">{participant.name}</span>
              <span className="participant-email">{participant.email}</span>
              <span
                className={`participant-state is-${participant.linkState}`}
              >
                {LINK_STATE_LABELS[participant.linkState]}
              </span>
              {participant.linkState === "open" ? (
                <Link
                  className="participant-link"
                  href={`/sign/${participant.token}`}
                >
                  Lien de signature
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
