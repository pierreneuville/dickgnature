// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createContract } from "@/lib/contracts";
import { addParticipants, signAsParticipant } from "@/lib/participants";
import {
  CaptureEmailTransport,
  EmailTransportError,
  type EmailTransport,
} from "@/lib/email-transport";
import { resendInvitation, sendInvitationEmails } from "@/lib/invitation-email";

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

describe("invitation-email (integration, real DB)", () => {
  beforeEach(async () => {
    await prisma.signature.deleteMany();
    await prisma.auditEvent.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.contract.deleteMany();
  });

  const invitationsSent = (contractId: string) =>
    prisma.auditEvent.findMany({
      where: { contractId, type: "INVITATION_SENT" },
      orderBy: { occurredAt: "asc" },
    });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("sends one tokenized invitation per participant, in the contract locale + tone", async () => {
    const contract = await createContract({
      title: "Pari du match",
      body: "Le perdant paie le kebab.",
      tone: "fun",
      locale: "fr",
    });
    const created = await addParticipants(contract.id, [
      { name: "Kevin", email: "kevin@example.fr" },
      { name: "Sam", email: "sam@example.fr" },
    ]);

    const capture = new CaptureEmailTransport();
    const result = await sendInvitationEmails(contract.id, created, capture);

    expect(result.sent).toBe(2);
    expect(result.failed).toHaveLength(0);
    expect(capture.messages).toHaveLength(2);

    const kevinToken = created.find((p) => p.email === "kevin@example.fr")?.token;
    const toKevin = capture.messages.find((m) => m.to === "kevin@example.fr");
    expect(toKevin?.text).toContain(`/fr/sign/${kevinToken}`);
    expect(toKevin?.subject).toMatch(/signer/i);
    expect(toKevin?.attachments).toHaveLength(0);

    // Piste probante : un `INVITATION_SENT` par envoi réussi, rattaché au bon participant, jamais
    // à la création (createContract/addParticipants n'en écrivent aucun).
    const events = await invitationsSent(contract.id);
    expect(events).toHaveLength(2);
    expect(new Set(events.map((e) => e.participantId))).toEqual(
      new Set(created.map((p) => p.id)),
    );
    expect(events.map((e) => e.email).sort()).toEqual([
      "kevin@example.fr",
      "sam@example.fr",
    ]);
  });

  it("collects failed recipients without blocking the rest, and logs each failure", async () => {
    const contract = await createContract({
      title: "Accord neutre",
      body: "Les parties conviennent de ce qui suit.",
      tone: "serious",
    });
    const created = await addParticipants(contract.id, [
      { name: "Kevin", email: "kevin@example.fr" },
    ]);

    const failing: EmailTransport = {
      send: async () => {
        throw new EmailTransportError("Resend rejected the email (403)");
      },
    };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendInvitationEmails(contract.id, created, failing);

    expect(result.sent).toBe(0);
    expect(result.failed).toEqual(["kevin@example.fr"]);
    expect(consoleError).toHaveBeenCalledOnce();
    expect(consoleError.mock.calls[0]?.[0]).toContain(contract.id);
    consoleError.mockRestore();

    // Un envoi rejeté ne doit JAMAIS produire d'événement « invitation envoyée ».
    expect(await invitationsSent(contract.id)).toHaveLength(0);
  });

  it("resends only for a participant of the contract whose link is still open", async () => {
    const contract = await createContract({
      title: "Pari du match",
      body: "Le perdant paie le kebab.",
      tone: "fun",
    });
    const [kevin] = await addParticipants(contract.id, [
      { name: "Kevin", email: "kevin@example.fr" },
    ]);
    const capture = new CaptureEmailTransport();

    // Token inconnu et participant d'un autre contrat → notFound (pas d'envoi).
    expect(await resendInvitation(contract.id, "missing", capture)).toEqual({
      status: "notFound",
    });
    expect(await resendInvitation("other-contract", kevin.id, capture)).toEqual({
      status: "notFound",
    });
    expect(capture.messages).toHaveLength(0);

    // Lien ouvert → renvoi effectif, qui ajoute un nouvel événement d'audit à l'instant du renvoi.
    expect(await resendInvitation(contract.id, kevin.id, capture)).toEqual({
      status: "sent",
    });
    expect(capture.messages).toHaveLength(1);
    expect(capture.messages[0]?.to).toBe("kevin@example.fr");
    const afterResend = await invitationsSent(contract.id);
    expect(afterResend).toHaveLength(1);
    expect(afterResend[0]?.participantId).toBe(kevin.id);

    // Après signature, le lien n'est plus ouvert → refus explicite, aucun email ni événement en plus.
    await signAsParticipant(kevin.token, {
      mode: "handwritten",
      image: PNG,
      consent: true,
    });
    expect(await resendInvitation(contract.id, kevin.id, capture)).toEqual({
      status: "notOpen",
    });
    expect(capture.messages).toHaveLength(1);
    expect(await invitationsSent(contract.id)).toHaveLength(1);
  });
});
