import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ogImagePath, siteName, siteUrl } from "@/lib/seo";
import "../globals.css";

// Pré-génère les segments de locale connus (en, fr, pt, es).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

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
  return {
    metadataBase: siteUrl,
    applicationName: siteName,
    title: t("title"),
    description: t("description"),
    authors: [{ name: siteName }],
    creator: siteName,
    category: "productivity",
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      ],
      shortcut: "/favicon.ico",
      apple: [
        {
          url: "/apple-touch-icon.png",
          type: "image/png",
          sizes: "180x180",
        },
      ],
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      siteName,
      type: "website",
      images: [{ url: ogImagePath, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogImagePath],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Active le rendu statique conscient de la locale pour ce segment.
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <html lang={locale}>
      <body>
        <a className="skip-link" href="#main-content">
          {t("skipToContent")}
        </a>
        <main className="container" id="main-content">
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </main>
      </body>
    </html>
  );
}
