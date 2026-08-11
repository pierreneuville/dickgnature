import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sha256FrozenDocument } from "@/lib/document-proof";
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
  openedAt: Date | null;
  consentedAt: Date | null;
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
  openedAt: Date | null;
  consentedAt: Date | null;
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
  if (contract.status === "partially_signed" || contract.status === "completed") {
    throw new ParticipantError(
      "Les participants sont figés dès la première signature.",
    );
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
        await tx.auditEvent.create({
          data: {
            contractId,
            participantId: row.id,
            type: "INVITATION_SENT",
            email: row.email,
            occurredAt: row.createdAt,
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

// La première ouverture du lien est horodatée une seule fois et journalisée. Les rechargements ne
// réécrivent pas la preuve. La fonction renvoie false pour un token inconnu.
export async function recordParticipantOpened(
  token: string,
  now: Date = new Date(),
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const participant = await tx.participant.findUnique({ where: { token } });
    if (!participant) {
      return false;
    }
    if (participant.openedAt !== null) {
      return true;
    }

    await tx.participant.update({
      where: { id: participant.id },
      data: { openedAt: now },
    });
    await tx.auditEvent.create({
      data: {
        contractId: participant.contractId,
        participantId: participant.id,
        type: "DOCUMENT_OPENED",
        email: participant.email,
        occurredAt: now,
      },
    });
    return true;
  });
}

export type SignAsParticipantInput = {
  mode: SignatureMode;
  image: string;
  consent: boolean;
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
  if (input.consent !== true) {
    throw new ParticipantError(
      "Tu dois consentir explicitement à signer ce document.",
    );
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
        signedAt,
      },
    });
    const row = await tx.participant.update({
      where: { id: participant.id },
      data: {
        openedAt: participant.openedAt ?? signedAt,
        consentedAt: signedAt,
        signedAt,
      },
    });
    if (participant.openedAt === null) {
      await tx.auditEvent.create({
        data: {
          contractId: contract.id,
          participantId: participant.id,
          type: "DOCUMENT_OPENED",
          email: participant.email,
          occurredAt: signedAt,
        },
      });
    }
    await tx.auditEvent.createMany({
      data: [
        {
          contractId: contract.id,
          participantId: participant.id,
          type: "CONSENT_RECORDED",
          email: participant.email,
          occurredAt: signedAt,
        },
        {
          contractId: contract.id,
          participantId: participant.id,
          type: "DOCUMENT_SIGNED",
          email: participant.email,
          occurredAt: signedAt,
        },
      ],
    });

    const all = await tx.participant.findMany({
      where: { contractId: contract.id },
      include: { signatures: { orderBy: { signedAt: "desc" }, take: 1 } },
    });
    const nextStatus = deriveContractStatus(all);
    let completion:
      | { status: "completed"; completedAt: Date; documentHash: string }
      | { status: typeof nextStatus } = { status: nextStatus };

    if (nextStatus === "completed") {
      const storedContract = await tx.contract.findUniqueOrThrow({
        where: { id: contract.id },
      });
      const frozenParticipants = all.map((item) => {
        const signature = item.signatures[0];
        if (
          !item.openedAt ||
          !item.consentedAt ||
          !item.signedAt ||
          !signature
        ) {
          throw new ParticipantError("Piste de preuve incomplète.");
        }
        return {
          id: item.id,
          name: item.name,
          email: item.email,
          invitedAt: item.createdAt,
          openedAt: item.openedAt,
          consentedAt: item.consentedAt,
          signedAt: item.signedAt,
          signature: {
            mode: signature.mode,
            image: signature.image,
            signedAt: signature.signedAt,
          },
        };
      });
      const documentHash = sha256FrozenDocument({
        id: storedContract.id,
        title: storedContract.title,
        body: storedContract.body,
        tone: storedContract.tone,
        createdAt: storedContract.createdAt,
        completedAt: signedAt,
        participants: frozenParticipants,
      });
      completion = { status: "completed", completedAt: signedAt, documentHash };
    }
    await tx.contract.update({
      where: { id: contract.id },
      data: completion,
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
