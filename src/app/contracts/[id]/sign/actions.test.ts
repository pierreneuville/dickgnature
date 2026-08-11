// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createContract } from "@/lib/contracts";
import { listSignatures } from "@/lib/signatures";
import { submitSignatureAction } from "./actions";

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

function formDataOf(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("submitSignatureAction", () => {
  beforeEach(async () => {
    await prisma.signature.deleteMany();
    await prisma.contract.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("persists then redirects on a valid handwritten signature", async () => {
    const contract = await createContract({
      title: "T",
      body: "Corps valide.",
      tone: "serious",
    });

    await expect(
      submitSignatureAction(
        contract.id,
        {},
        formDataOf({ mode: "handwritten", image: PNG, consent: "on" }),
      ),
    ).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT"),
    });

    expect(await listSignatures(contract.id)).toHaveLength(1);
  });

  it("returns an error when the parody pattern is used on a serious contract", async () => {
    const contract = await createContract({
      title: "S",
      body: "Corps valide.",
      tone: "serious",
    });

    const result = await submitSignatureAction(
      contract.id,
      {},
      formDataOf({ mode: "pattern", image: PNG, consent: "on" }),
    );

    expect(result.error).toBeTruthy();
    expect(await listSignatures(contract.id)).toHaveLength(0);
  });

  it("returns an error on an invalid image", async () => {
    const contract = await createContract({
      title: "X",
      body: "Corps valide.",
      tone: "fun",
    });

    const result = await submitSignatureAction(
      contract.id,
      {},
      formDataOf({ mode: "handwritten", image: "nope", consent: "on" }),
    );

    expect(result.error).toBeTruthy();
    expect(await listSignatures(contract.id)).toHaveLength(0);
  });
});
