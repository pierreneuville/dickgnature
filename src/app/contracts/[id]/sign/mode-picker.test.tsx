import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModePicker } from "./mode-picker";

describe("ModePicker", () => {
  it("offers the parody motif alongside handwriting in fun tone", () => {
    render(<ModePicker tone="fun" selected="handwritten" onSelect={() => {}} />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getByText("Signature manuscrite")).toBeInTheDocument();
    expect(screen.getByText("Motif")).toBeInTheDocument();
  });

  it("renders nothing in serious tone — no parody imposed on the signer", () => {
    const { container } = render(
      <ModePicker tone="serious" selected="handwritten" onSelect={() => {}} />,
    );
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryByText("Motif")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("emits the selected mode on click", () => {
    const onSelect = vi.fn();
    render(
      <ModePicker tone="fun" selected="handwritten" onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText("Motif"));
    expect(onSelect).toHaveBeenCalledWith("pattern");
  });
});
