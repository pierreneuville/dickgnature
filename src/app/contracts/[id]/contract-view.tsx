import type { Contract } from "@/lib/contracts";
import { themeFor } from "@/lib/tone";

// Composant purement présentiel : rendu thémé par le ton du contrat.
// En mode "serious", aucune marque ni élément parodique (exigence de spec).
export function ContractView({ contract }: { contract: Contract }) {
  const theme = themeFor(contract.tone);

  return (
    <article>
      <p>
        <span className="brand-badge" style={{ background: theme.accent }}>
          {theme.brand}
        </span>
      </p>
      <h1>{contract.title}</h1>
      <p className="tagline">{theme.tagline}</p>

      <div className="contract-body">{contract.body}</div>

      {theme.showParodyDisclaimer ? (
        <p className="disclaimer" role="note">
          Parodie — sans valeur légale universelle. Ce document illustre un accord entre amis.
        </p>
      ) : null}
    </article>
  );
}
