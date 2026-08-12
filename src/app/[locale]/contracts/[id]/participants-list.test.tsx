import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import {
  ParticipantsList,
  type ParticipantRow,
} from "./participants-list";

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

function renderList(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

function row(overrides: Partial<ParticipantRow> = {}): ParticipantRow {
  return {
    id: "p1",
    name: "Kevin",
    email: "kevin@example.fr",
    token: "tok-1",
    linkState: "open",
    ...overrides,
  };
}

describe("ParticipantsList", () => {
  it("shows the contract status and an empty state with no participant", () => {
    renderList(<ParticipantsList participants={[]} status="draft" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText(/quiet in here/i)).toBeInTheDocument();
  });

  it("renders each participant with its state and a signing link only while open", () => {
    renderList(
      <ParticipantsList
        status="partially_signed"
        participants={[
          row(),
          row({ id: "p2", name: "Sam", token: "tok-2", linkState: "signed" }),
        ]}
      />,
    );

    expect(screen.getByText("Partly signed")).toBeInTheDocument();
    expect(screen.getByText("Kevin")).toBeInTheDocument();
    expect(screen.getByText("Sam")).toBeInTheDocument();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
    expect(screen.getByText("Signed")).toBeInTheDocument();

    // Un seul lien de signature : celui du participant en attente (usage unique respecté à l'affichage).
    const links = screen.getAllByRole("link", { name: /open signing link/i });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/sign/tok-1");
    expect(screen.getByText("Kevin").closest(".participant-identity")).not.toBeNull();
    expect(links[0].closest(".participant-actions")).not.toBeNull();
    expect(screen.getByText("Sam").closest("li")?.querySelector(".participant-actions"))
      .toBeNull();
  });
});
