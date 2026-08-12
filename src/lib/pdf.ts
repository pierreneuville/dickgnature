import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  rgb,
} from "pdf-lib";
import { auditEventLabel, formatUtc } from "@/lib/audit";
import { sha256FrozenDocument } from "@/lib/document-proof";
import {
  isCompletedProof,
  type ContractProof,
  type ProofParticipant,
} from "@/lib/signed-document";

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 52;
const CONTENT_WIDTH = A4[0] - MARGIN * 2;
const FUN_DISCLAIMER = "Playful agreement — not a universal legal guarantee";

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

  badge(): void {
    const label = "SES — Simple electronic signature";
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
): Promise<void> {
  if (!participant.signature || !participant.signedAt || !participant.consentedAt) {
    throw new PdfGenerationError("A signature or consent record is missing.");
  }
  layout.ensureSpace(150);
  layout.text(`${participant.name} — ${participant.email}`, { bold: true, size: 11 });
  layout.text(
    `Explicit consent: ${formatUtc(participant.consentedAt)} · Signature: ${formatUtc(participant.signedAt)}`,
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

  const pdf = await PDFDocument.create();
  pdf.setTitle(proof.title);
  pdf.setSubject("Signed agreement with SES audit trail");
  pdf.setCreationDate(proof.completedAt);
  pdf.setModificationDate(proof.completedAt);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const layout = new PdfLayout(pdf, regular, bold);

  layout.badge();
  layout.heading(proof.title);
  layout.text(`Document completed on ${formatUtc(proof.completedAt)}.`, { size: 9 });
  if (proof.tone === "fun") {
    layout.text(FUN_DISCLAIMER, { bold: true, color: rgb(0.62, 0.22, 0.08) });
  }
  layout.heading("Agreement text", 15);
  layout.text(proof.body, { size: 11 });
  layout.heading("Signatures", 15);
  for (const participant of proof.participants) {
    await drawSignature(layout, participant);
  }

  layout.newPage();
  layout.badge();
  layout.heading("What makes this PDF useful proof");
  layout.text(
    "This file brings together the elements of a simple electronic signature (SES). It documents the agreement without claiming to be a universal equivalent of a handwritten signature.",
  );
  layout.text(
    "Explicit consent — every signer ticked a dedicated box before signing; the UTC time is retained.",
    { bold: true },
  );
  layout.text(
    "UTC timestamps — creation, invitation, opening, consent, and signature events use an unambiguous format.",
    { bold: true },
  );
  layout.text(
    "Document fingerprint — the SHA-256 below covers the canonical representation of the frozen agreement, its signers, and their signatures at completion.",
    { bold: true },
  );
  layout.text(`SHA-256 : ${proof.documentHash}`, { size: 9 });
  layout.text(
    "Event log — the timeline connects each action to the email address provided by that signer.",
    { bold: true },
  );
  for (const event of proof.auditEvents) {
    const identity = event.email ? ` — ${event.email}` : "";
    layout.text(
      `${formatUtc(event.occurredAt)} — ${auditEventLabel(event.type)}${identity}`,
      { size: 8.5 },
    );
  }
  if (proof.tone === "fun") {
    layout.text(FUN_DISCLAIMER, { bold: true, color: rgb(0.62, 0.22, 0.08) });
  }

  const pages = pdf.getPages();
  pages.forEach((page, index) => {
    page.drawText(`Page ${index + 1} / ${pages.length}`, {
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
