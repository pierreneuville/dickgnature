import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContractForm } from "./contract-form";

describe("ContractForm templates", () => {
  it("offers all seven templates and fills the editable contract", () => {
    render(<ContractForm />);

    const picker = screen.getByLabelText("Agreement type");
    expect(picker.querySelectorAll("option")).toHaveLength(8);

    fireEvent.change(picker, { target: { value: "item-loan" } });

    expect(screen.getByLabelText("Title")).toHaveValue("Borrowed item");
    expect(screen.getByLabelText("Tone")).toHaveValue("fun");
    expect(screen.getByLabelText<HTMLTextAreaElement>("Agreement").value).toContain(
      "[Borrowed item]",
    );
    expect(screen.getByText(/lend something without losing track/i)).toBeInTheDocument();
  });

  it("renders variable edits and switches to the serious version", () => {
    render(<ContractForm />);

    fireEvent.change(screen.getByLabelText("Agreement type"), {
      target: { value: "bet" },
    });
    fireEvent.change(screen.getByLabelText("Person calling the dare"), {
      target: { value: "Camille" },
    });
    fireEvent.change(screen.getByLabelText("Person taking it on"), {
      target: { value: "Noa" },
    });

    expect(screen.getByLabelText<HTMLTextAreaElement>("Agreement").value).toContain(
      "Camille officially dares Noa",
    );

    fireEvent.change(screen.getByLabelText("Tone"), {
      target: { value: "serious" },
    });

    const body = screen.getByLabelText<HTMLTextAreaElement>("Agreement").value;
    expect(body).toContain("Camille and Noa agree");
    expect(body).not.toContain("dramatic flair encouraged");
  });
});
