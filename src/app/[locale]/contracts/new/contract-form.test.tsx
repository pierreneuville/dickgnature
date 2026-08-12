import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import { ContractForm } from "./contract-form";

// Le barrel @/components/ui tire la couche navigation (LanguageSwitcher) — stubée en jsdom.
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: unknown; children?: ReactNode }) => (
    <a href={String(href)} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

// Le bandeau easter egg tire canvas-confetti (pas de canvas 2D en jsdom) : on stub l'effet.
vi.mock("@/lib/confetti", () => ({ burstConfetti: () => Promise.resolve() }));

function renderForm(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("ContractForm templates", () => {
  it("offers all seven templates and fills the editable contract", () => {
    renderForm(<ContractForm />);

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
    renderForm(<ContractForm />);

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

describe("ContractForm easter egg", () => {
  const eggText = /you found the easter egg/i;

  it("winks when a reserved name is typed into a template party field", () => {
    renderForm(<ContractForm />);
    expect(screen.queryByText(eggText)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Agreement type"), {
      target: { value: "bet" },
    });
    fireEvent.change(screen.getByLabelText("Person calling the dare"), {
      target: { value: "Racoon" },
    });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Racoon, you found the easter egg/)).toBeInTheDocument();
  });

  it("winks when a reserved name is typed into the free-form title", () => {
    renderForm(<ContractForm />);
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Pierre 184" },
    });
    expect(screen.getByText(/Pierre 184, you found the easter egg/)).toBeInTheDocument();
  });

  it("ignores case and surrounding whitespace", () => {
    renderForm(<ContractForm />);
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "  sssb  " },
    });
    expect(screen.getByText(eggText)).toBeInTheDocument();
  });

  it("stays silent for names that are not reserved", () => {
    renderForm(<ContractForm />);
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Camille" },
    });
    expect(screen.queryByText(eggText)).not.toBeInTheDocument();
  });
});
