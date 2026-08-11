import { describe, expect, it } from "vitest";
import {
  CONTRACT_STATUS_LABELS,
  deriveContractStatus,
  isContractStatus,
  normalizeContractStatus,
} from "./contract-status";

const at = (iso: string) => new Date(iso);

describe("deriveContractStatus", () => {
  it("is draft when there is no participant", () => {
    expect(deriveContractStatus([])).toBe("draft");
  });

  it("is sent when participants are invited but none signed", () => {
    expect(
      deriveContractStatus([{ signedAt: null }, { signedAt: null }]),
    ).toBe("sent");
  });

  it("is partially_signed when some but not all have signed", () => {
    expect(
      deriveContractStatus([
        { signedAt: at("2026-08-11T10:00:00Z") },
        { signedAt: null },
      ]),
    ).toBe("partially_signed");
  });

  it("is completed when every participant has signed", () => {
    expect(
      deriveContractStatus([
        { signedAt: at("2026-08-11T10:00:00Z") },
        { signedAt: at("2026-08-11T11:00:00Z") },
      ]),
    ).toBe("completed");
  });

  it("a single signed participant completes the contract", () => {
    expect(
      deriveContractStatus([{ signedAt: at("2026-08-11T10:00:00Z") }]),
    ).toBe("completed");
  });
});

describe("contract status helpers", () => {
  it("recognizes valid statuses and rejects others", () => {
    expect(isContractStatus("completed")).toBe(true);
    expect(isContractStatus("archived")).toBe(false);
    expect(isContractStatus(42)).toBe(false);
  });

  it("normalizes unknown stored values back to draft", () => {
    expect(normalizeContractStatus("sent")).toBe("sent");
    expect(normalizeContractStatus("weird")).toBe("draft");
  });

  it("exposes a human label for every status", () => {
    expect(CONTRACT_STATUS_LABELS.partially_signed).toBe("Signé en partie");
    expect(CONTRACT_STATUS_LABELS.completed).toBe("Complété");
  });
});
