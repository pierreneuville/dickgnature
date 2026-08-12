// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createContract, getContract } from "@/lib/contracts";
import { addParticipants } from "@/lib/participants";
import { listSignatures } from "@/lib/signatures";
import { signViaTokenAction } from "./actions";

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

function formDataOf(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("signViaTokenAction", () => {
  beforeEach(async () => {
    await prisma.signature.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.contract.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("signs via a valid token then redirects, driving the contract to completed", async () => {
    const contract = await createContract({
      title: "Prêt de la perceuse",
      body: "Kevin rend la perceuse avant dimanche.",
      tone: "serious",
    });
    const [kevin] = await addParticipants(contract.id, [
      { name: "Kevin", email: "kevin@example.fr" },
    ]);

    await expect(
      signViaTokenAction(
        kevin.token,
        {},
        formDataOf({ mode: "handwritten", image: PNG, consent: "on" }),
      ),
    ).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT"),
    });

    expect(await listSignatures(contract.id)).toHaveLength(1);
    expect((await getContract(contract.id))?.status).toBe("completed");
  });

  it("routes a domain error to the UI when pattern is used on a serious contract", async () => {
    const contract = await createContract({
      title: "Accord neutre",
      body: "Les parties conviennent de ce qui suit.",
      tone: "serious",
    });
    const [sam] = await addParticipants(contract.id, [
      { name: "Sam", email: "sam@example.fr" },
    ]);

    const result = await signViaTokenAction(
      sam.token,
      {},
      formDataOf({ mode: "pattern", image: PNG, consent: "on" }),
    );

    expect(result.error).toBeTruthy();
    expect(await listSignatures(contract.id)).toHaveLength(0);
  });

  it("returns an error for an unknown token", async () => {
    const result = await signViaTokenAction(
      "ghost-token",
      {},
      formDataOf({ mode: "handwritten", image: PNG, consent: "on" }),
    );
    expect(result.error).toBeTruthy();
  });
});
