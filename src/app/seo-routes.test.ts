import { describe, expect, it } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";

describe("SEO metadata routes", () => {
  it("publishes both public pages in all four locales", () => {
    const entries = sitemap();

    expect(entries).toHaveLength(8);
    expect(entries.map((entry) => entry.url)).toEqual(
      expect.arrayContaining([
        "https://dickgnature.vercel.app/",
        "https://dickgnature.vercel.app/fr",
        "https://dickgnature.vercel.app/pt/contracts/new",
        "https://dickgnature.vercel.app/es/contracts/new",
      ]),
    );
    expect(entries[0]?.alternates?.languages).toMatchObject({
      en: "https://dickgnature.vercel.app/",
      "x-default": "https://dickgnature.vercel.app/",
    });
  });

  it("keeps private agreement and token routes out of crawling", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;

    expect(rules?.disallow).toEqual(
      expect.arrayContaining([
        "/contracts",
        "/sign",
        "/fr/contracts",
        "/fr/sign",
      ]),
    );
    expect(result.sitemap).toBe(
      "https://dickgnature.vercel.app/sitemap.xml",
    );
  });
});
