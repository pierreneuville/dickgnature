import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { privatePageMetadata, seoCopy, type SeoCopy } from "@/lib/seo";

const privateDescriptionKeys = {
  contractTitle: "contractDescription",
  contractSignTitle: "contractSignDescription",
  tokenSignTitle: "tokenSignDescription",
  proofTitle: "proofDescription",
} as const satisfies Partial<Record<keyof SeoCopy, keyof SeoCopy>>;

export async function localizedPrivateMetadata(
  locale: string,
  titleKey: keyof typeof privateDescriptionKeys,
): Promise<Metadata> {
  const safeLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const copy = seoCopy[safeLocale];
  return {
    ...privatePageMetadata(copy[titleKey]),
    description: copy[privateDescriptionKeys[titleKey]],
  };
}
