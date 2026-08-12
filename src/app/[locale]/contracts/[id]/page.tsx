import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getContract } from "@/lib/contracts";
import {
  listParticipants,
  participantLinkState,
} from "@/lib/participants";
import { listSignatures } from "@/lib/signatures";
import { findEasterEggName } from "@/lib/easter-egg";
import { localizedPrivateMetadata } from "@/lib/seo-metadata";
import { ButtonLink, SiteHeader, ToneSurface } from "@/components/ui";
import { EasterEggBanner } from "@/components/easter-egg-banner";
import { ContractView } from "./contract-view";
import { ParticipantsForm } from "./participants-form";
import {
  ParticipantsList,
  type ParticipantRow,
} from "./participants-list";
import { ResendInvitation } from "./resend-invitation";
import { SignaturesList } from "./signatures-list";

// Notices affichées après une action d'invitation (redirection avec `?notice=`). On mappe la valeur
// vers une clé i18n `participants` + une tonalité ARIA (alert pour un échec, status pour un succès).
type ParticipantNoticeKey =
  | "noticeInviteEmailFailed"
  | "noticeInviteResent"
  | "noticeResendFailed";

const NOTICES: Record<
  string,
  { key: ParticipantNoticeKey; tone: "alert" | "status" }
> = {
  "invite-email-failed": { key: "noticeInviteEmailFailed", tone: "alert" },
  "invite-resent": { key: "noticeInviteResent", tone: "status" },
  "invite-resend-failed": { key: "noticeResendFailed", tone: "alert" },
};

// Lecture en base : rendu dynamique, jamais pré-généré au build.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return localizedPrivateMetadata(locale, "contractTitle");
}

export default async function ContractPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { id } = await params;
  const { notice } = await searchParams;
  const contract = await getContract(id);

  if (!contract) {
    notFound();
  }

  const [signatures, participants] = await Promise.all([
    listSignatures(contract.id),
    listParticipants(contract.id),
  ]);

  // Vue « suivi créateur » : on calcule l'état de chaque lien côté serveur (pur), la liste reste
  // présentielle et sans dépendance Prisma.
  const rows: ParticipantRow[] = participants.map((participant) => ({
    id: participant.id,
    name: participant.name,
    email: participant.email,
    token: participant.token,
    linkState: participantLinkState(participant),
  }));

  const easterEggName = findEasterEggName(participants.map((p) => p.name));
  const t = await getTranslations("contract");
  const tParticipants = await getTranslations("participants");
  const activeNotice = notice ? NOTICES[notice] : undefined;

  return (
    <ToneSurface tone={contract.tone}>
      <SiteHeader />

      {easterEggName ? <EasterEggBanner name={easterEggName} /> : null}

      <ContractView contract={contract} />

      <section
        className="participants-section"
        aria-label={t("peopleSigningAria")}
      >
        <h2>{t("whosIn")}</h2>
        {activeNotice ? (
          <p
            className={`participants-notice is-${activeNotice.tone}`}
            role={activeNotice.tone === "alert" ? "alert" : "status"}
          >
            {tParticipants(activeNotice.key)}
          </p>
        ) : null}
        <ParticipantsList
          participants={rows}
          status={contract.status}
          rowAction={(participant) =>
            participant.linkState === "open" ? (
              <ResendInvitation
                contractId={contract.id}
                participantId={participant.id}
                name={participant.name}
              />
            ) : null
          }
        />
        <ParticipantsForm contractId={contract.id} />
      </section>

      <section className="signatures" aria-label={t("signaturesAria")}>
        <h2>{t("signaturesHeading")}</h2>
        <SignaturesList signatures={signatures} />
        <div className="canvas-actions">
          <ButtonLink href={`/contracts/${contract.id}/sign`}>
            {t("addSignature")}
          </ButtonLink>
          {contract.status === "completed" ? (
            <ButtonLink
              variant="secondary"
              href={`/contracts/${contract.id}/pdf`}
            >
              {t("downloadPdf")}
            </ButtonLink>
          ) : null}
        </div>
        <p className="proof-link">
          <Link href={`/contracts/${contract.id}/proof`}>
            {t("proofLink")}
          </Link>
        </p>
      </section>
    </ToneSurface>
  );
}
