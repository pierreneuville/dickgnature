-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "documentHash" TEXT;
ALTER TABLE "Contract" ADD COLUMN "completedAt" DATETIME;

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN "openedAt" DATETIME;
ALTER TABLE "Participant" ADD COLUMN "consentedAt" DATETIME;

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "participantId" TEXT,
    "type" TEXT NOT NULL,
    "email" TEXT,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditEvent_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AuditEvent_contractId_occurredAt_idx" ON "AuditEvent"("contractId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_participantId_idx" ON "AuditEvent"("participantId");
