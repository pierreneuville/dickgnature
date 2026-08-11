// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  canonicalizeFrozenDocument,
  sha256FrozenDocument,
  type FrozenDocument,
} from "@/lib/document-proof";

const PNG_A = "data:image/png;base64,AAAA";
const PNG_B = "data:image/png;base64,BBBB";

function frozenDocument(): FrozenDocument {
  return {
    id: "contract-1",
    title: "Prêt de vélo",
    body: "Sam rend le vélo vendredi.",
    tone: "serious",
    createdAt: new Date("2026-08-11T10:00:00Z"),
    completedAt: new Date("2026-08-11T10:10:00Z"),
    participants: [
      {
        id: "p-b",
        name: "Sam",
        email: "sam@example.fr",
        invitedAt: new Date("2026-08-11T10:01:00Z"),
        openedAt: new Date("2026-08-11T10:02:00Z"),
        consentedAt: new Date("2026-08-11T10:03:00Z"),
        signedAt: new Date("2026-08-11T10:03:00Z"),
        signature: {
          mode: "handwritten",
          image: PNG_B,
          signedAt: new Date("2026-08-11T10:03:00Z"),
        },
      },
      {
        id: "p-a",
        name: "Alex",
        email: "alex@example.fr",
        invitedAt: new Date("2026-08-11T10:04:00Z"),
        openedAt: new Date("2026-08-11T10:05:00Z"),
        consentedAt: new Date("2026-08-11T10:06:00Z"),
        signedAt: new Date("2026-08-11T10:06:00Z"),
        signature: {
          mode: "handwritten",
          image: PNG_A,
          signedAt: new Date("2026-08-11T10:06:00Z"),
        },
      },
    ],
  };
}

describe("frozen document SHA-256", () => {
  it("is deterministic and independent of participant input order", () => {
    const first = frozenDocument();
    const reversed = { ...first, participants: [...first.participants].reverse() };

    expect(canonicalizeFrozenDocument(first)).toBe(
      canonicalizeFrozenDocument(reversed),
    );
    expect(sha256FrozenDocument(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(sha256FrozenDocument(first)).toBe(sha256FrozenDocument(reversed));
  });

  it("changes when the frozen contract content changes", () => {
    const first = frozenDocument();
    const changed = { ...first, body: `${first.body} Amendement.` };
    expect(sha256FrozenDocument(changed)).not.toBe(
      sha256FrozenDocument(first),
    );
  });
});
