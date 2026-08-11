// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createContract } from "@/lib/contracts";
import {
  createSignature,
  listSignatures,
  SignatureError,
} from "@/lib/signatures";

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

// Test d'intégration : traverse la couche domaine jusqu'à SQLite via Prisma.
// Couvre les critères S2 : persistance, manuscrit dispo partout, motif fun-only.
describe("signatures (integration, real DB)", () => {
  beforeEach(async () => {
    await prisma.signature.deleteMany();
    await prisma.contract.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("persists a handwritten signature and reads it back — any tone", async () => {
    const contract = await createContract({
      title: "Prêt de la perceuse",
      body: "Kevin rend la perceuse avant dimanche.",
      tone: "serious",
    });

    const created = await createSignature({
      contractId: contract.id,
      mode: "handwritten",
      image: PNG,
    });

    const list = await listSignatures(contract.id);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(created.id);
    expect(list[0].mode).toBe("handwritten");
    expect(list[0].image).toBe(PNG);
  });

  it("accepts the parody pattern on a fun contract", async () => {
    const fun = await createContract({
      title: "Pari du match",
      body: "Le perdant paie le kebab.",
      tone: "fun",
    });

    await expect(
      createSignature({ contractId: fun.id, mode: "pattern", image: PNG }),
    ).resolves.toMatchObject({ mode: "pattern" });
    expect(await listSignatures(fun.id)).toHaveLength(1);
  });

  it("rejects the parody pattern on a serious contract and persists nothing", async () => {
    const serious = await createContract({
      title: "Accord neutre",
      body: "Les parties conviennent de ce qui suit.",
      tone: "serious",
    });

    await expect(
      createSignature({ contractId: serious.id, mode: "pattern", image: PNG }),
    ).rejects.toBeInstanceOf(SignatureError);
    expect(await listSignatures(serious.id)).toHaveLength(0);
  });

  it("rejects an invalid image", async () => {
    const contract = await createContract({
      title: "X",
      body: "Corps valide.",
      tone: "fun",
    });

    await expect(
      createSignature({
        contractId: contract.id,
        mode: "handwritten",
        image: "not-a-data-url",
      }),
    ).rejects.toThrow();
    expect(await listSignatures(contract.id)).toHaveLength(0);
  });

  it("rejects a signature for an unknown contract", async () => {
    await expect(
      createSignature({
        contractId: "does-not-exist",
        mode: "handwritten",
        image: PNG,
      }),
    ).rejects.toBeInstanceOf(SignatureError);
  });
});
