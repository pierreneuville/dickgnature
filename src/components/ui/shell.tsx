import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ButtonLink } from "./button";
import { LanguageSwitcher } from "./language-switcher";

export function BrandMark() {
  const t = useTranslations("common.header");
  return (
    <Link className="brand-mark" href="/" aria-label={t("homeAria")}>
      <span className="brand-mark__glyph" aria-hidden="true">
        d
      </span>
      <span>dickgnature</span>
    </Link>
  );
}

export function SiteHeader() {
  const t = useTranslations("common.header");
  return (
    <header className="site-header">
      <BrandMark />
      <nav className="site-header__nav" aria-label={t("navAria")}>
        <a href="#how-it-works">{t("howItWorks")}</a>
        <a href="#proof">{t("theProof")}</a>
        <ButtonLink href="/contracts/new" size="sm">
          {t("makeAgreement")}
        </ButtonLink>
        <LanguageSwitcher />
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const t = useTranslations("common.footer");
  return (
    <footer className="site-footer">
      <BrandMark />
      <p>{t("tagline")}</p>
      <p className="site-footer__fineprint">{t("fineprint")}</p>
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
