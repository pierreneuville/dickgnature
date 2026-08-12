import { useTranslations } from "next-intl";
import type { Signature } from "@/lib/signatures";

// Rendu des signatures persistées d'un contrat. Chaque image PNG (dataURL) est ré-affichée ;
// c'est ce qui prouve la persistance après rechargement (S2).
export function SignaturesList({ signatures }: { signatures: Signature[] }) {
  const t = useTranslations();

  if (signatures.length === 0) {
    return <p className="signatures-empty">{t("signaturesList.empty")}</p>;
  }

  return (
    <ul className="signatures-list">
      {signatures.map((signature) => {
        const modeLabel = t(`signatureMode.${signature.mode}`);
        return (
          <li key={signature.id} className="signature-item">
            {/* eslint-disable-next-line @next/next/no-img-element -- dataURL PNG, pas d'asset distant à optimiser */}
            <img
              className="signature-image"
              src={signature.image}
              alt={t("signatureMode.addedAlt", { mode: modeLabel })}
            />
            <span className="signature-mode">{modeLabel}</span>
          </li>
        );
      })}
    </ul>
  );
}
