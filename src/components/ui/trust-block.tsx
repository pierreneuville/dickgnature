import { useTranslations } from "next-intl";
import { SesBadge } from "./badge";
import { Card } from "./card";

export function TrustBlock() {
  const t = useTranslations("trust");
  const proofPoints = [
    [t("consentTitle"), t("consentBody")],
    [t("timestampsTitle"), t("timestampsBody")],
    [t("fingerprintTitle"), t("fingerprintBody")],
    [t("auditTitle"), t("auditBody")],
  ] as const;

  return (
    <Card as="section" className="trust-block" aria-labelledby="trust-title">
      <div className="trust-block__intro">
        <SesBadge />
        <h2 id="trust-title">{t("title")}</h2>
        <p>{t("intro")}</p>
      </div>
      <ul className="trust-block__points">
        {proofPoints.map(([title, description]) => (
          <li key={title}>
            <span className="trust-block__check" aria-hidden="true">
              ✓
            </span>
            <span>
              <strong>{title}</strong>
              {description}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
