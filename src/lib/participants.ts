import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { deriveContractStatus } from "@/lib/contract-status";
import {
  isModeAllowedForTone,
  signatureImageSchema,
  SignatureError,
  type SignatureMode,
} from "@/lib/signatures";
import { DEFAULT_TONE, isTone, type Tone } from "@/lib/tone";

// Durée de vie d'un lien de signature (TTL simple, cf. spec « au-delà d'un TTL simple » hors
// périmètre). 30 jours : large pour un accord entre amis, tout en bornant l'exposition du token.
export const LINK_TTL_MS = 1000 * 60 * 60 * 24 * 30;

// Token de signature : 32 octets = 256 bits d'entropie (≥ 128 requis par la spec), encodés en
// base64url → sûr en URL, non devinable, pas d'énumération possible.
const TOKEN_BYTES = 32;

export function generateSignatureToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

// Frontière de validation d'un participant (entrée créateur). Email normalisé en minuscules.
export const participantInputSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email invalide")
    .max(320),
});

export type ParticipantInput = z.input<typeof participantInputSchema>;

export type Participant = {
  id: string;
  contractId: string;
  name: string;
  email: string;
  token: string;
  expiresAt: Date;
  signedAt: Date | null;
  createdAt: Date;
};

export class ParticipantError extends Error {}

function toDomain(row: {
  id: string;
  contractId: string;
  name: string;
  email: string;
  token: string;
  expiresAt: Date;
  signedAt: Date | null;
  createdAt: Date;
}): Participant {
  return row;
}

function toneOf(raw: string): Tone {
  return isTone(raw) ? raw : DEFAULT_TONE;
}

// État d'un lien du point de vue du signataire. Pur : utilisé côté page publique pour router
// vers l'écran « déjà signé » / « lien expiré » / formulaire de signature.
export type LinkState = "open" | "signed" | "expired";

export function participantLinkState(
  participant: { signedAt: Date | null; expiresAt: Date },
  now: Date = new Date(),
): LinkState {
  if (participant.signedAt !== null) {
    return "signed";
  }
  if (participant.expiresAt.getTime() < now.getTime()) {
    return "expired";
  }
  return "open";
}

// Invite N participants sur un contrat : génère un token unique par participant et fait progresser
// le statut du contrat (draft → sent). Atomique : soit tous créés + statut à jour, soit rien.
export async function addParticipants(
  contractId: string,
  inputs: ReadonlyArray<ParticipantInput>,
): Promise<Participant[]> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!contract) {
    throw new ParticipantError("Contrat introuvable.");
  }

  const parsed = inputs.map((input) => participantInputSchema.parse(input));
  if (parsed.length === 0) {
    throw new ParticipantError("Ajoute au moins un participant.");
  }

  const expiresAt = new Date(Date.now() + LINK_TTL_MS);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const rows: Participant[] = [];
      for (const input of parsed) {
        const row = await tx.participant.create({
          data: {
            contractId,
            name: input.name,
            email: input.email,
            token: generateSignatureToken(),
            expiresAt,
          },
        });
        rows.push(toDomain(row));
      }
      const all = await tx.participant.findMany({ where: { contractId } });
      await tx.contract.update({
        where: { id: contractId },
        data: { status: deriveContractStatus(all) },
      });
      return rows;
    });
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ParticipantError(
        "Un participant avec cet email existe déjà sur ce contrat.",
      );
    }
    throw error;
  }
}

export async function listParticipants(
  contractId: string,
): Promise<Participant[]> {
  const rows = await prisma.participant.findMany({
    where: { contractId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toDomain);
}

export type ParticipantWithContract = {
  participant: Participant;
  contract: {
    id: string;
    title: string;
    body: string;
    tone: Tone;
  };
};

// Résout un lien tokenisé — SANS aucun compte. Renvoie le participant et le contrat associé, ou
// null si le token est inconnu. L'état (ouvert / signé / expiré) se calcule via participantLinkState.
export async function getParticipantByToken(
  token: string,
): Promise<ParticipantWithContract | null> {
  const row = await prisma.participant.findUnique({
    where: { token },
    include: { contract: true },
  });
  if (!row) {
    return null;
  }
  const { contract, ...participant } = row;
  return {
    participant: toDomain(participant),
    contract: {
      id: contract.id,
      title: contract.title,
      body: contract.body,
      tone: toneOf(contract.tone),
    },
  };
}

export type SignAsParticipantInput = {
  mode: SignatureMode;
  image: string;
};

// Signe au nom d'un participant via son token. Vérifie (a) le lien existe, (b) n'est pas expiré,
// (c) n'a pas déjà été utilisé (usage unique), (d) le mode est autorisé pour le ton — la neutralité
// « serious » est garantie ici, côté serveur, pas seulement dans l'UI. Puis, atomiquement : crée la
// signature, marque le participant signé et recalcule le statut du contrat.
export async function signAsParticipant(
  token: string,
  input: SignAsParticipantInput,
): Promise<Participant> {
  const resolved = await getParticipantByToken(token);
  if (!resolved) {
    throw new ParticipantError("Lien de signature invalide.");
  }

  const { participant, contract } = resolved;
  const state = participantLinkState(participant);
  if (state === "expired") {
    throw new ParticipantError("Ce lien de signature a expiré.");
  }
  if (state === "signed") {
    throw new ParticipantError("Ce lien a déjà été signé.");
  }

  if (!isModeAllowedForTone(contract.tone, input.mode)) {
    throw new SignatureError(
      `Le mode « ${input.mode} » n'est pas disponible pour ce contrat.`,
    );
  }

  const image = signatureImageSchema.parse(input.image);
  const signedAt = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    await tx.signature.create({
      data: {
        contractId: contract.id,
        participantId: participant.id,
        mode: input.mode,
        image,
      },
    });
    const row = await tx.participant.update({
      where: { id: participant.id },
      data: { signedAt },
    });
    const all = await tx.participant.findMany({
      where: { contractId: contract.id },
    });
    await tx.contract.update({
      where: { id: contract.id },
      data: { status: deriveContractStatus(all) },
    });
    return row;
  });

  return toDomain(updated);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
