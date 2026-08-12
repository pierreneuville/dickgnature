import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { localizedPath, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const privateRoutes = routing.locales.flatMap((locale) => [
    localizedPath(locale, "/contracts/"),
    localizedPath(locale, "/sign/"),
  ]);

  return {
    rules: {
      userAgent: "*",
      allow: routing.locales.flatMap((locale) => [
        localizedPath(locale),
        localizedPath(locale, "/contracts/new"),
      ]),
      disallow: privateRoutes,
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.toString(),
  };
}
