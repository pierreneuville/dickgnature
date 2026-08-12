import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  rgb,
} from "pdf-lib";
import { getMessageTranslator, type MessageTranslator } from "@/i18n/messages";
import { formatUtc, isAuditEventType } from "@/lib/audit";
import { sha256FrozenDocument } from "@/lib/document-proof";
import {
  isCompletedProof,
  type ContractProof,
  type ProofParticipant,
} from "@/lib/signed-document";

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 52;
const CONTENT_WIDTH = A4[0] - MARGIN * 2;

export class PdfGenerationError extends Error {}

function pdfSafeText(value: string): string {
  return value
    .replaceAll("œ", "oe")
    .replaceAll("Œ", "OE")
    .replaceAll("…", "...")
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("•", "-")
    .replace(/[^\x0A\x0D\x20-\x7E\xA0-\xFF\u2013\u2014]/g, "?");
}

function wrapText(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of pdfSafeText(text).split(/\r?\n/)) {
    if (!paragraph) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

class PdfLayout {
  readonly pdf: PDFDocument;
  readonly regular: PDFFont;
  readonly bold: PDFFont;
  page: PDFPage;
  y: number;

  constructor(pdf: PDFDocument, regular: PDFFont, bold: PDFFont) {
    this.pdf = pdf;
    this.regular = regular;
    this.bold = bold;
    this.page = pdf.addPage(A4);
    this.y = A4[1] - MARGIN;
  }

  newPage(): void {
    this.page = this.pdf.addPage(A4);
    this.y = A4[1] - MARGIN;
  }

  ensureSpace(height: number): void {
    if (this.y - height < MARGIN + 24) {
      this.newPage();
    }
  }

  heading(text: string, size = 22): void {
    this.ensureSpace(size + 20);
    this.page.drawText(pdfSafeText(text), {
      x: MARGIN,
      y: this.y - size,
      size,
      font: this.bold,
      color: rgb(0.08, 0.11, 0.18),
    });
    this.y -= size + 18;
  }

  text(text: string, options: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {}): void {
    const size = options.size ?? 10.5;
    const font = options.bold ? this.bold : this.regular;
    const lines = wrapText(text, font, size, CONTENT_WIDTH);
    const lineHeight = size * 1.45;
    for (const line of lines) {
      this.ensureSpace(lineHeight);
      if (line) {
        this.page.drawText(line, {
          x: MARGIN,
          y: this.y - size,
          size,
          font,
          color: options.color ?? rgb(0.16, 0.19, 0.25),
        });
      }
      this.y -= lineHeight;
    }
    this.y -= 5;
  }

  badge(label: string): void {
    const size = 10;
    const width = this.bold.widthOfTextAtSize(pdfSafeText(label), size) + 24;
    this.ensureSpace(34);
    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - 24,
      width,
      height: 24,
      color: rgb(0.9, 0.96, 1),
      borderColor: rgb(0.12, 0.45, 0.75),
      borderWidth: 1,
    });
    this.page.drawText(pdfSafeText(label), {
      x: MARGIN + 12,
      y: this.y - 16,
      size,
      font: this.bold,
      color: rgb(0.06, 0.32, 0.58),
    });
    this.y -= 38;
  }
}

function participantFrozen(participant: ProofParticipant) {
  if (
    !participant.openedAt ||
    !participant.consentedAt ||
    !participant.signedAt ||
    !participant.signature
  ) {
    throw new PdfGenerationError("The proof trail is incomplete.");
  }
  return {
    id: participant.id,
    name: participant.name,
    email: participant.email,
    invitedAt: participant.invitedAt,
    openedAt: participant.openedAt,
    consentedAt: participant.consentedAt,
    signedAt: participant.signedAt,
    signature: participant.signature,
  };
}

function verifyFrozenHash(proof: ContractProof): void {
  if (!isCompletedProof(proof)) {
    throw new PdfGenerationError(
      "The signed PDF is only available once the agreement is complete.",
    );
  }
  const calculated = sha256FrozenDocument({
    id: proof.id,
    title: proof.title,
    body: proof.body,
    tone: proof.tone,
    createdAt: proof.createdAt,
    completedAt: proof.completedAt,
    participants: proof.participants.map(participantFrozen),
  });
  if (calculated !== proof.documentHash) {
    throw new PdfGenerationError(
      "The fingerprint no longer matches the agreement's frozen content.",
    );
  }
}

