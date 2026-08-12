import type { Signature, SignatureMode } from "@/lib/signatures";

const MODE_LABELS: Record<SignatureMode, string> = {
  handwritten: "Handwritten signature",
  pattern: "Signature doodle",
};

// Rendu des signatures persistées d'un contrat. Chaque image PNG (dataURL) est ré-affichée ;
// c'est ce qui prouve la persistance après rechargement (S2).
export function SignaturesList({ signatures }: { signatures: Signature[] }) {
  if (signatures.length === 0) {
    return (
      <p className="signatures-empty">No signatures yet. The pen is waiting.</p>
    );
  }

  return (
    <ul className="signatures-list">
      {signatures.map((signature) => (
        <li key={signature.id} className="signature-item">
          {/* eslint-disable-next-line @next/next/no-img-element -- dataURL PNG, pas d'asset distant à optimiser */}
          <img
            className="signature-image"
            src={signature.image}
            alt={`${MODE_LABELS[signature.mode]} added`}
          />
          <span className="signature-mode">{MODE_LABELS[signature.mode]}</span>
        </li>
      ))}
    </ul>
  );
}
