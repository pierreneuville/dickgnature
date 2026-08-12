import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import pt from "@/messages/pt.json";
import es from "@/messages/es.json";
import {
  buildContractTemplate,
  CONTRACT_TEMPLATE_IDS,
  CONTRACT_TEMPLATE_SHAPES,
  type ContractTemplateMessages,
  getContractTemplateShape,
  renderContractTemplate,
} from "./contract-templates";

const CATALOGUES = { en, fr, pt, es } as const;
type Locale = keyof typeof CATALOGUES;

function localize(locale: Locale, id: string) {
  const shape = getContractTemplateShape(id);
  if (!shape) throw new Error(`unknown template ${id}`);
  const messages = CATALOGUES[locale].templates as Record<string, ContractTemplateMessages>;
  return buildContractTemplate(shape, messages[shape.id]);
}

describe("contract templates", () => {
  it("keeps the structural catalogue independent of language", () => {
    expect(CONTRACT_TEMPLATE_SHAPES.map(({ id }) => id)).toEqual(CONTRACT_TEMPLATE_IDS);
    expect(CONTRACT_TEMPLATE_SHAPES).toHaveLength(7);

    for (const shape of CONTRACT_TEMPLATE_SHAPES) {
      expect(shape.variableKeys.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("renders every occurrence of supplied variables (EN)", () => {
    const template = localize("en", "bet");

    const rendered = renderContractTemplate(template, "fun", {
      challenger: "  Camille  ",
      opponent: "Noa",
      challenge: "do 30 push-ups",
      deadline: "Saturday",
      stake: "a pizza",
    });

    expect(rendered).toEqual({
      title: "Bet or dare",
      tone: "fun",
      body: expect.stringContaining("Camille officially dares Noa"),
    });
    expect(rendered.body).toContain("do 30 push-ups");
    expect(rendered.body).toContain("a pizza");
    expect(rendered.body).not.toMatch(/{{|}}/);
  });

  it("keeps visible labels for variables that still need an answer (EN)", () => {
    const template = localize("en", "iou");

    const rendered = renderContractTemplate(template, "serious", {
      amount: "85 €",
    });

    expect(rendered.body).toContain("85 €");
    expect(rendered.body).toContain("[Person paying back]");
    expect(rendered.body).toContain("[Payback date]");
    expect(rendered.body).not.toMatch(/{{|}}/);
  });

  it("returns no shape for an unknown identifier", () => {
    expect(getContractTemplateShape("not-a-template")).toBeUndefined();
  });
});

describe("contract templates — translations", () => {
  const locales: Locale[] = ["en", "fr", "pt", "es"];

  it("provides all four languages for every template, both registers", () => {
    for (const locale of locales) {
      for (const shape of CONTRACT_TEMPLATE_SHAPES) {
        const template = localize(locale, shape.id);

        expect(template.title).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.variables).toHaveLength(shape.variableKeys.length);
        for (const variable of template.variables) {
          expect(variable.label).toBeTruthy();
          expect(variable.placeholder).toBeTruthy();
        }
        expect(template.body.fun).toBeTruthy();
        expect(template.body.serious).toBeTruthy();
        expect(template.body.fun).not.toBe(template.body.serious);
      }
    }
  });

  it("interpolates variables in the active language and adapts the register", () => {
    const values = {
      challenger: "Camille",
      opponent: "Noa",
      challenge: "courir 10 km",
      deadline: "samedi",
      stake: "un brunch",
    };

    const fun = renderContractTemplate(localize("fr", "bet"), "fun", values);
    expect(fun.body).toContain("Camille met officiellement Noa au défi de courir 10 km");
    expect(fun.body).not.toMatch(/{{|}}/);

    const serious = renderContractTemplate(localize("fr", "bet"), "serious", values);
    expect(serious.body).toContain("Camille et Noa conviennent du défi suivant");
    expect(serious.body).not.toContain("Mauvais perdant interdit");

    // La langue teinte aussi les libellés de secours des variables non renseignées.
    const es = renderContractTemplate(localize("es", "iou"), "serious", { amount: "85 €" });
    expect(es.body).toContain("85 €");
    expect(es.body).toContain("[Persona que devuelve]");
  });
});
