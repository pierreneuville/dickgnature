import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import HomePage from "./page";

// Couche navigation stubée (pas de contexte App Router en jsdom) — voir ui.test.tsx.
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: unknown; children?: ReactNode }) => (
    <a href={String(href)} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

function renderHome() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <HomePage />
    </NextIntlClientProvider>,
  );
}

describe("landing page", () => {
  it("anchors the promise and primary conversion path", () => {
    renderHome();
    expect(
      screen.getByRole("heading", { name: /make it official-ish/i, level: 1 }),
    ).toBeInTheDocument();
    const createLinks = screen.getAllByRole("link", { name: /make it official-ish|seal the deal/i });
    expect(createLinks.length).toBeGreaterThanOrEqual(2);
    expect(createLinks.every((link) => link.getAttribute("href") === "/contracts/new")).toBe(true);
    expect(screen.getByText(/under 60 seconds/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no (signer )?account/i).length).toBeGreaterThanOrEqual(2);
  });

  it("states honest SES proof and the pricing model", () => {
    renderHome();
    const proof = screen.getByRole("heading", { name: /the name is the joke/i }).closest("section");
    expect(proof).not.toBeNull();
    expect(within(proof!).getByLabelText(/SES level/i)).toBeInTheDocument();
    expect(within(proof!).queryByText(/QES/)).not.toBeInTheDocument();
    expect(screen.getByText(/per completed agreement/i)).toBeInTheDocument();
    expect(screen.getByText(/hosted in the EU/i)).toBeInTheDocument();
  });
});
