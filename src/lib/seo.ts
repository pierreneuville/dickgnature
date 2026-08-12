import type { Metadata } from "next";
import { routing, type Locale } from "@/i18n/routing";

const FALLBACK_SITE_URL = "https://dickgnature.vercel.app";

function normalizedSiteUrl(value: string | undefined): URL {
  try {
    const url = new URL(value || FALLBACK_SITE_URL);
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
}

export const siteUrl = normalizedSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const siteName = "dickgnature";
export const ogImagePath = "/og-dickgnature.png";

export function localizedPath(locale: Locale, pathname = "/"): string {
  const suffix = pathname === "/" ? "" : `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${prefix}${suffix}` || "/";
}

export function localizedAlternates(
  locale: Locale,
  pathname = "/",
): NonNullable<Metadata["alternates"]> {
  return {
    canonical: new URL(localizedPath(locale, pathname), siteUrl).toString(),
    languages: localizedLanguageAlternates(pathname),
  };
}

export function localizedLanguageAlternates(
  pathname = "/",
): Record<string, string> {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((candidate) => [
      candidate,
      new URL(localizedPath(candidate, pathname), siteUrl).toString(),
    ]),
  );

  return {
    ...languages,
    "x-default": new URL(
      localizedPath(routing.defaultLocale, pathname),
      siteUrl,
    ).toString(),
  };
}

export function openGraphLocale(locale: Locale): string {
  return {
    en: "en_US",
    fr: "fr_FR",
    pt: "pt_PT",
    es: "es_ES",
  }[locale];
}

export function privatePageMetadata(title: string): Metadata {
  return {
    title,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      noarchive: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
