import type { Metadata } from "next";
import { hasLocale, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  localizedAlternates,
  localizedPath,
  ogImagePath,
  openGraphLocale,
  siteName,
} from "@/lib/seo";
import { ContractForm } from "./contract-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({ locale: safeLocale, namespace: "meta" });
  const pathname = "/contracts/new";

  return {
    title: t("newContractTitle"),
    description: t("newContractDescription"),
    alternates: localizedAlternates(safeLocale, pathname),
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName,
      title: t("newContractTitle"),
      description: t("newContractDescription"),
      url: localizedPath(safeLocale, pathname),
      locale: openGraphLocale(safeLocale),
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: t("ogImageAlt"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("newContractTitle"),
      description: t("newContractDescription"),
      images: [{ url: ogImagePath, alt: t("ogImageAlt") }],
    },
  };
}

export default function NewContractPage() {
  const t = useTranslations("contractNew");

  return (
    <div className="new-contract-page">
      <header className="new-contract-page__hero">
        <Link className="new-contract-page__back" href="/">
          {t("back")}
        </Link>
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("title")}</h1>
        <p className="tagline">{t("tagline")}</p>
      </header>

      <ContractForm />
    </div>
  );
}
