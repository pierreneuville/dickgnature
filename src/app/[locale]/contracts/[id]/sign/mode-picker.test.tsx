import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import { ModePicker } from "./mode-picker";

function renderPicker(props: ComponentProps<typeof ModePicker>): ReturnType<typeof render> {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ModePicker {...props} />
    </NextIntlClientProvider>,
  );
}

describe("ModePicker", () => {
  it("offers the parody motif alongside handwriting in fun tone", () => {
    renderPicker({ tone: "fun", selected: "handwritten", onSelect: () => {} });
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getByText("Draw it yourself")).toBeInTheDocument();
    expect(screen.getByText("Use the cheeky stamp")).toBeInTheDocument();
  });

  it("renders nothing in serious tone — no parody imposed on the signer", () => {
    const { container } = renderPicker({
      tone: "serious",
      selected: "handwritten",
      onSelect: () => {},
    });
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryByText("Use the cheeky stamp")).not.toBeInTheDocument();
    // Le provider i18n reste dans le DOM ; le picker lui-même ne rend rien en serious.
    expect(container.querySelector(".mode-picker")).toBeNull();
  });

  it("emits the selected mode on click", () => {
    const onSelect = vi.fn();
    renderPicker({ tone: "fun", selected: "handwritten", onSelect });
    fireEvent.click(screen.getByText("Use the cheeky stamp"));
    expect(onSelect).toHaveBeenCalledWith("pattern");
  });
});
