import { describe, expect, it } from "vitest";
import {
  localizedAlternates,
  localizedPath,
  openGraphLocale,
  privatePageMetadata,
  safeJsonLd,
  seoCopy,
} from "./seo";

describe("SEO helpers", () => {
  it("keeps English unprefixed and prefixes the other locales", () => {
    expect(localizedPath("en")).toBe("/");
    expect(localizedPath("fr")).toBe("/fr");
    expect(localizedPath("pt", "/contracts/new/")).toBe(
      "/pt/contracts/new",
    );
  });

  it("builds canonical and reciprocal hreflang links with English x-default", () => {
    const alternates = localizedAlternates("es", "/contracts/new");

    expect(alternates.canonical).toBe(
      "https://dickgnature.vercel.app/es/contracts/new",
    );
    expect(alternates.languages).toMatchObject({
      en: "https://dickgnature.vercel.app/contracts/new",
      fr: "https://dickgnature.vercel.app/fr/contracts/new",
      pt: "https://dickgnature.vercel.app/pt/contracts/new",
      es: "https://dickgnature.vercel.app/es/contracts/new",
      "x-default": "https://dickgnature.vercel.app/contracts/new",
    });
  });

  it("maps locales to valid Open Graph locale values", () => {
    expect(openGraphLocale("en")).toBe("en_US");
    expect(openGraphLocale("pt")).toBe("pt_PT");
  });

  it("provides distinct localized metadata for every public locale", () => {
    expect(new Set(Object.values(seoCopy).map((copy) => copy.title)).size).toBe(4);
    expect(Object.values(seoCopy).every((copy) => copy.description.length > 40)).toBe(true);
  });

  it("marks private agreement pages as non-indexable", () => {
    const metadata = privatePageMetadata("Private agreement");

    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("escapes markup-significant characters in JSON-LD", () => {
    expect(safeJsonLd({ name: "</script><script>alert(1)</script>" })).not.toContain(
      "<",
    );
  });
});
