// Machine à états d'un contrat (S3). Le statut est entièrement DÉRIVÉ de l'état de signature des
// participants — pas d'action « envoyer » manuelle séparée : inviter un participant fait passer le
// contrat de "draft" à "sent", et l'arrivée des signatures le fait progresser jusqu'à "completed".
//
//   draft            : aucun participant invité.
//   sent             : au moins un participant invité, aucun n'a signé.
//   partially_signed : au moins un participant a signé, mais pas tous.
//   completed        : tous les participants ont signé.
//
// Fonctions pures et testables — aucune I/O ici. La persistance vit dans src/lib/participants.ts.

export const CONTRACT_STATUSES = [
  "draft",
  "sent",
  "partially_signed",
  "completed",
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const DEFAULT_CONTRACT_STATUS: ContractStatus = "draft";

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  partially_signed: "Signé en partie",
  completed: "Complété",
};

export function isContractStatus(value: unknown): value is ContractStatus {
  return (
    typeof value === "string" &&
    (CONTRACT_STATUSES as readonly string[]).includes(value)
  );
}

// Renormalise une valeur stockée en String (contrainte SQLite) vers le type de domaine.
export function normalizeContractStatus(raw: string): ContractStatus {
  return isContractStatus(raw) ? raw : DEFAULT_CONTRACT_STATUS;
}

// Dérive le statut à partir de l'ensemble des participants et de leur état de signature.
// C'est le cœur de la machine à états : une seule source de vérité, appliquée après chaque
// mutation (invitation / signature) puis persistée sur le contrat.
export function deriveContractStatus(
  participants: ReadonlyArray<{ signedAt: Date | null }>,
): ContractStatus {
  if (participants.length === 0) {
    return "draft";
  }
  const signed = participants.filter((p) => p.signedAt !== null).length;
  if (signed === 0) {
    return "sent";
  }
  if (signed < participants.length) {
    return "partially_signed";
  }
  return "completed";
}
