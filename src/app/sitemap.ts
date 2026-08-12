import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import {
  localizedLanguageAlternates,
  localizedPath,
  siteUrl,
} from "@/lib/seo";

const publicPages = [
  { pathname: "/", changeFrequency: "weekly", priority: 1 },
  { pathname: "/contracts/new", changeFrequency: "monthly", priority: 0.8 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.flatMap(({ pathname, changeFrequency, priority }) =>
    routing.locales.map((locale) => ({
      url: new URL(localizedPath(locale, pathname), siteUrl).toString(),
      changeFrequency,
      priority,
      alternates: {
        languages: localizedLanguageAlternates(pathname),
      },
    })),
  );
}
