import { describe, expect, it } from "vitest";
import {
  CONTRACT_TEMPLATE_IDS,
  CONTRACT_TEMPLATES,
  getContractTemplate,
  renderContractTemplate,
} from "./contract-templates";

describe("contract templates", () => {
  it("provides the complete catalogue with both writing registers", () => {
    expect(CONTRACT_TEMPLATES.map(({ id }) => id)).toEqual(CONTRACT_TEMPLATE_IDS);
    expect(CONTRACT_TEMPLATES).toHaveLength(7);

    for (const template of CONTRACT_TEMPLATES) {
      expect(template.title).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.variables.length).toBeGreaterThanOrEqual(4);
      expect(template.body.fun).toBeTruthy();
      expect(template.body.serious).toBeTruthy();
      expect(template.body.fun).not.toBe(template.body.serious);
    }
  });

  it("renders every occurrence of supplied variables", () => {
    const template = getContractTemplate("bet");
    expect(template).toBeDefined();

    const rendered = renderContractTemplate(template!, "fun", {
      challenger: "  Camille  ",
      opponent: "Noa",
      challenge: "faire 30 pompes",
      deadline: "samedi",
      stake: "une pizza",
    });

    expect(rendered).toEqual({
      title: "Pari ou défi",
      tone: "fun",
      body: expect.stringContaining("Camille défie officiellement Noa"),
    });
    expect(rendered.body).toContain("faire 30 pompes");
    expect(rendered.body).toContain("une pizza");
    expect(rendered.body).not.toMatch(/{{|}}/);
  });

  it("keeps visible labels for variables that still need an answer", () => {
    const template = getContractTemplate("iou");
    expect(template).toBeDefined();

    const rendered = renderContractTemplate(template!, "serious", {
      amount: "85 €",
    });

    expect(rendered.body).toContain("85 €");
    expect(rendered.body).toContain("[Personne qui rembourse]");
    expect(rendered.body).toContain("[Date de remboursement]");
    expect(rendered.body).not.toMatch(/{{|}}/);
  });

  it("returns no template for an unknown identifier", () => {
    expect(getContractTemplate("not-a-template")).toBeUndefined();
  });
});
