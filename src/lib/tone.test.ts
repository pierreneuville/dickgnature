import { describe, expect, it } from "vitest";
import { DEFAULT_TONE, isTone, themeFor } from "@/lib/tone";

describe("tone", () => {
  it("defaults to fun (décision Gate 1)", () => {
    expect(DEFAULT_TONE).toBe("fun");
  });

  it("recognizes valid tones and rejects the rest", () => {
    expect(isTone("fun")).toBe(true);
    expect(isTone("serious")).toBe(true);
    expect(isTone("spicy")).toBe(false);
    expect(isTone(42)).toBe(false);
  });

  it("shows the parody disclaimer only in fun mode", () => {
    expect(themeFor("fun").showParodyDisclaimer).toBe(true);
    expect(themeFor("serious").showParodyDisclaimer).toBe(false);
  });

  it("keeps serious mode neutral (no parody brand)", () => {
    expect(themeFor("serious").brand).not.toMatch(/dick/i);
  });
});
