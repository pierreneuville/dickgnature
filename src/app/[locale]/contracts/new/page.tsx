import type { Metadata } from "next";
import { hasLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  localizedAlternates,
  localizedPath,
  ogImagePath,
  openGraphLocale,
  seoCopy,
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
  const copy = seoCopy[safeLocale];
  const pathname = "/contracts/new";

  return {
    title: copy.newContractTitle,
    description: copy.newContractDescription,
    alternates: localizedAlternates(safeLocale, pathname),
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName,
      title: copy.newContractTitle,
      description: copy.newContractDescription,
      url: localizedPath(safeLocale, pathname),
      locale: openGraphLocale(safeLocale),
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: copy.ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.newContractTitle,
      description: copy.newContractDescription,
      images: [{ url: ogImagePath, alt: copy.ogImageAlt }],
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
