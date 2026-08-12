import { createEmailTransport, type EmailMessage, type EmailTransport } from "@/lib/email-transport";
import { generateSignedPdf } from "@/lib/pdf";
import {
  getContractProof,
  isCompletedProof,
  type ContractProof,
  type ProofParticipant,
} from "@/lib/signed-document";

const DEFAULT_FROM_ADDRESS = "onboarding@resend.dev";

export class CompletionEmailError extends Error {}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function attachmentFilename(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
  return `signed-agreement-${slug || "document"}.pdf`;
}

function sender(tone: ContractProof["tone"], address: string): string {
  return tone === "fun"
    ? `dickgnature <${address}>`
    : `Signed agreements <${address}>`;
}

export function buildCompletedContractEmail(
  proof: ContractProof,
  participant: ProofParticipant,
  pdf: Uint8Array,
  fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_ADDRESS,
): EmailMessage {
  const title = escapeHtml(proof.title);
  const name = escapeHtml(participant.name);
  const filename = attachmentFilename(proof.title);

  if (proof.tone === "fun") {
    return {
      from: sender(proof.tone, fromAddress),
      to: participant.email,
      subject: `Signed, sealed, no drama 🎉 — ${proof.title}`,
      text: `Hey ${participant.name},\n\nEveryone has signed “${proof.title}”. Your shiny signed copy is attached. Keep it somewhere safer than the group chat.\n\nCatch you later,\ndickgnature`,
      html: `<p>Hey ${name},</p><p>Everyone has signed <strong>“${title}”</strong>.</p><p>Your shiny signed copy is attached. Keep it somewhere safer than the group chat.</p><p>Catch you later,<br><strong>dickgnature</strong></p>`,
      attachments: [{ filename, contentType: "application/pdf", content: pdf }],
    };
  }

  return {
    from: sender(proof.tone, fromAddress),
    to: participant.email,
    subject: `Your signed agreement — ${proof.title}`,
    text: `Hello ${participant.name},\n\nAll parties have signed “${proof.title}”. Your copy of the signed agreement and its audit trail is attached.\n\nKind regards,\nSigning service`,
    html: `<p>Hello ${name},</p><p>All parties have signed <strong>“${title}”</strong>.</p><p>Your copy of the signed agreement and its audit trail is attached.</p><p>Kind regards,<br>Signing service</p>`,
    attachments: [{ filename, contentType: "application/pdf", content: pdf }],
  };
}

export async function sendCompletedContractEmails(
  contractId: string,
  transport: EmailTransport = createEmailTransport(),
): Promise<void> {
  const proof = await getContractProof(contractId);
  if (!proof || !isCompletedProof(proof)) {
    throw new CompletionEmailError(
      "Signed copies can only be sent after the agreement is complete.",
    );
  }

  // Un seul rendu PDF, partagé à l'identique entre tous les destinataires.
  const pdf = await generateSignedPdf(proof);
  await Promise.all(
    proof.participants.map((participant) =>
      transport.send(buildCompletedContractEmail(proof, participant, pdf)),
    ),
  );
}
