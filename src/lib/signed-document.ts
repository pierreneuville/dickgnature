import { prisma } from "@/lib/db";
import { normalizeLocale } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";
import { DEFAULT_TONE, isTone, type Tone } from "@/lib/tone";

export type ProofSignature = {
  mode: string;
  image: string;
  signedAt: Date;
};

export type ProofParticipant = {
  id: string;
  name: string;
  email: string;
  invitedAt: Date;
  openedAt: Date | null;
  consentedAt: Date | null;
  signedAt: Date | null;
  signature: ProofSignature | null;
};

export type ProofAuditEvent = {
  id: string;
  type: string;
  email: string | null;
  occurredAt: Date;
};

export type ContractProof = {
  id: string;
  title: string;
  body: string;
  tone: Tone;
  locale: Locale;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  documentHash: string | null;
  participants: ProofParticipant[];
  auditEvents: ProofAuditEvent[];
};

export async function getContractProof(
  contractId: string,
): Promise<ContractProof | null> {
  const row = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      participants: {
        orderBy: { createdAt: "asc" },
        include: {
          signatures: { orderBy: { signedAt: "desc" }, take: 1 },
        },
      },
      auditEvents: { orderBy: [{ occurredAt: "asc" }, { id: "asc" }] },
    },
  });
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    tone: isTone(row.tone) ? row.tone : DEFAULT_TONE,
    locale: normalizeLocale(row.locale),
    status: row.status,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    documentHash: row.documentHash,
    participants: row.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      email: participant.email,
      invitedAt: participant.createdAt,
      openedAt: participant.openedAt,
      consentedAt: participant.consentedAt,
      signedAt: participant.signedAt,
      signature: participant.signatures[0]
        ? {
            mode: participant.signatures[0].mode,
            image: participant.signatures[0].image,
            signedAt: participant.signatures[0].signedAt,
          }
        : null,
    })),
    auditEvents: row.auditEvents,
  };
}

export function isCompletedProof(
  proof: ContractProof,
): proof is ContractProof & {
  completedAt: Date;
  documentHash: string;
} {
  return (
    proof.status === "completed" &&
    proof.completedAt !== null &&
    proof.documentHash !== null &&
    proof.participants.length > 0 &&
    proof.participants.every(
      (participant) =>
        participant.openedAt !== null &&
        participant.consentedAt !== null &&
        participant.signedAt !== null &&
        participant.signature !== null,
    )
  );
}
