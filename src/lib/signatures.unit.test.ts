import { describe, expect, it } from "vitest";
import {
  availableSignatureModes,
  isModeAllowedForTone,
  isSignatureMode,
  signatureImageSchema,
} from "@/lib/signatures";

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

describe("signature modes", () => {
  it("offers the handwritten mode in every tone", () => {
    expect(availableSignatureModes("serious")).toEqual(["handwritten"]);
    expect(availableSignatureModes("fun")).toContain("handwritten");
  });

  it("offers the parody pattern only in fun", () => {
    expect(availableSignatureModes("fun")).toContain("pattern");
    expect(availableSignatureModes("serious")).not.toContain("pattern");
    expect(isModeAllowedForTone("fun", "pattern")).toBe(true);
    expect(isModeAllowedForTone("serious", "pattern")).toBe(false);
    expect(isModeAllowedForTone("serious", "handwritten")).toBe(true);
  });

  it("recognizes signature modes and rejects the rest", () => {
    expect(isSignatureMode("handwritten")).toBe(true);
    expect(isSignatureMode("pattern")).toBe(true);
    expect(isSignatureMode("stamp")).toBe(false);
    expect(isSignatureMode(3)).toBe(false);
  });

  it("accepts a PNG dataURL and rejects anything else", () => {
    expect(signatureImageSchema.safeParse(PNG).success).toBe(true);
    expect(
      signatureImageSchema.safeParse("data:image/jpeg;base64,abcd").success,
    ).toBe(false);
    expect(signatureImageSchema.safeParse("definitely-not-an-image").success).toBe(
      false,
    );
  });
});
