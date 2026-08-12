import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import { LanguageSwitcher } from "./language-switcher";

// La couche navigation next-intl dépend du contexte App Router (absent en jsdom). On la stub pour
// capturer l'appel router.replace et vérifier que le changement de locale conserve le chemin courant.
const replace = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/contracts/new",
  useRouter: () => ({ replace, push: vi.fn() }),
}));

function renderSwitcher() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LanguageSwitcher />
    </NextIntlClientProvider>,
  );
}

describe("LanguageSwitcher", () => {
  it("offers every supported locale with native labels", () => {
    renderSwitcher();
    const select = screen.getByLabelText(messages.common.language) as HTMLSelectElement;
    expect(select.value).toBe("en");
    const labels = Array.from(select.options).map((option) => option.textContent);
    expect(labels).toEqual(["English", "Français", "Português", "Español"]);
  });

  it("switches locale while preserving the current path", () => {
    renderSwitcher();
    fireEvent.change(screen.getByLabelText(messages.common.language), {
      target: { value: "fr" },
    });
    expect(replace).toHaveBeenCalledWith("/contracts/new", { locale: "fr" });
  });
});
