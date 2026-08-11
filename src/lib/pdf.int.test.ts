// @vitest-environment node
import { fileURLToPath } from "node:url";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { prisma } from "@/lib/db";
import { createContract } from "@/lib/contracts";
import { addParticipants, signAsParticipant } from "@/lib/participants";
import { generateSignedPdf } from "@/lib/pdf";
import { getContractProof } from "@/lib/signed-document";

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

async function extractPdfText(bytes: Uint8Array) {
  const loadingTask = getDocument({
    data: bytes,
    standardFontDataUrl: `${fileURLToPath(
      new URL("../../node_modules/pdfjs-dist/standard_fonts/", import.meta.url),
    )}/`,
  });
  const document = await loadingTask.promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" "),
    );
  }
  await loadingTask.destroy();
  return { text: pages.join("\n"), pageCount: pages.length };
}

async function completedProof(tone: "fun" | "serious") {
  const contract = await createContract({
    title: tone === "fun" ? "Pari du match" : "Prêt de la perceuse",
    body:
      tone === "fun"
        ? "Le perdant paie le kebab."
        : "Kevin rend la perceuse avant dimanche.",
    tone,
  });
  const [participant] = await addParticipants(contract.id, [
    { name: "Kevin", email: "kevin@example.fr" },
  ]);
  await signAsParticipant(participant.token, {
    mode: "handwritten",
    image: PNG,
    consent: true,
  });
  const proof = await getContractProof(contract.id);
  if (!proof) throw new Error("proof missing");
  return proof;
}

describe("signed PDF (integration, parsed output)", () => {
  beforeEach(async () => {
    await prisma.signature.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.contract.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("contains contract, participant signature evidence, audit block and the probative page", async () => {
    const proof = await completedProof("serious");
    expect(proof.documentHash).toMatch(/^[a-f0-9]{64}$/);

    const bytes = await generateSignedPdf(proof);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");

    const parsed = await extractPdfText(bytes);
    expect(parsed.pageCount).toBeGreaterThanOrEqual(2);
    expect(parsed.text).toContain("Prêt de la perceuse");
    expect(parsed.text).toContain("Kevin rend la perceuse avant dimanche.");
    expect(parsed.text).toContain("kevin@example.fr");
    expect(parsed.text).toContain("Pourquoi ce PDF est probant");
    expect(parsed.text).toContain("SES — Signature électronique simple");
    expect(parsed.text).toContain("Consentement explicite");
    expect(parsed.text).toContain("Horodatage UTC");
    expect(parsed.text).toContain("Empreinte du document");
    expect(parsed.text).toContain("Journal d'événements");
    expect(parsed.text).toContain(proof.documentHash ?? "missing-hash");
    expect(parsed.text).not.toContain("Parodie");
    expect(parsed.text).not.toMatch(/QES/i);
  });

  it("adds the honest parody disclaimer to fun PDFs only", async () => {
    const proof = await completedProof("fun");
    const { text } = await extractPdfText(await generateSignedPdf(proof));
    expect(text).toContain("Parodie — sans valeur légale universelle");
  });
});
