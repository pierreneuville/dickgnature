import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import { stampsForTone } from "@/lib/signature-stamps";
import { StampGallery } from "./stamp-gallery";

function renderGallery(
  tone: "fun" | "serious",
  overrides: Partial<React.ComponentProps<typeof StampGallery>> = {},
): ReturnType<typeof render> {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <StampGallery
        stamps={stampsForTone(tone)}
        selected={null}
        onPick={() => {}}
        {...overrides}
      />
    </NextIntlClientProvider>,
  );
}

describe("StampGallery", () => {
  it("renders one labelled radio per motif in fun tone", () => {
    renderGallery("fun");
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(6);
    // Chaque vignette porte un SVG étiqueté (accessible au lecteur d'écran).
    expect(screen.getByRole("img", { name: "The classic" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
  });

  it("renders nothing in serious tone — motifs never leak into serious", () => {
    const { container } = renderGallery("serious");
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(container.querySelector(".stamp-gallery")).toBeNull();
  });

  it("calls onPick with the chosen motif when a thumbnail is activated", () => {
    const onPick = vi.fn();
    renderGallery("fun", { onPick });
    fireEvent.click(screen.getByRole("img", { name: "The classic" }));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick.mock.calls[0][0].id).toBe("classic");
  });

  it("marks the selected motif as checked", () => {
    renderGallery("fun", { selected: "grand" });
    const selected = screen.getByRole("img", { name: "The grand" }).closest("button");
    expect(selected).toHaveAttribute("aria-checked", "true");
  });
});
