// @vitest-environment node
import { fileURLToPath } from "node:url";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { prisma } from "@/lib/db";
import { createContract } from "@/lib/contracts";
import { sendCompletedContractEmails } from "@/lib/completion-email";
import { CaptureEmailTransport } from "@/lib/email-transport";
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
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  await loadingTask.destroy();
  return pages.join("\n");
}

async function completedFrenchContract() {
  const contract = await createContract({
    title: "Prêt de la perceuse",
    body: "Kevin rend la perceuse avant dimanche.",
    tone: "serious",
    locale: "fr",
  });
  const [participant] = await addParticipants(contract.id, [
    { name: "Kevin", email: "kevin@example.fr" },
  ]);
  await signAsParticipant(participant.token, {
    mode: "handwritten",
    image: PNG,
    consent: true,
  });
  return contract.id;
}

describe("contract locale persistence and localized rendering (integration)", () => {
  beforeEach(async () => {
    await prisma.signature.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.auditEvent.deleteMany();
    await prisma.contract.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("persists the contract locale and defaults to English when absent", async () => {
    const fr = await createContract({
      title: "Accord de prêt",
      body: "La perceuse sera rendue vendredi.",
      tone: "serious",
      locale: "fr",
    });
    expect(fr.locale).toBe("fr");
    const frProof = await getContractProof(fr.id);
    expect(frProof?.locale).toBe("fr");

    // Simule une ligne « existante » écrite sans locale : le défaut de colonne DB doit être "en".
    const legacy = await prisma.contract.create({
      data: { title: "Legacy row", body: "Written before the migration." },
    });
    expect(legacy.locale).toBe("en");

    // Une valeur hors en|fr|pt|es est renormalisée vers "en" par la couche domaine.
    const bogus = await createContract({
      title: "Bogus locale",
      body: "Unknown language tag.",
      tone: "serious",
      locale: "zz",
    });
    expect(bogus.locale).toBe("en");
  });

  it("renders the signed PDF in the contract's language", async () => {
    const id = await completedFrenchContract();
    const proof = await getContractProof(id);
    if (!proof) throw new Error("proof missing");

    const text = await extractPdfText(await generateSignedPdf(proof));

    // En-têtes et libellés d'audit en français. pdfSafeText convertit l'apostrophe typographique
    // (U+2019) en apostrophe droite : on assert donc sur la forme droite telle que rendue.
    expect(text).toContain("Texte de l'accord");
    expect(text).toContain("Ce qui fait de ce PDF une preuve utile");
    expect(text).toContain("SES — Signature électronique simple");
    expect(text).toContain("Accord créé");
    expect(text).toContain("Signature enregistrée");
    // …et surtout pas les libellés anglais par défaut.
    expect(text).not.toContain("Agreement text");
    expect(text).not.toContain("What makes this PDF useful proof");
  });

  it("sends the completion email in the contract's language", async () => {
    const id = await completedFrenchContract();
    const capture = new CaptureEmailTransport();
    await sendCompletedContractEmails(id, capture);

    expect(capture.messages).toHaveLength(1);
    const message = capture.messages[0];
    expect(message.subject).toBe("Votre accord signé — Prêt de la perceuse");
    expect(message.from).toContain("Accords signés");
    expect(message.text).toContain("Toutes les parties ont signé");
    expect(message.html).toContain("piste d’audit");
    expect(message.text).not.toContain("All parties have signed");
  });
});
