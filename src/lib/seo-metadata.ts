import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { privatePageMetadata } from "@/lib/seo";

const privateDescriptionKeys = {
  contractTitle: "contractDescription",
  contractSignTitle: "contractSignDescription",
  tokenSignTitle: "tokenSignDescription",
  proofTitle: "proofDescription",
} as const;

export async function localizedPrivateMetadata(
  locale: string,
  titleKey: keyof typeof privateDescriptionKeys,
): Promise<Metadata> {
  const safeLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({ locale: safeLocale, namespace: "meta" });
  return {
    ...privatePageMetadata(t(titleKey)),
    description: t(privateDescriptionKeys[titleKey]),
  };
}
