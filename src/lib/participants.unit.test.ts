import { describe, expect, it } from "vitest";
import {
  generateSignatureToken,
  participantInputSchema,
  participantLinkState,
} from "./participants";

describe("generateSignatureToken", () => {
  it("produces a URL-safe token with ≥128 bits of entropy", () => {
    const token = generateSignatureToken();
    // base64url uniquement : pas de +, /, =, ni caractères non sûrs en URL.
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    // 32 octets → 256 bits ; en base64url ≈ 43 caractères. On garde une borne prudente ≥ 22
    // (soit ≥ 128 bits) pour ne pas coupler le test à la longueur exacte de l'encodage.
    expect(token.length).toBeGreaterThanOrEqual(22);
  });

  it("is non-guessable: distinct on every call", () => {
    const tokens = new Set(
      Array.from({ length: 100 }, () => generateSignatureToken()),
    );
    expect(tokens.size).toBe(100);
  });
});

describe("participantInputSchema", () => {
  it("accepts a valid name/email and lowercases the email", () => {
    const parsed = participantInputSchema.parse({
      name: "  Kevin  ",
      email: "  Kevin@Example.FR ",
    });
    expect(parsed).toEqual({ name: "Kevin", email: "kevin@example.fr" });
  });

  it("rejects an empty name", () => {
    expect(() =>
      participantInputSchema.parse({ name: "", email: "a@b.fr" }),
    ).toThrow();
  });

  it("rejects an invalid email", () => {
    expect(() =>
      participantInputSchema.parse({ name: "Sam", email: "not-an-email" }),
    ).toThrow();
  });
});

describe("participantLinkState", () => {
  const now = new Date("2026-08-11T12:00:00Z");

  it("is 'open' for an unsigned, unexpired link", () => {
    expect(
      participantLinkState(
        { signedAt: null, expiresAt: new Date("2026-09-11T12:00:00Z") },
        now,
      ),
    ).toBe("open");
  });

  it("is 'signed' once the participant has signed (even if also expired)", () => {
    expect(
      participantLinkState(
        {
          signedAt: new Date("2026-08-10T12:00:00Z"),
          expiresAt: new Date("2026-08-01T12:00:00Z"),
        },
        now,
      ),
    ).toBe("signed");
  });

  it("is 'expired' for an unsigned link past its TTL", () => {
    expect(
      participantLinkState(
        { signedAt: null, expiresAt: new Date("2026-08-01T12:00:00Z") },
        now,
      ),
    ).toBe("expired");
  });
});
