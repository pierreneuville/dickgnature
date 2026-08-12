import { describe, expect, it } from "vitest";
import {
  EASTER_EGG_NAMES,
  findEasterEggName,
  matchesEasterEggName,
  normalizeName,
} from "./easter-egg";

describe("normalizeName", () => {
  it("trims, collapses internal whitespace, and lowercases", () => {
    expect(normalizeName("  Pierre   184 ")).toBe("pierre 184");
    expect(normalizeName("SSSB")).toBe("sssb");
  });
});

describe("matchesEasterEggName", () => {
  it("matches the reserved names ignoring case", () => {
    expect(matchesEasterEggName("sssb")).toBe(true);
    expect(matchesEasterEggName("SSSB")).toBe(true);
    expect(matchesEasterEggName("Pierre 184")).toBe(true);
  });

  it("matches ignoring superfluous whitespace", () => {
    expect(matchesEasterEggName("  SSSB  ")).toBe(true);
    expect(matchesEasterEggName("pierre    184")).toBe(true);
  });

  it("does not match other names", () => {
    expect(matchesEasterEggName("Pierre")).toBe(false);
    expect(matchesEasterEggName("Pierre 185")).toBe(false);
    expect(matchesEasterEggName("SSS")).toBe(false);
  });

  it("returns false for empty, null, or undefined", () => {
    expect(matchesEasterEggName("")).toBe(false);
    expect(matchesEasterEggName(null)).toBe(false);
    expect(matchesEasterEggName(undefined)).toBe(false);
  });
});

describe("findEasterEggName", () => {
  it("returns the first original name that triggers, preserving its spelling", () => {
    expect(findEasterEggName(["Alice", "  pierre 184 ", "Bob"])).toBe(
      "  pierre 184 ",
    );
  });

  it("returns null when no name triggers", () => {
    expect(findEasterEggName(["Alice", "Bob", null, undefined])).toBeNull();
  });

  it("returns null for an empty list", () => {
    expect(findEasterEggName([])).toBeNull();
  });
});

describe("EASTER_EGG_NAMES", () => {
  it("centralises the trigger list", () => {
    expect(EASTER_EGG_NAMES).toContain("SSSB");
    expect(EASTER_EGG_NAMES).toContain("Pierre 184");
  });
});
