import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import pt from "@/messages/pt.json";
import es from "@/messages/es.json";
import {
  ACTION_ERROR_CODES,
  DOMAIN_ERROR_CODES,
  domainErrorMessage,
  type ErrorMessageKey,
} from "./error-codes";
import { ParticipantError } from "./participants";
import { SignatureError } from "./signatures";

const CATALOGUES = { en, fr, pt, es } as const;
type Locale = keyof typeof CATALOGUES;
const LOCALES = Object.keys(CATALOGUES) as Locale[];

const ALL_ERROR_KEYS: ErrorMessageKey[] = [
  ...DOMAIN_ERROR_CODES,
  ...ACTION_ERROR_CODES,
];

describe("error codes", () => {
  it("maps every error code to a non-empty key in all four languages", () => {
    for (const locale of LOCALES) {
      const catalogue = CATALOGUES[locale].errors as Record<string, string>;
      for (const code of ALL_ERROR_KEYS) {
        expect(catalogue[code], `${locale}.errors.${code}`).toBeTruthy();
      }
    }
  });

  it("keeps the errors namespace identical across languages (no extra, no missing)", () => {
    const expected = [...ALL_ERROR_KEYS].sort();
    for (const locale of LOCALES) {
      const keys = Object.keys(CATALOGUES[locale].errors).sort();
      expect(keys, locale).toEqual(expected);
    }
  });

  it("carries a stable code on domain errors and an English fallback on .message", () => {
    const participant = new ParticipantError("linkExpired");
    expect(participant.code).toBe("linkExpired");
    expect(participant.message).toBe(domainErrorMessage("linkExpired"));
    expect(participant).toBeInstanceOf(Error);

    const signature = new SignatureError("modeNotAllowed", { mode: "pattern" });
    expect(signature.code).toBe("modeNotAllowed");
    expect(signature.params).toEqual({ mode: "pattern" });
    expect(signature.message).toBe(domainErrorMessage("modeNotAllowed"));
  });

  it("renders a code in the active language via the errors namespace", () => {
    const render = (locale: Locale, code: ErrorMessageKey) =>
      createTranslator({
        locale,
        messages: CATALOGUES[locale],
        namespace: "errors",
      })(code);

    // Le même code produit un texte distinct par langue : la traduction passe bien par la locale.
    expect(render("en", "linkExpired")).toBe("This signing link has expired.");
    expect(render("fr", "linkExpired")).toContain("expiré");
    expect(render("pt", "linkExpired")).toContain("expirou");
    expect(render("es", "linkExpired")).toContain("caducado");

    expect(render("fr", "duplicateSigner")).not.toBe(
      render("es", "duplicateSigner"),
    );
  });
});
