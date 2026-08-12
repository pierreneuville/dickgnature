import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

function rule(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  expect(match, `Expected a CSS rule for ${selector}`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("mobile layout guardrails", () => {
  it("keeps the page and main content inside the viewport", () => {
    expect(rule("html")).toContain("overflow-x: clip");
    expect(rule("body")).toContain("overflow-x: clip");
    expect(rule(".container")).toContain("width: min(calc(100% - 2rem), 1180px)");
    expect(css).toMatch(/main,[\s\S]*?\.ui-field\s*\{[\s\S]*?min-width:\s*0/);
  });

  it("contains replaced content and long user-provided copy", () => {
    expect(css).toMatch(/img,\s*\nsvg,\s*\ncanvas\s*\{\s*max-width:\s*100%/);
    expect(rule(".contract-body")).toContain("overflow-wrap: anywhere");
    expect(rule(".participant-email")).toContain("overflow-wrap: anywhere");
    expect(rule(".participant-row input")).toContain("min-width: 0");
  });

  it("preserves a 44px floor for compact and legacy controls", () => {
    expect(rule(".ui-button--sm")).toContain("min-height: 2.75rem");
    expect(rule("button.ghost")).toContain("min-height: 2.75rem");
    expect(rule(".participant-link")).toContain("min-height: 2.75rem");
  });

  it("gives participant identity and actions a mobile-first card hierarchy", () => {
    expect(rule(".participant-item")).toContain(
      "grid-template-columns: minmax(0, 1fr) auto",
    );
    expect(rule(".participant-actions")).toContain("grid-column: 1 / -1");
    expect(rule(".participant-link")).toContain("width: 100%");
    expect(rule(".participant-row")).toContain(
      "grid-template-columns: minmax(0, 1fr)",
    );
  });

  it("uses the current design tokens on legacy surfaces", () => {
    expect(css).not.toMatch(/var\(--(?:border|muted|fg)\)/);
  });
});
