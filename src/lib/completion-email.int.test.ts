// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { sendCompletedContractEmails } from "@/lib/completion-email";
import { createContract } from "@/lib/contracts";
import { prisma } from "@/lib/db";
import { CaptureEmailTransport } from "@/lib/email-transport";
import { addParticipants, signAsParticipant } from "@/lib/participants";

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

describe("signed contract completion emails (integration)", () => {
  beforeEach(async () => {
    await prisma.signature.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.contract.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("sends exactly one neutral PDF copy to every serious participant on completion", async () => {
    const contract = await createContract({
      title: "Accord de prêt",
      body: "La perceuse sera rendue vendredi.",
      tone: "serious",
    });
    const [sam, alex] = await addParticipants(contract.id, [
      { name: "Sam", email: "sam@example.fr" },
      { name: "Alex", email: "alex@example.fr" },
    ]);
    const capture = new CaptureEmailTransport();

    await signAsParticipant(
      sam.token,
      { mode: "handwritten", image: PNG, consent: true },
      { emailTransport: capture },
    );
    expect(capture.messages).toHaveLength(0);

    await signAsParticipant(
      alex.token,
      { mode: "handwritten", image: PNG, consent: true },
      { emailTransport: capture },
    );

    expect(capture.messages).toHaveLength(2);
    expect(capture.messages.map((message) => message.to).sort()).toEqual([
      "alex@example.fr",
      "sam@example.fr",
    ]);
    for (const message of capture.messages) {
      expect(message.subject).toBe("Votre contrat signé — Accord de prêt");
      expect(`${message.from} ${message.subject} ${message.text} ${message.html}`).not.toMatch(
        /dickgnature|parodie|🎉/i,
      );
      expect(message.attachments).toHaveLength(1);
      expect(message.attachments[0]).toMatchObject({
        filename: "contrat-signe-accord-de-pret.pdf",
        contentType: "application/pdf",
      });
      expect(new TextDecoder().decode(message.attachments[0].content.slice(0, 5))).toBe(
        "%PDF-",
      );
    }
    expect(capture.messages[0].attachments[0].content).toBe(
      capture.messages[1].attachments[0].content,
    );
  });

  it("uses the branded courtesy template for a fun contract", async () => {
    const contract = await createContract({
      title: "Pari du match",
      body: "Le perdant apporte le dessert.",
      tone: "fun",
    });
    const [participant] = await addParticipants(contract.id, [
      { name: "Kevin", email: "kevin@example.fr" },
    ]);
    const capture = new CaptureEmailTransport();

    await signAsParticipant(
      participant.token,
      { mode: "pattern", image: PNG, consent: true },
      { emailTransport: capture },
    );

    expect(capture.messages).toHaveLength(1);
    expect(capture.messages[0].subject).toBe("C'est signé 🎉 — Pari du match");
    expect(capture.messages[0].from).toContain("dickgnature");
    expect(capture.messages[0].html).toContain("Garde-la bien au chaud");
    expect(capture.messages[0].attachments[0].contentType).toBe("application/pdf");
  });

  it("refuses to send before completion", async () => {
    const contract = await createContract({
      title: "Encore en cours",
      body: "Une signature manque.",
      tone: "serious",
    });
    await addParticipants(contract.id, [
      { name: "Sam", email: "sam@example.fr" },
    ]);

    await expect(
      sendCompletedContractEmails(contract.id, new CaptureEmailTransport()),
    ).rejects.toThrow(/complétion/);
  });
});
