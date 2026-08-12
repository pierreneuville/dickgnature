import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
    render(
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
});
