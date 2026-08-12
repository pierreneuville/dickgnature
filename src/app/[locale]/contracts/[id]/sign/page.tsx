import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getContract } from "@/lib/contracts";
import { themeFor } from "@/lib/tone";
import { SiteHeader, ToneSurface } from "@/components/ui";
import { submitSignatureAction } from "./actions";
import { SignForm } from "./sign-form";

export const dynamic = "force-dynamic";

export default async function SignContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await getContract(id);

  if (!contract) {
    notFound();
  }

  const theme = themeFor(contract.tone);
  const t = await getTranslations("sign");
  const toneT = await getTranslations("tone");

  return (
    <ToneSurface tone={contract.tone}>
      <SiteHeader />

      <p>
        <span className="brand-badge" style={{ background: theme.accent }}>
          {theme.brand}
        </span>
      </p>
      <h1>{t("heading", { title: contract.title })}</h1>
      <p className="tagline">{toneT(`${contract.tone}Tagline`)}</p>

      <SignForm
        tone={contract.tone}
        action={submitSignatureAction.bind(null, contract.id)}
      />

      <p className="back-link">
        <Link href={`/contracts/${contract.id}`}>{t("back")}</Link>
      </p>
    </ToneSurface>
  );
}
