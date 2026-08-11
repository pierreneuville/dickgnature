import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("landing page", () => {
  it("anchors the promise and primary conversion path", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /un accord carré/i, level: 1 }),
    ).toBeInTheDocument();
    const createLinks = screen.getAllByRole("link", { name: /créer.*contrat/i });
    expect(createLinks.length).toBeGreaterThanOrEqual(2);
    expect(createLinks.every((link) => link.getAttribute("href") === "/contracts/new")).toBe(true);
    expect(screen.getByText(/moins de 60 secondes/i)).toBeInTheDocument();
    expect(screen.getAllByText(/sans compte/i).length).toBeGreaterThanOrEqual(2);
  });

  it("states honest SES proof and the pricing model", () => {
    render(<HomePage />);
    const proof = screen.getByRole("heading", { name: /la blague est dans le nom/i }).closest("section");
    expect(proof).not.toBeNull();
    expect(within(proof!).getByLabelText(/niveau SES/i)).toBeInTheDocument();
    expect(within(proof!).queryByText(/QES/)).not.toBeInTheDocument();
    expect(screen.getByText(/par contrat finalisé/i)).toBeInTheDocument();
    expect(screen.getByText(/hébergé en UE/i)).toBeInTheDocument();
  });
});
