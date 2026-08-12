import { describe, expect, it } from "vitest";
import { routing } from "./routing";

describe("i18n routing", () => {
  it("declares EN as the unprefixed default and FR/PT/ES as alternates", () => {
    expect(routing.defaultLocale).toBe("en");
    expect(routing.locales).toEqual(["en", "fr", "pt", "es"]);
    // "as-needed" garde les URLs EN déjà distribuées (dont /sign/[token]) sans préfixe.
    expect(routing.localePrefix).toBe("as-needed");
  });
});
