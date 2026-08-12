import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  type DomainErrorCode,
  domainErrorMessage,
  type ErrorMessageKey,
} from "@/lib/error-codes";
import { DEFAULT_TONE, isTone, type Tone } from "@/lib/tone";

// Modes de signature (S2).
// - "handwritten" : vraie signature manuscrite, disponible QUEL QUE SOIT le ton (défaut serious).
// - "pattern"     : motif parodique guidé (stencil + tampon), réservé au ton "fun".
// La contrainte "pattern → fun uniquement" est une règle de domaine appliquée ici, jamais
// déléguée au client (le mode serious ne doit jamais se voir imposer l'humour — cf. spec).
export const SIGNATURE_MODES = ["handwritten", "pattern"] as const;

export type SignatureMode = (typeof SIGNATURE_MODES)[number];

export function isSignatureMode(value: unknown): value is SignatureMode {
  return (
    typeof value === "string" &&
    (SIGNATURE_MODES as readonly string[]).includes(value)
  );
}

// Le manuscrit est toujours offert ; le motif parodique n'apparaît qu'en "fun".
export function availableSignatureModes(tone: Tone): SignatureMode[] {
  return tone === "fun" ? ["handwritten", "pattern"] : ["handwritten"];
}

export function isModeAllowedForTone(tone: Tone, mode: SignatureMode): boolean {
  return availableSignatureModes(tone).includes(mode);
}

// Image de signature : PNG en dataURL. Borne haute pour éviter d'ingérer une image démesurée.
const PNG_DATA_URL = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;
const MAX_IMAGE_CHARS = 3_000_000;

export const signatureImageSchema = z
  .string()
  .max(MAX_IMAGE_CHARS, "That signature image is too large.")
  .regex(PNG_DATA_URL, "That signature image is invalid (PNG expected).");

export type Signature = {
  id: string;
  contractId: string;
  mode: SignatureMode;
  image: string;
  signedAt: Date;
};

// État partagé des server actions de signature (auto-signature S2 et flux tokenisé S3).
// Structurellement compatible avec les SignState concrets de chaque action.
export type SignActionState = { error?: ErrorMessageKey };

function normalizeMode(raw: string): SignatureMode {
  return isSignatureMode(raw) ? raw : "handwritten";
}

function toneOf(raw: string): Tone {
  return isTone(raw) ? raw : DEFAULT_TONE;
}

function toDomain(row: {
  id: string;
  contractId: string;
  mode: string;
  image: string;
  signedAt: Date;
}): Signature {
  return { ...row, mode: normalizeMode(row.mode) };
}

export type CreateSignatureInput = {
  contractId: string;
  mode: SignatureMode;
  image: string;
};

// Porte un code d'erreur de domaine stable (= clé i18n `errors`). `params` sert au diagnostic
// (ex. le mode refusé) ; il n'est pas requis par les messages traduits.
export class SignatureError extends Error {
  readonly code: DomainErrorCode;
  readonly params?: Readonly<Record<string, string>>;

  constructor(code: DomainErrorCode, params?: Readonly<Record<string, string>>) {
    super(domainErrorMessage(code));
    this.name = "SignatureError";
    this.code = code;
    this.params = params;
  }
}

// Persiste une signature après avoir vérifié (a) l'existence du contrat, (b) que le mode est
// autorisé pour le ton du contrat, (c) la validité de l'image. Toute violation lève SignatureError.
export async function createSignature(
  input: CreateSignatureInput,
): Promise<Signature> {
  const contract = await prisma.contract.findUnique({
    where: { id: input.contractId },
  });
  if (!contract) {
    throw new SignatureError("contractNotFound");
  }

  const tone = toneOf(contract.tone);
  if (!isModeAllowedForTone(tone, input.mode)) {
    throw new SignatureError("modeNotAllowed", { mode: input.mode });
  }

  const image = signatureImageSchema.parse(input.image);

  const row = await prisma.signature.create({
    data: { contractId: input.contractId, mode: input.mode, image },
  });
  return toDomain(row);
}

export async function listSignatures(contractId: string): Promise<Signature[]> {
  const rows = await prisma.signature.findMany({
    where: { contractId },
    orderBy: { signedAt: "asc" },
  });
  return rows.map(toDomain);
}
