import { createHash } from "node:crypto";

export type FrozenSignature = {
  mode: string;
  image: string;
  signedAt: Date;
};

export type FrozenParticipant = {
  id: string;
  name: string;
  email: string;
  invitedAt: Date;
  openedAt: Date;
  consentedAt: Date;
  signedAt: Date;
  signature: FrozenSignature;
};

export type FrozenDocument = {
  id: string;
  title: string;
  body: string;
  tone: string;
  createdAt: Date;
  completedAt: Date;
  participants: FrozenParticipant[];
};

// Représentation canonique du contenu figé. L'ordre des participants est normalisé et toutes les
// dates sont en UTC ISO-8601 : la même preuve produit toujours exactement la même empreinte.
export function canonicalizeFrozenDocument(document: FrozenDocument): string {
  const participants = [...document.participants]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((participant) => ({
      id: participant.id,
      name: participant.name,
      email: participant.email,
      invitedAt: participant.invitedAt.toISOString(),
      openedAt: participant.openedAt.toISOString(),
      consentedAt: participant.consentedAt.toISOString(),
      signedAt: participant.signedAt.toISOString(),
      signature: {
        mode: participant.signature.mode,
        image: participant.signature.image,
        signedAt: participant.signature.signedAt.toISOString(),
      },
    }));

  return JSON.stringify({
    version: 1,
    contract: {
      id: document.id,
      title: document.title,
      body: document.body,
      tone: document.tone,
      createdAt: document.createdAt.toISOString(),
      completedAt: document.completedAt.toISOString(),
    },
    participants,
  });
}

export function sha256FrozenDocument(document: FrozenDocument): string {
  return createHash("sha256")
    .update(canonicalizeFrozenDocument(document), "utf8")
    .digest("hex");
}
