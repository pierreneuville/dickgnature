import { useTranslations } from "next-intl";
import type { Contract } from "@/lib/contracts";
import { themeFor } from "@/lib/tone";

// Composant purement présentiel : rendu thémé par le ton du contrat.
// En mode "serious", aucune marque ni élément parodique (exigence de spec).
// La marque et l'accent restent portés par tone.ts ; les textes (tagline, disclaimer) sont i18n.
export function ContractView({ contract }: { contract: Contract }) {
  const theme = themeFor(contract.tone);
  const t = useTranslations();

  return (
    <article>
      <p>
        <span className="brand-badge" style={{ background: theme.accent }}>
          {theme.brand}
        </span>
      </p>
      <h1>{contract.title}</h1>
      <p className="tagline">{t(`tone.${contract.tone}Tagline`)}</p>

      <div className="contract-body">{contract.body}</div>

      {theme.showParodyDisclaimer ? (
        <p className="disclaimer" role="note">
          {t("contractView.disclaimer")}
        </p>
      ) : null}
    </article>
  );
}
