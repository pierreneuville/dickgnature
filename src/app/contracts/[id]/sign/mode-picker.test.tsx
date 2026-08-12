import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModePicker } from "./mode-picker";

describe("ModePicker", () => {
  it("offers the parody motif alongside handwriting in fun tone", () => {
    render(<ModePicker tone="fun" selected="handwritten" onSelect={() => {}} />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getByText("Draw it yourself")).toBeInTheDocument();
    expect(screen.getByText("Use the cheeky stamp")).toBeInTheDocument();
  });

  it("renders nothing in serious tone — no parody imposed on the signer", () => {
    const { container } = render(
      <ModePicker tone="serious" selected="handwritten" onSelect={() => {}} />,
    );
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryByText("Use the cheeky stamp")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("emits the selected mode on click", () => {
    const onSelect = vi.fn();
    render(
      <ModePicker tone="fun" selected="handwritten" onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText("Use the cheeky stamp"));
    expect(onSelect).toHaveBeenCalledWith("pattern");
  });
});
