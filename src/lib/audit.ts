export const AUDIT_EVENT_TYPES = [
  "CONTRACT_CREATED",
  "INVITATION_SENT",
  "DOCUMENT_OPENED",
  "CONSENT_RECORDED",
  "DOCUMENT_SIGNED",
] as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

export function isAuditEventType(value: string): value is AuditEventType {
  return (AUDIT_EVENT_TYPES as readonly string[]).includes(value);
}

export function formatUtc(date: Date): string {
  return date.toISOString().replace(".000Z", "Z");
}
