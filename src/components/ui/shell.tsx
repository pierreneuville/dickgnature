import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "./button";

export function BrandMark() {
  return (
    <Link className="brand-mark" href="/" aria-label="dickgnature, accueil">
      <span className="brand-mark__glyph" aria-hidden="true">d</span>
      <span>dickgnature</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <BrandMark />
      <nav className="site-header__nav" aria-label="Navigation principale">
        <a href="#comment-ca-marche">Comment ça marche</a>
        <a href="#preuve">La preuve</a>
        <ButtonLink href="/contracts/new" size="sm">
          Créer un contrat
        </ButtonLink>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <BrandMark />
      <p>Des accords simples, une preuve lisible, zéro costume-cravate requis.</p>
      <p className="site-footer__fineprint">
        Parodie honnête · Signature électronique simple (SES) · Hébergement UE
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
