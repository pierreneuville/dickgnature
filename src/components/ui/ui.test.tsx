import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  InputField,
  SelectField,
  SesBadge,
  SiteFooter,
  SiteHeader,
  TextareaField,
  Toast,
  ToneSurface,
  TrustBlock,
} from ".";

// Les liens conscients de la locale et le sélecteur de langue s'appuient sur next/navigation
// (contexte App Router absent en jsdom). On stub la couche navigation : ces tests vérifient le
// rendu présentiel (texte, rôles, href), pas le routing i18n lui-même.
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: unknown; children?: ReactNode }) => (
    <a href={String(href)} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

function renderIntl(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("UI primitives", () => {
  it("renders button variants and handles interaction", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Valider</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("renders link, badge and semantic card", () => {
    render(
      <Card as="article" elevated>
        <Badge tone="brand">Nouveau</Badge>
        <ButtonLink href="/go" variant="quiet" size="sm">Continuer</ButtonLink>
      </Card>,
    );
    expect(screen.getByRole("article")).toHaveClass("ui-card--elevated");
    expect(screen.getByRole("link", { name: "Continuer" })).toHaveAttribute("href", "/go");
  });

  it("associates fields with labels, hints and errors", () => {
    render(
      <>
        <InputField id="email" label="Email" hint="Adresse du signataire" error="Invalide" />
        <TextareaField id="body" label="Accord" />
        <SelectField id="tone" label="Ton"><option>Fun</option></SelectField>
      </>,
    );
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Adresse du signataire Invalide");
    expect(screen.getByRole("alert")).toHaveTextContent("Invalide");
    expect(screen.getByLabelText("Accord")).not.toHaveAttribute("aria-describedby");
    expect(screen.getByLabelText("Ton")).toBeInTheDocument();
  });

  it("renders empty state with and without an action", () => {
    const { rerender } = render(<EmptyState title="Rien ici" description="Commencez maintenant." />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    rerender(
      <EmptyState
        title="Rien ici"
        description="Commencez maintenant."
        action={{ href: "/new", label: "Créer" }}
      />,
    );
    expect(screen.getByRole("link", { name: "Créer" })).toHaveAttribute("href", "/new");
  });

  it("uses the appropriate live region for feedback", () => {
    const { rerender } = render(<Toast>Enregistré</Toast>);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    rerender(<Toast kind="error">Échec</Toast>);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
  });

  it("renders shells, tones and a strictly SES trust block", () => {
    renderIntl(
      <ToneSurface tone="serious">
        <SiteHeader />
        <TrustBlock />
        <SesBadge />
        <SiteFooter />
      </ToneSurface>,
    );
    expect(screen.getByText("Proof you can actually understand.")).toBeInTheDocument();
    expect(screen.getByText("Fingerprint")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/SES level/i)).toHaveLength(2);
    expect(screen.queryByText(/QES/)).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /dickgnature, home/i })).toHaveLength(2);
  });

  it("keeps the language switcher outside the mobile-collapsed nav so it stays reachable", () => {
    // Régression du bug « bloqué en FR sur mobile » : la nav (.site-header__nav) est masquée en
    // dessous de 700px. Si le sélecteur y vivait, un mobile détecté FR n'aurait aucun moyen de
    // changer de langue. Il doit donc rester hors de la nav, dans .site-header__actions.
    const { container } = renderIntl(<SiteHeader />);
    const select = screen.getByLabelText(messages.common.language);
    expect(select).toBeInTheDocument();
    const nav = container.querySelector(".site-header__nav");
    expect(nav).not.toBeNull();
    expect(nav?.contains(select)).toBe(false);
    expect(container.querySelector(".site-header__actions")?.contains(select)).toBe(true);
  });
});
