import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContractForm } from "./contract-form";

describe("ContractForm templates", () => {
  it("offers all seven templates and fills the editable contract", () => {
    render(<ContractForm />);

    const picker = screen.getByLabelText("Type d’accord");
    expect(picker.querySelectorAll("option")).toHaveLength(8);

    fireEvent.change(picker, { target: { value: "item-loan" } });

    expect(screen.getByLabelText("Titre")).toHaveValue("Prêt d’objet");
    expect(screen.getByLabelText("Ton")).toHaveValue("fun");
    expect(screen.getByLabelText<HTMLTextAreaElement>("Contrat").value).toContain(
      "[Objet prêté]",
    );
    expect(screen.getByText(/prêter un objet sans perdre de vue/i)).toBeInTheDocument();
  });

  it("renders variable edits and switches to the serious version", () => {
    render(<ContractForm />);

    fireEvent.change(screen.getByLabelText("Type d’accord"), {
      target: { value: "bet" },
    });
    fireEvent.change(screen.getByLabelText("Personne qui lance le défi"), {
      target: { value: "Camille" },
    });
    fireEvent.change(screen.getByLabelText("Personne qui relève le défi"), {
      target: { value: "Noa" },
    });

    expect(screen.getByLabelText<HTMLTextAreaElement>("Contrat").value).toContain(
      "Camille défie officiellement Noa",
    );

    fireEvent.change(screen.getByLabelText("Ton"), {
      target: { value: "serious" },
    });

    const body = screen.getByLabelText<HTMLTextAreaElement>("Contrat").value;
    expect(body).toContain("Camille et Noa conviennent");
    expect(body).not.toContain("panache recommandé");
  });
});
