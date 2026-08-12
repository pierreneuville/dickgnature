import { useTranslations } from "next-intl";
import { formatUtc, isAuditEventType } from "@/lib/audit";
import type { ContractProof } from "@/lib/signed-document";

export function ProofView({ proof }: { proof: ContractProof }) {
  const t = useTranslations("proof");
  const auditT = useTranslations("auditEvent");
  const auditLabel = (type: string) =>
    isAuditEventType(type) ? auditT(type) : auditT("fallback");

  return (
    <article className="proof-page">
      <p className="ses-badge">{t("sesBadge")}</p>
      <h1>{t("title")}</h1>
      <p className="proof-intro">{t("intro")}</p>

      <dl className="proof-pillars">
        <div>
          <dt>{t("consentTitle")}</dt>
          <dd>{t("consentBody")}</dd>
        </div>
        <div>
          <dt>{t("timestampsTitle")}</dt>
          <dd>{t("timestampsBody")}</dd>
        </div>
        <div>
          <dt>{t("fingerprintTitle")}</dt>
          <dd>{t("fingerprintBody")}</dd>
        </div>
        <div>
          <dt>{t("eventLogTitle")}</dt>
          <dd>{t("eventLogBody")}</dd>
        </div>
      </dl>

      <section aria-labelledby="document-proof-heading">
        <h2 id="document-proof-heading">{t("documentProofHeading")}</h2>
        {proof.documentHash ? (
          <p className="document-hash">
            <strong>SHA-256</strong>
            <code>{proof.documentHash}</code>
          </p>
        ) : (
          <p className="proof-pending" role="status">
            {t("pending")}
          </p>
        )}
      </section>

      <section aria-labelledby="audit-heading">
        <h2 id="audit-heading">{t("eventLogHeading")}</h2>
        <ol className="audit-log">
          {proof.auditEvents.map((event) => (
            <li key={event.id}>
              <time dateTime={event.occurredAt.toISOString()}>
                {formatUtc(event.occurredAt)}
              </time>
              <span>{auditLabel(event.type)}</span>
              {event.email ? <span>{event.email}</span> : null}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
