import { auditEventLabel, formatUtc } from "@/lib/audit";
import type { ContractProof } from "@/lib/signed-document";

export function ProofView({ proof }: { proof: ContractProof }) {
  return (
    <article className="proof-page">
      <p className="ses-badge">SES · Signature électronique simple</p>
      <h1>Pourquoi ce PDF est probant</h1>
      <p className="proof-intro">
        Cette piste documente un accord électronique simple sans présenter la
        signature comme un équivalent manuscrit universel.
      </p>

      <dl className="proof-pillars">
        <div>
          <dt>Consentement explicite</dt>
          <dd>
            Chaque signataire coche une case dédiée avant de signer. Ce
            consentement est horodaté et associé à son email déclaré.
          </dd>
        </div>
        <div>
          <dt>Horodatage UTC</dt>
          <dd>
            Création, envoi, ouverture, consentement et signature utilisent un
            format UTC non ambigu.
          </dd>
        </div>
        <div>
          <dt>Empreinte du document</dt>
          <dd>
            Le SHA-256 porte sur le contenu canonique figé à la complétion :
            contrat, signataires et signatures.
          </dd>
        </div>
        <div>
          <dt>Journal d&apos;événements</dt>
          <dd>
            La chronologie relie les actions à l&apos;email déclaré par chaque
            participant.
          </dd>
        </div>
      </dl>

      <section aria-labelledby="document-proof-heading">
        <h2 id="document-proof-heading">Preuve du document</h2>
        {proof.documentHash ? (
          <p className="document-hash">
            <strong>SHA-256</strong>
            <code>{proof.documentHash}</code>
          </p>
        ) : (
          <p className="proof-pending" role="status">
            L&apos;empreinte définitive sera figée quand tous les participants
            auront signé.
          </p>
        )}
      </section>

      <section aria-labelledby="audit-heading">
        <h2 id="audit-heading">Journal d&apos;événements</h2>
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
