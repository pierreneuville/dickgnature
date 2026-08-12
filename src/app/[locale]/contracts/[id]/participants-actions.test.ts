// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createContract, getContract } from "@/lib/contracts";
import { listParticipants } from "@/lib/participants";
import { addParticipantsAction } from "./participants-actions";

function formDataOf(rows: Array<{ name: string; email: string }>): FormData {
  const fd = new FormData();
  for (const row of rows) {
    fd.append("name", row.name);
    fd.append("email", row.email);
  }
  return fd;
}

describe("addParticipantsAction", () => {
  beforeEach(async () => {
    await prisma.signature.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.contract.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("persists participants and redirects, moving the contract to 'sent'", async () => {
    const contract = await createContract({
      title: "T",
      body: "Corps valide.",
      tone: "fun",
    });

    await expect(
      addParticipantsAction(
        contract.id,
        {},
        formDataOf([
          { name: "Kevin", email: "kevin@example.fr" },
          { name: "Sam", email: "sam@example.fr" },
        ]),
      ),
    ).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT"),
    });

    expect(await listParticipants(contract.id)).toHaveLength(2);
    expect((await getContract(contract.id))?.status).toBe("sent");
  });

  it("ignores fully empty rows and reports when nothing remains", async () => {
    const contract = await createContract({
      title: "T",
      body: "Corps valide.",
      tone: "fun",
    });

    const result = await addParticipantsAction(
      contract.id,
      {},
      formDataOf([{ name: "", email: "" }]),
    );

    expect(result.error).toBeTruthy();
    expect(await listParticipants(contract.id)).toHaveLength(0);
  });

  it("routes a validation error for an invalid email", async () => {
    const contract = await createContract({
      title: "T",
      body: "Corps valide.",
      tone: "fun",
    });

    const result = await addParticipantsAction(
      contract.id,
      {},
      formDataOf([{ name: "Kevin", email: "not-an-email" }]),
    );

    expect(result.error).toBeTruthy();
    expect(await listParticipants(contract.id)).toHaveLength(0);
  });
});
