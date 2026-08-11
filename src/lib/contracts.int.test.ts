// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createContract, getContract } from "@/lib/contracts";

// Test d'intégration : traverse la couche domaine jusqu'à SQLite via Prisma.
// Couvre les critères S1 : création + récupération + persistance du ton + défaut "fun".
describe("contracts (integration, real DB)", () => {
  beforeEach(async () => {
    await prisma.contract.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("persists a contract and reads it back", async () => {
    const created = await createContract({
      title: "Prêt de la perceuse",
      body: "Kevin rend la perceuse avant dimanche.",
      tone: "serious",
    });

    const fetched = await getContract(created.id);

    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.title).toBe("Prêt de la perceuse");
    expect(fetched?.body).toBe("Kevin rend la perceuse avant dimanche.");
    expect(fetched?.tone).toBe("serious");
  });

  it("defaults tone to fun when omitted", async () => {
    const created = await createContract({
      title: "Pari du match",
      body: "Le perdant paie le kebab.",
    });

    expect(created.tone).toBe("fun");
    const fetched = await getContract(created.id);
    expect(fetched?.tone).toBe("fun");
  });

  it("returns null for an unknown id", async () => {
    expect(await getContract("does-not-exist")).toBeNull();
  });

  it("rejects an empty body", async () => {
    await expect(
      createContract({ title: "Vide", body: "   " }),
    ).rejects.toThrow();
  });
});
