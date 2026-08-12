import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "@/messages/en.json";
import type { Signature } from "@/lib/signatures";
import { SignaturesList } from "./signatures-list";

function renderList(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

function sig(overrides: Partial<Signature> = {}): Signature {
  return {
    id: "s1",
    contractId: "c1",
    mode: "handwritten",
    image: PNG,
    signedAt: new Date(),
    ...overrides,
  };
}

describe("SignaturesList", () => {
  it("shows an empty state when there is no signature", () => {
    renderList(<SignaturesList signatures={[]} />);
    expect(screen.getByText(/no signatures yet/i)).toBeInTheDocument();
  });

  it("re-displays each persisted signature image with its mode", () => {
    renderList(
      <SignaturesList
        signatures={[sig(), sig({ id: "s2", mode: "pattern" })]}
      />,
    );
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", PNG);
    expect(screen.getByText("Signature doodle")).toBeInTheDocument();
    expect(screen.getByText("Handwritten signature")).toBeInTheDocument();
  });
});
