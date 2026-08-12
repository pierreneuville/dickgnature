import { getMessageTranslator, type MessageTranslator } from "@/i18n/messages";
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

// Le sujet et le corps sont rendus dans la langue du contrat (proof.locale) via le catalogue
// `emails`. Le ton (fun/serious) choisit la variante ; il reste orthogonal à la langue (ADR-005).
// Seuls les champs destinés au HTML reçoivent des valeurs échappées ; texte et sujet restent bruts.
export function buildCompletedContractEmail(
  proof: ContractProof,
  participant: ProofParticipant,
  pdf: Uint8Array,
  t: MessageTranslator,
  fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_ADDRESS,
): EmailMessage {
  const variant = proof.tone === "fun" ? "fun" : "serious";
  const filename = attachmentFilename(proof.title);

  return {
    from: `${t(`${variant}.sender`)} <${fromAddress}>`,
    to: participant.email,
    subject: t(`${variant}.subject`, { title: proof.title }),
    text: t(`${variant}.text`, { name: participant.name, title: proof.title }),
    // Le corps HTML porte des balises (`<p>`, `<strong>`) : `markup` les rend en chaîne via des
    // gestionnaires, alors que l'appel simple les rejetterait. Les valeurs interpolées restent
    // échappées ; les balises produites ici sont sûres car statiques et sous notre contrôle.
    html: t.markup(`${variant}.html`, {
      name: escapeHtml(participant.name),
      title: escapeHtml(proof.title),
      p: (chunks) => `<p>${chunks}</p>`,
      strong: (chunks) => `<strong>${chunks}</strong>`,
    }),
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

  // Un seul rendu PDF et un seul traducteur, partagés à l'identique entre tous les destinataires.
  const t = await getMessageTranslator(proof.locale, "emails");
  const pdf = await generateSignedPdf(proof);
  await Promise.all(
    proof.participants.map((participant) =>
      transport.send(buildCompletedContractEmail(proof, participant, pdf, t)),
    ),
  );
}
