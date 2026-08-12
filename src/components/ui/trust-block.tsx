import { SesBadge } from "./badge";
import { Card } from "./card";

const proofPoints = [
  ["Consent", "The signature action and agreement are recorded."],
  ["Timestamps", "Every event keeps its date and time."],
  ["Fingerprint", "The document is bound to a SHA-256 fingerprint."],
  ["Audit trail", "The full timeline stays readable in the proof file."],
] as const;

export function TrustBlock() {
  return (
    <Card as="section" className="trust-block" aria-labelledby="trust-title">
      <div className="trust-block__intro">
        <SesBadge />
        <h2 id="trust-title">Proof you can actually understand.</h2>
        <p>
          A simple electronic signature for everyday agreements. We tell you
          what it proves — and what it doesn&apos;t.
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
