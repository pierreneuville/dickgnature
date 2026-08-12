// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createContract } from "@/lib/contracts";
import { addParticipants, signAsParticipant } from "@/lib/participants";
import { GET } from "./route";

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

describe("GET /contracts/:id/pdf", () => {
  beforeEach(async () => {
    await prisma.signature.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.contract.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 409 before completion then a downloadable PDF after signature", async () => {
    const contract = await createContract({
      title: "Accord de test",
      body: "Le document est signé.",
      tone: "serious",
    });
    const [participant] = await addParticipants(contract.id, [
      { name: "Sam", email: "sam@example.fr" },
    ]);
    const context = { params: Promise.resolve({ id: contract.id }) };

    const pending = await GET(new Request("https://example.test"), context);
    expect(pending.status).toBe(409);

    await signAsParticipant(participant.token, {
      mode: "handwritten",
      image: PNG,
      consent: true,
    });
    const response = await GET(new Request("https://example.test"), context);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(
      new TextDecoder().decode(new Uint8Array(await response.arrayBuffer()).slice(0, 5)),
    ).toBe("%PDF-");
  });

  it("returns 404 for an unknown contract", async () => {
    const response = await GET(new Request("https://example.test"), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(response.status).toBe(404);
  });
});
