import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  type ContractStatus,
  normalizeContractStatus,
} from "@/lib/contract-status";
import { DEFAULT_TONE, TONES, type Tone } from "@/lib/tone";

// Frontière de validation (entrée utilisateur). Le ton par défaut est "fun" (décision Gate 1).
export const createContractSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(200),
  body: z.string().trim().min(1, "Le corps du contrat est requis").max(20000),
  tone: z.enum(TONES).default(DEFAULT_TONE),
});

export type CreateContractInput = z.input<typeof createContractSchema>;

export type Contract = {
  id: string;
  title: string;
  body: string;
  tone: Tone;
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
  status: string;
  documentHash: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Contract {
  return {
    ...row,
    tone: normalizeTone(row.tone),
    status: normalizeContractStatus(row.status),
  };
}

export async function createContract(input: CreateContractInput): Promise<Contract> {
  const data = createContractSchema.parse(input);
  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.contract.create({ data });
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
