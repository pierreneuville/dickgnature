export const AUDIT_EVENT_TYPES = [
  "CONTRACT_CREATED",
  "INVITATION_SENT",
  "DOCUMENT_OPENED",
  "CONSENT_RECORDED",
  "DOCUMENT_SIGNED",
] as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

export const AUDIT_EVENT_LABELS: Record<AuditEventType, string> = {
  CONTRACT_CREATED: "Création du contrat",
  INVITATION_SENT: "Envoi de l'invitation",
  DOCUMENT_OPENED: "Ouverture du document",
  CONSENT_RECORDED: "Consentement explicite enregistré",
  DOCUMENT_SIGNED: "Signature enregistrée",
};

export function isAuditEventType(value: string): value is AuditEventType {
  return (AUDIT_EVENT_TYPES as readonly string[]).includes(value);
}

export function auditEventLabel(type: string): string {
  return isAuditEventType(type) ? AUDIT_EVENT_LABELS[type] : "Événement d'audit";
}

export function formatUtc(date: Date): string {
  return date.toISOString().replace(".000Z", "Z");
}
