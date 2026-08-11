import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ContractProof } from "@/lib/signed-document";
import { ProofView } from "./proof-view";

function proof(documentHash: string | null = "a".repeat(64)): ContractProof {
  return {
    id: "c1",
    title: "Prêt de vélo",
    body: "Sam rend le vélo vendredi.",
    tone: "serious",
    status: documentHash ? "completed" : "sent",
    createdAt: new Date("2026-08-11T10:00:00Z"),
    completedAt: documentHash ? new Date("2026-08-11T10:05:00Z") : null,
    documentHash,
    participants: [],
    auditEvents: [
      {
        id: "e1",
        type: "CONTRACT_CREATED",
        email: null,
        occurredAt: new Date("2026-08-11T10:00:00Z"),
      },
      {
        id: "e2",
        type: "DOCUMENT_SIGNED",
        email: "sam@example.fr",
        occurredAt: new Date("2026-08-11T10:05:00Z"),
      },
    ],
  };
}

describe("ProofView", () => {
  it("explains every proof pillar with a clear SES badge and audit log", () => {
    render(<ProofView proof={proof()} />);

    expect(
      screen.getByRole("heading", { name: "Pourquoi ce PDF est probant" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/SES · Signature électronique simple/)).toBeInTheDocument();
    expect(screen.getByText("Consentement explicite")).toBeInTheDocument();
    expect(screen.getByText("Horodatage UTC")).toBeInTheDocument();
    expect(screen.getByText("Empreinte du document")).toBeInTheDocument();
    expect(screen.getAllByText("Journal d'événements")).toHaveLength(2);
    expect(screen.getByText("a".repeat(64))).toBeInTheDocument();
    expect(screen.getByText("sam@example.fr")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/QES/i);
  });

  it("explains that the definitive hash is pending before completion", () => {
    render(<ProofView proof={proof(null)} />);
    expect(screen.getByRole("status")).toHaveTextContent(/tous les participants/i);
  });
});
