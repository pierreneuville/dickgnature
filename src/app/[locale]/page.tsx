import { useTranslations } from "next-intl";
import {
  Badge,
  ButtonLink,
  Card,
  SiteFooter,
  SiteHeader,
  TrustBlock,
} from "@/components/ui";

export default function HomePage() {
  const t = useTranslations("landing");
  const steps = [
    ["01", t("steps.callTitle"), t("steps.callBody")],
    ["02", t("steps.signTitle"), t("steps.signBody")],
    ["03", t("steps.keepTitle"), t("steps.keepBody")],
  ] as const;

  return (
    <div className="landing-page" data-tone="fun">
      <SiteHeader />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <Badge tone="brand">{t("hero.badge")}</Badge>
          <h1 id="hero-title">
            {t("hero.titleLine1")}
            <br />
            <span>{t("hero.titleLine2")}</span>
          </h1>
          <p className="hero__lede">{t("hero.lede")}</p>
          <div className="hero__actions">
            <ButtonLink href="/contracts/new" size="lg">
              {t("hero.ctaPrimary")} <span aria-hidden="true">→</span>
            </ButtonLink>
            <a className="text-link" href="#how-it-works">
              {t("hero.showHow")} <span aria-hidden="true">↓</span>
            </a>
          </div>
          <ul className="hero__proof" aria-label={t("hero.benefitsAria")}>
            <li>
              <span aria-hidden="true">✓</span> {t("hero.benefitNoAccount")}
            </li>
            <li>
              <span aria-hidden="true">✓</span> {t("hero.benefitPhone")}
            </li>
            <li>
              <span aria-hidden="true">✓</span> {t("hero.benefitEu")}
            </li>
          </ul>
        </div>

        <div className="hero__visual" aria-label={t("hero.visualAria")}>
          <div className="hero__orbit hero__orbit--one" aria-hidden="true">
            {t("hero.orbitOne")}
          </div>
          <div className="hero__orbit hero__orbit--two" aria-hidden="true">
            {t("hero.orbitTwo")}
          </div>
          <Card elevated className="contract-preview">
            <div className="contract-preview__topline">
              <span className="contract-preview__eyebrow">
                {t("preview.eyebrow")}
              </span>
              <Badge tone="success">{t("preview.status")}</Badge>
            </div>
            <h2>{t("preview.title")}</h2>
            <p>{t("preview.body")}</p>
            <div className="contract-preview__signatures">
              <div>
                <span>Camille</span>
                <strong>Cam&apos;</strong>
                <small>{t("preview.signedAt", { time: "09:41" })}</small>
              </div>
              <div>
                <span>Noa</span>
                <strong>Noa</strong>
                <small>{t("preview.signedAt", { time: "09:43" })}</small>
              </div>
            </div>
            <div className="contract-preview__footer">
              <span className="pulse-dot" aria-hidden="true" />
              {t("preview.footer")}
            </div>
          </Card>
        </div>
      </section>

      <section className="value-strip" aria-label={t("value.aria")}>
        <p>
          <strong>{t("value.speedNum")}</strong>
          <span>{t("value.speedLabel")}</span>
        </p>
        <p>
          <strong>{t("value.accountsNum")}</strong>
          <span>{t("value.accountsLabel")}</span>
        </p>
        <p>
          <strong>{t("value.priceNum")}</strong>
          <span>{t("value.priceLabel")}</span>
        </p>
      </section>

      <section
        className="steps-section"
        id="how-it-works"
        aria-labelledby="steps-title"
      >
        <div className="section-heading">
          <span className="kicker">{t("steps.kicker")}</span>
          <h2 id="steps-title">{t("steps.title")}</h2>
          <p>{t("steps.intro")}</p>
        </div>
        <ol className="steps-grid">
          {steps.map(([number, title, description]) => (
            <li key={number}>
              <span className="steps-grid__number">{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="proof-section" id="proof" data-tone="serious">
        <div className="section-heading section-heading--left">
          <span className="kicker">{t("proofSection.kicker")}</span>
          <h2>{t("proofSection.title")}</h2>
          <p>{t("proofSection.body")}</p>
        </div>
        <TrustBlock />
      </section>

      <section className="mode-section" aria-labelledby="mode-title">
        <div>
          <span className="kicker">{t("modeSection.kicker")}</span>
          <h2 id="mode-title">{t("modeSection.title")}</h2>
        </div>
        <div className="mode-cards">
          <Card className="mode-card mode-card--fun">
            <Badge tone="brand">{t("modeSection.funBadge")}</Badge>
            <h3>{t("modeSection.funTitle")}</h3>
            <p>{t("modeSection.funBody")}</p>
          </Card>
          <Card className="mode-card mode-card--serious" data-tone="serious">
            <Badge>{t("modeSection.seriousBadge")}</Badge>
            <h3>{t("modeSection.seriousTitle")}</h3>
            <p>{t("modeSection.seriousBody")}</p>
          </Card>
        </div>
      </section>

      <section className="final-cta" aria-labelledby="cta-title">
        <span className="final-cta__spark" aria-hidden="true">
          ✦
        </span>
        <p className="kicker">{t("finalCta.kicker")}</p>
        <h2 id="cta-title">
          {t("finalCta.titleLine1")}
          <br />
          {t("finalCta.titleLine2")}
        </h2>
        <ButtonLink href="/contracts/new" size="lg" variant="secondary">
          {t("finalCta.button")} <span aria-hidden="true">→</span>
        </ButtonLink>
        <small>{t("finalCta.note")}</small>
      </section>

      <SiteFooter />
    </div>
  );
}