async function drawSignature(
  layout: PdfLayout,
  participant: ProofParticipant,
  t: MessageTranslator,
): Promise<void> {
  if (!participant.signature || !participant.signedAt || !participant.consentedAt) {
    throw new PdfGenerationError("A signature or consent record is missing.");
  }
  layout.ensureSpace(150);
  layout.text(`${participant.name} — ${participant.email}`, { bold: true, size: 11 });
  layout.text(
    t("consentSignatureLine", {
      consent: formatUtc(participant.consentedAt),
      sign: formatUtc(participant.signedAt),
    }),
    { size: 8.5 },
  );
  const base64 = participant.signature.image.slice(
    participant.signature.image.indexOf(",") + 1,
  );
  const image = await layout.pdf.embedPng(Buffer.from(base64, "base64"));
  const scaled = image.scale(Math.min(1, 180 / image.width, 80 / image.height));
  layout.page.drawRectangle({
    x: MARGIN,
    y: layout.y - 92,
    width: 200,
    height: 90,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.84, 0.86, 0.9),
    borderWidth: 1,
  });
  layout.page.drawImage(image, {
    x: MARGIN + 10,
    y: layout.y - 82 + (80 - scaled.height) / 2,
    width: scaled.width,
    height: scaled.height,
  });
  layout.y -= 108;
}

export async function generateSignedPdf(proof: ContractProof): Promise<Uint8Array> {
  verifyFrozenHash(proof);
  if (!isCompletedProof(proof)) {
    throw new PdfGenerationError("The proof trail is incomplete.");
  }

  // Traducteurs rendus dans la langue du contrat (proof.locale). On réutilise les catalogues déjà
  // extraits pour le chrome UI : `proof` (page probante) et `auditEvent` (libellés du journal).
  const t = await getMessageTranslator(proof.locale, "pdf");
  const tProof = await getMessageTranslator(proof.locale, "proof");
  const tAudit = await getMessageTranslator(proof.locale, "auditEvent");
  const disclaimerColor = rgb(0.62, 0.22, 0.08);

  const pdf = await PDFDocument.create();
  pdf.setTitle(proof.title);
  pdf.setSubject("Signed agreement with SES audit trail");
  pdf.setCreationDate(proof.completedAt);
  pdf.setModificationDate(proof.completedAt);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const layout = new PdfLayout(pdf, regular, bold);

  layout.badge(t("sesBadge"));
  layout.heading(proof.title);
  layout.text(t("completedOn", { date: formatUtc(proof.completedAt) }), { size: 9 });
  if (proof.tone === "fun") {
    layout.text(t("funDisclaimer"), { bold: true, color: disclaimerColor });
  }
  layout.heading(t("agreementHeading"), 15);
  layout.text(proof.body, { size: 11 });
  layout.heading(t("signaturesHeading"), 15);
  for (const participant of proof.participants) {
    await drawSignature(layout, participant, t);
  }

  layout.newPage();
  layout.badge(t("sesBadge"));
  layout.heading(tProof("title"));
  layout.text(tProof("intro"));
  layout.text(`${tProof("consentTitle")} — ${tProof("consentBody")}`, { bold: true });
  layout.text(`${tProof("timestampsTitle")} — ${tProof("timestampsBody")}`, { bold: true });
  layout.text(`${tProof("fingerprintTitle")} — ${tProof("fingerprintBody")}`, { bold: true });
  layout.text(`SHA-256 : ${proof.documentHash}`, { size: 9 });
  layout.text(`${tProof("eventLogTitle")} — ${tProof("eventLogBody")}`, { bold: true });
  for (const event of proof.auditEvents) {
    const identity = event.email ? ` — ${event.email}` : "";
    const label = isAuditEventType(event.type) ? tAudit(event.type) : tAudit("fallback");
    layout.text(`${formatUtc(event.occurredAt)} — ${label}${identity}`, { size: 8.5 });
  }
  if (proof.tone === "fun") {
    layout.text(t("funDisclaimer"), { bold: true, color: disclaimerColor });
  }

  const pages = pdf.getPages();
  pages.forEach((page, index) => {
    page.drawText(t("pageLabel", { current: index + 1, total: pages.length }), {
      x: MARGIN,
      y: 28,
      size: 8,
      font: regular,
      color: rgb(0.42, 0.45, 0.5),
    });
    page.drawText(`SHA-256 fingerprint: ${proof.documentHash.slice(0, 16)}…`, {
      x: A4[0] - MARGIN - 190,
      y: 28,
      size: 8,
      font: regular,
      color: rgb(0.42, 0.45, 0.5),
    });
  });

  return pdf.save({ useObjectStreams: false });
}
