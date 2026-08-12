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
import { ButtonLink, SiteHeader, ToneSurface } from "@/components/ui";
import { EasterEggBanner } from "@/components/easter-egg-banner";
import { ContractView } from "./contract-view";
import { ParticipantsForm } from "./participants-form";
import {
  ParticipantsList,
  type ParticipantRow,
} from "./participants-list";
import { SignaturesList } from "./signatures-list";

// Lecture en base : rendu dynamique, jamais pré-généré au build.
export const dynamic = "force-dynamic";

export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        <ParticipantsList participants={rows} status={contract.status} />
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
