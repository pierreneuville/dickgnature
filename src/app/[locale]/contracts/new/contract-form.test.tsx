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
