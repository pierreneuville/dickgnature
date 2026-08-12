// @vitest-environment node
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { createContract, getContract } from "@/lib/contracts";
import { addParticipants, listParticipants } from "@/lib/participants";
import {
  CaptureEmailTransport,
  EmailTransportError,
  type EmailTransport,
} from "@/lib/email-transport";
import {
  addParticipantsAction,
  resendInvitationAction,
} from "./participants-actions";

function formDataOf(rows: Array<{ name: string; email: string }>): FormData {
  const fd = new FormData();
  for (const row of rows) {
    fd.append("name", row.name);
    fd.append("email", row.email);
  }
  return fd;
}

const failingTransport: EmailTransport = {
  send: async () => {
    throw new EmailTransportError("Resend rejected the email (403)");
  },
};

// redirect() lève une erreur NEXT_REDIRECT dont le digest porte l'URL cible ; on l'extrait pour
// vérifier le chemin ET la notice (succès sans notice / échec avec ?notice=…).
async function redirectDigest(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    const digest = (error as { digest?: string }).digest;
    if (typeof digest === "string" && digest.includes("NEXT_REDIRECT")) {
      return digest;
    }
    throw error;
  }
  throw new Error("expected a redirect but none was thrown");
}

describe("addParticipantsAction", () => {
  beforeEach(async () => {
    await prisma.signature.deleteMany();
    await prisma.auditEvent.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.contract.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("persists participants and redirects without a notice when every email is sent", async () => {
    const contract = await createContract({
      title: "T",
      body: "Corps valide.",
      tone: "fun",
    });
    const capture = new CaptureEmailTransport();

    const digest = await redirectDigest(
      addParticipantsAction(
        contract.id,
        {},
        formDataOf([
          { name: "Kevin", email: "kevin@example.fr" },
          { name: "Sam", email: "sam@example.fr" },
        ]),
        capture,
      ),
    );

    // Redirection vers la page contrat, SANS notice (aucun échec d'envoi).
    expect(digest).toContain(`/contracts/${contract.id}`);
    expect(digest).not.toContain("notice");
    expect(capture.messages).toHaveLength(2);
    expect(await listParticipants(contract.id)).toHaveLength(2);
    expect((await getContract(contract.id))?.status).toBe("sent");
  });

  it("keeps the created participants but surfaces a notice when the email send fails", async () => {
    const contract = await createContract({
      title: "T",
      body: "Corps valide.",
      tone: "fun",
    });

    const digest = await redirectDigest(
      addParticipantsAction(
        contract.id,
        {},
        formDataOf([{ name: "Kevin", email: "kevin@example.fr" }]),
        failingTransport,
      ),
    );

    // Création conservée (le lien tokenisé existe), mais l'échec d'envoi est remonté au créateur…
    expect(digest).toContain(`/contracts/${contract.id}?notice=invite-email-failed`);
    expect(await listParticipants(contract.id)).toHaveLength(1);
    // …et aucun `INVITATION_SENT` n'est journalisé pour un envoi qui n'a pas eu lieu.
    expect(
      await prisma.auditEvent.count({
        where: { contractId: contract.id, type: "INVITATION_SENT" },
      }),
    ).toBe(0);
  });

  it("fails closed and logs the cause when production has no Resend key", async () => {
    const contract = await createContract({
      title: "T",
      body: "Corps valide.",
      tone: "fun",
    });
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const digest = await redirectDigest(
      addParticipantsAction(
        contract.id,
        {},
        formDataOf([{ name: "Kevin", email: "kevin@example.fr" }]),
      ),
    );

    expect(digest).toContain(`/contracts/${contract.id}?notice=invite-email-failed`);
    expect(errorLog).toHaveBeenCalledWith(
      expect.stringContaining(`contrat ${contract.id}`),
      expect.any(EmailTransportError),
    );
    expect(
      await prisma.auditEvent.count({
        where: { contractId: contract.id, type: "INVITATION_SENT" },
      }),
    ).toBe(0);
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

describe("resendInvitationAction", () => {
  beforeEach(async () => {
    await prisma.signature.deleteMany();
    await prisma.auditEvent.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.contract.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("redirects with a success notice when the resend goes through", async () => {
    const contract = await createContract({
      title: "T",
      body: "Corps valide.",
      tone: "fun",
    });
    const [kevin] = await addParticipants(contract.id, [
      { name: "Kevin", email: "kevin@example.fr" },
    ]);
    const capture = new CaptureEmailTransport();

    const digest = await redirectDigest(
      resendInvitationAction(contract.id, kevin.id, undefined, capture),
    );

    expect(digest).toContain(`/contracts/${contract.id}?notice=invite-resent`);
    expect(capture.messages).toHaveLength(1);
  });

  it("redirects with a failure notice when the transport rejects", async () => {
    const contract = await createContract({
      title: "T",
      body: "Corps valide.",
      tone: "fun",
    });
    const [kevin] = await addParticipants(contract.id, [
      { name: "Kevin", email: "kevin@example.fr" },
    ]);

    const digest = await redirectDigest(
      resendInvitationAction(contract.id, kevin.id, undefined, failingTransport),
    );

    expect(digest).toContain(
      `/contracts/${contract.id}?notice=invite-resend-failed`,
    );
  });
});
