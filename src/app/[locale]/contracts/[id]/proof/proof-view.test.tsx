import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "@/messages/en.json";
import type { ContractProof } from "@/lib/signed-document";
import { ProofView } from "./proof-view";

function renderProof(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

function proof(documentHash: string | null = "a".repeat(64)): ContractProof {
  return {
    id: "c1",
    title: "Prêt de vélo",
    body: "Sam rend le vélo vendredi.",
    tone: "serious",
    locale: "fr",
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
    renderProof(<ProofView proof={proof()} />);

    expect(
      screen.getByRole("heading", { name: "What makes this PDF useful proof" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/SES · Simple electronic signature/)).toBeInTheDocument();
    expect(screen.getByText("Explicit consent")).toBeInTheDocument();
    expect(screen.getByText("UTC timestamps")).toBeInTheDocument();
    expect(screen.getByText("Document fingerprint")).toBeInTheDocument();
    expect(screen.getAllByText("Event log")).toHaveLength(2);
    expect(screen.getByText("a".repeat(64))).toBeInTheDocument();
    expect(screen.getByText("sam@example.fr")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/QES/i);
  });

  it("explains that the definitive hash is pending before completion", () => {
    renderProof(<ProofView proof={proof(null)} />);
    expect(screen.getByRole("status")).toHaveTextContent(/once everyone has signed/i);
  });
});
