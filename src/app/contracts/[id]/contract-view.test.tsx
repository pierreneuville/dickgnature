import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Contract } from "@/lib/contracts";
import { ContractView } from "./contract-view";

function contract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: "c1",
    title: "Reconnaissance de dette",
    body: "Alex doit 20 € à Sam.",
    tone: "fun",
    status: "draft",
    documentHash: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("ContractView", () => {
  it("renders title and body", () => {
    render(<ContractView contract={contract()} />);
    expect(screen.getByRole("heading", { name: "Reconnaissance de dette" })).toBeInTheDocument();
    expect(screen.getByText("Alex doit 20 € à Sam.")).toBeInTheDocument();
  });

  it("shows the parody brand and disclaimer in fun mode", () => {
    render(<ContractView contract={contract({ tone: "fun" })} />);
    expect(screen.getByText("dickgnature")).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(/playful agreement/i);
  });

  it("stays neutral in serious mode: no parody brand, no disclaimer", () => {
    render(<ContractView contract={contract({ tone: "serious" })} />);
    expect(screen.queryByText(/dickgnature/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });
});
