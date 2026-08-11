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
  return `contrat-signe-${slug || "document"}.pdf`;
}

function sender(tone: ContractProof["tone"], address: string): string {
  return tone === "fun"
    ? `dickgnature <${address}>`
    : `Dossiers signés <${address}>`;
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
      subject: `C'est signé 🎉 — ${proof.title}`,
      text: `Salut ${participant.name},\n\nTout le monde a signé « ${proof.title} ». Ta copie du contrat signé est jointe à cet email. Garde-la bien au chaud.\n\nÀ bientôt,\ndickgnature`,
      html: `<p>Salut ${name},</p><p>Tout le monde a signé <strong>« ${title} »</strong>.</p><p>Ta copie du contrat signé est jointe à cet email. Garde-la bien au chaud.</p><p>À bientôt,<br><strong>dickgnature</strong></p>`,
      attachments: [{ filename, contentType: "application/pdf", content: pdf }],
    };
  }

  return {
    from: sender(proof.tone, fromAddress),
    to: participant.email,
    subject: `Votre contrat signé — ${proof.title}`,
    text: `Bonjour ${participant.name},\n\nToutes les parties ont signé « ${proof.title} ». Vous trouverez en pièce jointe votre copie du contrat signé et de sa piste d'audit.\n\nCordialement,\nService de signature`,
    html: `<p>Bonjour ${name},</p><p>Toutes les parties ont signé <strong>« ${title} »</strong>.</p><p>Vous trouverez en pièce jointe votre copie du contrat signé et de sa piste d'audit.</p><p>Cordialement,<br>Service de signature</p>`,
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
      "Les copies signées ne peuvent être envoyées qu'après la complétion du contrat.",
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
