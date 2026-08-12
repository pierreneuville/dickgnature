import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EasterEggBanner } from "./easter-egg-banner";

const burstConfetti = vi.fn(() => Promise.resolve());
vi.mock("@/lib/confetti", () => ({
  burstConfetti: () => burstConfetti(),
}));

function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }));
}

afterEach(() => {
  burstConfetti.mockClear();
});

describe("EasterEggBanner", () => {
  it("shows a personalized warm message with a dismiss control", () => {
    setReducedMotion(true);
    render(<EasterEggBanner name="Pierre 184" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(
      screen.getByText(/Pierre 184, you found the easter egg/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Got it, thanks" }),
    ).toBeInTheDocument();
  });

  it("fires confetti when motion is allowed", () => {
    setReducedMotion(false);
    render(<EasterEggBanner name="SSSB" />);
    expect(burstConfetti).toHaveBeenCalledTimes(1);
  });

  it("keeps the message but skips confetti under prefers-reduced-motion", () => {
    setReducedMotion(true);
    render(<EasterEggBanner name="SSSB" />);
    expect(burstConfetti).not.toHaveBeenCalled();
    expect(
      screen.getByText(/SSSB, you found the easter egg/),
    ).toBeInTheDocument();
  });

  it("disappears when dismissed", () => {
    setReducedMotion(true);
    render(<EasterEggBanner name="SSSB" />);
    fireEvent.click(screen.getByRole("button", { name: "Got it, thanks" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
