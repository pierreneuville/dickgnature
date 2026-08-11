import { SesBadge } from "./badge";
import { Card } from "./card";

const proofPoints = [
  ["Consentement", "Le geste de signature et l’accord sont consignés."],
  ["Horodatage", "Chaque événement garde sa date et son heure."],
  ["Empreinte", "Le document est lié à une empreinte SHA-256."],
  ["Journal", "La chronologie reste lisible dans le dossier de preuve."],
] as const;

export function TrustBlock() {
  return (
    <Card as="section" className="trust-block" aria-labelledby="trust-title">
      <div className="trust-block__intro">
        <SesBadge />
        <h2 id="trust-title">Une preuve compréhensible, sans poudre aux yeux.</h2>
        <p>
          Une signature électronique simple pensée pour les accords du quotidien.
          Nous expliquons ce qui est prouvé — et ce qui ne l’est pas.
        </p>
      </div>
      <ul className="trust-block__points">
        {proofPoints.map(([title, description]) => (
          <li key={title}>
            <span className="trust-block__check" aria-hidden="true">✓</span>
            <span><strong>{title}</strong>{description}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
