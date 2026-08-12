import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("landing page", () => {
  it("anchors the promise and primary conversion path", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /make it official-ish/i, level: 1 }),
    ).toBeInTheDocument();
    const createLinks = screen.getAllByRole("link", { name: /make it official-ish|seal the deal/i });
    expect(createLinks.length).toBeGreaterThanOrEqual(2);
    expect(createLinks.every((link) => link.getAttribute("href") === "/contracts/new")).toBe(true);
    expect(screen.getByText(/under 60 seconds/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no (signer )?account/i).length).toBeGreaterThanOrEqual(2);
  });

  it("states honest SES proof and the pricing model", () => {
    render(<HomePage />);
    const proof = screen.getByRole("heading", { name: /the name is the joke/i }).closest("section");
    expect(proof).not.toBeNull();
    expect(within(proof!).getByLabelText(/SES level/i)).toBeInTheDocument();
    expect(within(proof!).queryByText(/QES/)).not.toBeInTheDocument();
    expect(screen.getByText(/per completed agreement/i)).toBeInTheDocument();
    expect(screen.getByText(/hosted in the EU/i)).toBeInTheDocument();
  });
});
