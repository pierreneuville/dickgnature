import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  type ContractStatus,
  normalizeContractStatus,
} from "@/lib/contract-status";
import { normalizeLocale } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";
import { DEFAULT_TONE, TONES, type Tone } from "@/lib/tone";

// Frontière de validation (entrée utilisateur). Le ton par défaut est "fun" (décision Gate 1).
// `locale` (langue du contrat) est capturée depuis la locale active à la création ; toute valeur
// hors en|fr|pt|es retombe sur "en" via normalizeLocale (voir src/i18n/messages.ts).
export const createContractSchema = z.object({
  title: z.string().trim().min(1, "A title is required.").max(200),
  body: z.string().trim().min(1, "Agreement text is required.").max(20000),
  tone: z.enum(TONES).default(DEFAULT_TONE),
  locale: z.string().optional(),
});

export type CreateContractInput = z.input<typeof createContractSchema>;

export type Contract = {
  id: string;
  title: string;
  body: string;
  tone: Tone;
  locale: Locale;
  status: ContractStatus;
  documentHash: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// Le ton est stocké en String (contrainte SQLite) ; on renormalise à la lecture pour garantir
// le type de domaine. Toute valeur inattendue retombe sur le défaut.
function normalizeTone(raw: string): Tone {
  return (TONES as readonly string[]).includes(raw) ? (raw as Tone) : DEFAULT_TONE;
}

function toDomain(row: {
  id: string;
  title: string;
  body: string;
  tone: string;
  locale: string;
  status: string;
  documentHash: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Contract {
  return {
    ...row,
    tone: normalizeTone(row.tone),
    locale: normalizeLocale(row.locale),
    status: normalizeContractStatus(row.status),
  };
}

export async function createContract(input: CreateContractInput): Promise<Contract> {
  const { locale, ...data } = createContractSchema.parse(input);
  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.contract.create({
      data: { ...data, locale: normalizeLocale(locale) },
    });
    await tx.auditEvent.create({
      data: {
        contractId: created.id,
        type: "CONTRACT_CREATED",
        occurredAt: created.createdAt,
      },
    });
    return created;
  });
  return toDomain(row);
}

export async function getContract(id: string): Promise<Contract | null> {
  const row = await prisma.contract.findUnique({ where: { id } });
  return row ? toDomain(row) : null;
}
