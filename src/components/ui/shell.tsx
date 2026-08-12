import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "./button";

export function BrandMark() {
  return (
    <Link className="brand-mark" href="/" aria-label="dickgnature, home">
      <span className="brand-mark__glyph" aria-hidden="true">d</span>
      <span>dickgnature</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <BrandMark />
      <nav className="site-header__nav" aria-label="Main navigation">
        <a href="#how-it-works">How it works</a>
        <a href="#proof">The proof</a>
        <ButtonLink href="/contracts/new" size="sm">
          Make an agreement
        </ButtonLink>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <BrandMark />
      <p>Simple agreements, readable proof, and absolutely no suit required.</p>
      <p className="site-footer__fineprint">
        Honest parody · Simple electronic signature (SES) · EU hosting
      </p>
    </footer>
  );
}

export function ToneSurface({
  tone,
  children,
  className,
}: {
  tone: "fun" | "serious";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={["tone-surface", className].filter(Boolean).join(" ")}
      data-tone={tone}
    >
      {children}
    </div>
  );
}
