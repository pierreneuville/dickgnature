import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getContract } from "@/lib/contracts";
import {
  getParticipantByToken,
  participantLinkState,
  recordParticipantOpened,
} from "@/lib/participants";
import { ContractView } from "@/app/[locale]/contracts/[id]/contract-view";
import { SignForm } from "@/app/[locale]/contracts/[id]/sign/sign-form";
import { EasterEggBanner } from "@/components/easter-egg-banner";
import { SiteHeader, ToneSurface } from "@/components/ui";
import { matchesEasterEggName } from "@/lib/easter-egg";
import { localizedPrivateMetadata } from "@/lib/seo-metadata";
import { signViaTokenAction } from "./actions";

// Page de signature PUBLIQUE, ouverte via un lien tokenisé — aucun compte requis (axe #1 : le
// contrat à deux en < 60 s). Rendu dynamique : lecture du token en base à chaque visite.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return localizedPrivateMetadata(locale, "tokenSignTitle");
}

export default async function TokenSignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resolved = await getParticipantByToken(token);
  if (!resolved) {
    notFound();
  }

  await recordParticipantOpened(token);

  const { participant } = resolved;
  // Contrat complet pour ContractView : rend le document DANS SON TON (jamais d'humour imposé au
  // signataire en "serious" — ModePicker n'expose alors même pas le motif parodique).
  const contract = await getContract(resolved.contract.id);
  if (!contract) {
    notFound();
  }

  const state = participantLinkState(participant);
  const t = await getTranslations("sign");

  return (
    <ToneSurface tone={contract.tone}>
      <SiteHeader />

      {matchesEasterEggName(participant.name) ? (
        <EasterEggBanner name={participant.name} />
      ) : null}

      <ContractView contract={contract} />

      <section className="signing-panel" aria-label={t("signingAria")}>
        <p className="signer-identity">
          {t("signingAs")} <strong>{participant.name}</strong>
        </p>

        {state === "signed" ? (
          <p className="signing-done" role="status">
            {t("done", { name: participant.name })}
          </p>
        ) : state === "expired" ? (
          <p className="signing-expired" role="status">
            {t("expired")}
          </p>
        ) : (
          <>
            <h2>{t("markHeading")}</h2>
            <SignForm
              tone={contract.tone}
              action={signViaTokenAction.bind(null, token)}
              submitLabel={t("tokenSubmit")}
            />
          </>
        )}
      </section>
    </ToneSurface>
  );
}
