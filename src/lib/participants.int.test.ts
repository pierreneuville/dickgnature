// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createContract, getContract } from "@/lib/contracts";
import { listSignatures, SignatureError } from "@/lib/signatures";
import {
  addParticipants,
  getParticipantByToken,
  ParticipantError,
  signAsParticipant,
} from "@/lib/participants";

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

async function funContract() {
  return createContract({
    title: "Pari du match",
    body: "Le perdant paie le kebab.",
    tone: "fun",
  });
}

describe("participants (integration, real DB)", () => {
  beforeEach(async () => {
    await prisma.signature.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.contract.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("invites N participants → N unique non-guessable tokens, contract becomes 'sent'", async () => {
    const contract = await funContract();

    const created = await addParticipants(contract.id, [
      { name: "Kevin", email: "kevin@example.fr" },
      { name: "Sam", email: "sam@example.fr" },
    ]);

    expect(created).toHaveLength(2);
    const tokens = new Set(created.map((p) => p.token));
    expect(tokens.size).toBe(2);
    for (const p of created) {
      expect(p.token.length).toBeGreaterThanOrEqual(22);
      expect(p.signedAt).toBeNull();
    }

    const reloaded = await getContract(contract.id);
    expect(reloaded?.status).toBe("sent");
  });

  it("rejects an empty invitation and an unknown contract", async () => {
    const contract = await funContract();
    await expect(addParticipants(contract.id, [])).rejects.toBeInstanceOf(
      ParticipantError,
    );
    await expect(
      addParticipants("nope", [{ name: "K", email: "k@e.fr" }]),
    ).rejects.toBeInstanceOf(ParticipantError);
  });

  it("rejects a duplicate email on the same contract", async () => {
    const contract = await funContract();
    await addParticipants(contract.id, [
      { name: "Kevin", email: "dup@example.fr" },
    ]);
    await expect(
      addParticipants(contract.id, [
        { name: "Kevin2", email: "dup@example.fr" },
      ]),
    ).rejects.toBeInstanceOf(ParticipantError);
  });

  it("resolves a signing link by token WITHOUT any account, null for unknown", async () => {
    const contract = await funContract();
    const [participant] = await addParticipants(contract.id, [
      { name: "Kevin", email: "kevin@example.fr" },
    ]);

    const resolved = await getParticipantByToken(participant.token);
    expect(resolved?.participant.email).toBe("kevin@example.fr");
    expect(resolved?.contract.tone).toBe("fun");

    expect(await getParticipantByToken("unknown-token")).toBeNull();
  });

  it("drives the state machine sent → partially_signed → completed as signatures arrive", async () => {
    const contract = await funContract();
    const [kevin, sam] = await addParticipants(contract.id, [
      { name: "Kevin", email: "kevin@example.fr" },
      { name: "Sam", email: "sam@example.fr" },
    ]);

    await signAsParticipant(kevin.token, { mode: "handwritten", image: PNG });
    expect((await getContract(contract.id))?.status).toBe("partially_signed");
    expect(await listSignatures(contract.id)).toHaveLength(1);

    const signed = await signAsParticipant(sam.token, {
      mode: "pattern",
      image: PNG,
    });
    expect(signed.signedAt).not.toBeNull();
    expect((await getContract(contract.id))?.status).toBe("completed");
    expect(await listSignatures(contract.id)).toHaveLength(2);
  });

  it("enforces serious neutrality server-side: pattern is rejected via token, nothing persisted", async () => {
    const serious = await createContract({
      title: "Accord neutre",
      body: "Les parties conviennent de ce qui suit.",
      tone: "serious",
    });
    const [participant] = await addParticipants(serious.id, [
      { name: "Sam", email: "sam@example.fr" },
    ]);

    await expect(
      signAsParticipant(participant.token, { mode: "pattern", image: PNG }),
    ).rejects.toBeInstanceOf(SignatureError);
    expect(await listSignatures(serious.id)).toHaveLength(0);
    expect((await getContract(serious.id))?.status).toBe("sent");
  });

  it("refuses a second signature on the same link (single use)", async () => {
    const contract = await funContract();
    const [kevin] = await addParticipants(contract.id, [
      { name: "Kevin", email: "kevin@example.fr" },
    ]);

    await signAsParticipant(kevin.token, { mode: "handwritten", image: PNG });
    await expect(
      signAsParticipant(kevin.token, { mode: "handwritten", image: PNG }),
    ).rejects.toBeInstanceOf(ParticipantError);
    expect(await listSignatures(contract.id)).toHaveLength(1);
  });

  it("refuses an expired link and an unknown token", async () => {
    const contract = await funContract();
    const [kevin] = await addParticipants(contract.id, [
      { name: "Kevin", email: "kevin@example.fr" },
    ]);
    await prisma.participant.update({
      where: { id: kevin.id },
      data: { expiresAt: new Date("2000-01-01T00:00:00Z") },
    });

    await expect(
      signAsParticipant(kevin.token, { mode: "handwritten", image: PNG }),
    ).rejects.toBeInstanceOf(ParticipantError);
    await expect(
      signAsParticipant("ghost-token", { mode: "handwritten", image: PNG }),
    ).rejects.toBeInstanceOf(ParticipantError);
  });
});
