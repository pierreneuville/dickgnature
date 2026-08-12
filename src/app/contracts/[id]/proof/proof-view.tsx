import { auditEventLabel, formatUtc } from "@/lib/audit";
import type { ContractProof } from "@/lib/signed-document";

export function ProofView({ proof }: { proof: ContractProof }) {
  return (
    <article className="proof-page">
      <p className="ses-badge">SES · Simple electronic signature</p>
      <h1>What makes this PDF useful proof</h1>
      <p className="proof-intro">
        This trail documents a simple electronic agreement without claiming
        the signature is a universal replacement for a handwritten one.
      </p>

      <dl className="proof-pillars">
        <div>
          <dt>Explicit consent</dt>
          <dd>
            Every signer ticks a dedicated box first. That consent is timestamped
            and tied to the email address they provided.
          </dd>
        </div>
        <div>
          <dt>UTC timestamps</dt>
          <dd>
            Creation, invitation, opening, consent, and signature events use an
            unambiguous UTC format.
          </dd>
        </div>
        <div>
          <dt>Document fingerprint</dt>
          <dd>
            The SHA-256 covers the canonical content frozen at completion: the
            agreement, its signers, and their signatures.
          </dd>
        </div>
        <div>
          <dt>Event log</dt>
          <dd>
            The timeline connects each action to the email address provided by
            that participant.
          </dd>
        </div>
      </dl>

      <section aria-labelledby="document-proof-heading">
        <h2 id="document-proof-heading">Document proof</h2>
        {proof.documentHash ? (
          <p className="document-hash">
            <strong>SHA-256</strong>
            <code>{proof.documentHash}</code>
          </p>
        ) : (
          <p className="proof-pending" role="status">
            The final fingerprint will be frozen once everyone has signed.
          </p>
        )}
      </section>

      <section aria-labelledby="audit-heading">
        <h2 id="audit-heading">Event log</h2>
        <ol className="audit-log">
          {proof.auditEvents.map((event) => (
            <li key={event.id}>
              <time dateTime={event.occurredAt.toISOString()}>
                {formatUtc(event.occurredAt)}
              </time>
              <span>{auditEventLabel(event.type)}</span>
              {event.email ? <span>{event.email}</span> : null}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
