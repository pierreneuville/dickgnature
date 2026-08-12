// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createContractAction } from "./actions";

function formDataOf(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("createContractAction", () => {
  beforeEach(async () => {
    await prisma.contract.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns a validation error for an empty body", async () => {
    const result = await createContractAction(
      {},
      formDataOf({ title: "Sans corps", body: "" }),
    );
    expect(result.error).toBeTruthy();
    expect(await prisma.contract.count()).toBe(0);
  });

  it("persists then redirects on valid input, defaulting tone to fun", async () => {
    await expect(
      createContractAction({}, formDataOf({ title: "Pari", body: "Kebab au perdant." })),
    ).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") });

    const rows = await prisma.contract.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].tone).toBe("fun");
  });

  it("coerces an unknown tone to the default", async () => {
    await expect(
      createContractAction(
        {},
        formDataOf({ title: "X", body: "Corps valide.", tone: "spicy" }),
      ),
    ).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") });

    const rows = await prisma.contract.findMany();
    expect(rows[0].tone).toBe("fun");
  });
});
