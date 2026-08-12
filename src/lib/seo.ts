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

export type SeoCopy = {
  title: string;
  description: string;
  ogImageAlt: string;
  newContractTitle: string;
  newContractDescription: string;
  contractTitle: string;
  contractDescription: string;
  contractSignTitle: string;
  contractSignDescription: string;
  tokenSignTitle: string;
  tokenSignDescription: string;
  proofTitle: string;
  proofDescription: string;
};

// SEO copy is kept separate from the application catalogs so this slice can stay based on the
// frozen i18n routing branch without colliding with concurrent message-catalog work.
export const seoCopy = {
  en: {
    title: "dickgnature — Two people, one agreement, zero fuss",
    description: "Create and sign a two-person agreement in under 60 seconds, with no signer account and a clear proof trail.",
    ogImageAlt: "A playful illustrated agreement signed by two people with a bright confirmation mark",
    newContractTitle: "Make an agreement in under 60 seconds — dickgnature",
    newContractDescription: "Start with a plain-English template, make it yours, and send a private signing link — no signer account required.",
    contractTitle: "Your private agreement — dickgnature",
    contractDescription: "Review the private agreement, participants, signatures, and current completion status.",
    contractSignTitle: "Sign your private agreement — dickgnature",
    contractSignDescription: "Review the private agreement and add your signature when you are ready.",
    tokenSignTitle: "Review and sign your agreement — dickgnature",
    tokenSignDescription: "Open your private invitation to review and sign the agreement securely.",
    proofTitle: "Private agreement proof — dickgnature",
    proofDescription: "Review the private completion proof and signature trail for this agreement.",
  },
  fr: {
    title: "dickgnature — Deux personnes, un accord, zéro prise de tête",
    description: "Créez et signez un accord à deux en moins de 60 secondes, sans compte pour le signataire et avec une preuve claire.",
    ogImageAlt: "Un accord illustré et ludique signé par deux personnes avec une confirmation bien visible",
    newContractTitle: "Créez un accord en moins de 60 secondes — dickgnature",
    newContractDescription: "Partez d’un modèle en français clair, adaptez-le et envoyez un lien de signature privé — aucun compte signataire requis.",
    contractTitle: "Votre accord privé — dickgnature",
    contractDescription: "Consultez l’accord privé, ses participants, ses signatures et son état d’avancement.",
    contractSignTitle: "Signez votre accord privé — dickgnature",
    contractSignDescription: "Relisez l’accord privé et ajoutez votre signature lorsque vous êtes prêt.",
    tokenSignTitle: "Relisez et signez votre accord — dickgnature",
    tokenSignDescription: "Ouvrez votre invitation privée pour relire et signer l’accord en toute sécurité.",
    proofTitle: "Preuve privée de l’accord — dickgnature",
    proofDescription: "Consultez la preuve d’achèvement privée et la piste des signatures de cet accord.",
  },
  pt: {
    title: "dickgnature — Duas pessoas, um acordo, zero complicação",
    description: "Crie e assine um acordo entre duas pessoas em menos de 60 segundos, sem conta para quem assina e com uma prova clara.",
    ogImageAlt: "Um acordo ilustrado e divertido assinado por duas pessoas com uma confirmação bem visível",
    newContractTitle: "Crie um acordo em menos de 60 segundos — dickgnature",
    newContractDescription: "Comece com um modelo em português claro, personalize-o e envie um link privado para assinatura — sem conta para assinar.",
    contractTitle: "O seu acordo privado — dickgnature",
    contractDescription: "Consulte o acordo privado, os participantes, as assinaturas e o estado atual.",
    contractSignTitle: "Assine o seu acordo privado — dickgnature",
    contractSignDescription: "Reveja o acordo privado e adicione a sua assinatura quando estiver pronto.",
    tokenSignTitle: "Reveja e assine o seu acordo — dickgnature",
    tokenSignDescription: "Abra o seu convite privado para rever e assinar o acordo em segurança.",
    proofTitle: "Prova privada do acordo — dickgnature",
    proofDescription: "Consulte a prova privada de conclusão e o registo de assinaturas deste acordo.",
  },
  es: {
    title: "dickgnature — Dos personas, un acuerdo, cero complicaciones",
    description: "Crea y firma un acuerdo entre dos personas en menos de 60 segundos, sin cuenta para quien firma y con una prueba clara.",
    ogImageAlt: "Un acuerdo ilustrado y divertido firmado por dos personas con una confirmación bien visible",
    newContractTitle: "Crea un acuerdo en menos de 60 segundos — dickgnature",
    newContractDescription: "Empieza con una plantilla en español claro, personalízala y envía un enlace privado para firmar — sin cuenta de firmante.",
    contractTitle: "Tu acuerdo privado — dickgnature",
    contractDescription: "Consulta el acuerdo privado, sus participantes, firmas y estado actual.",
    contractSignTitle: "Firma tu acuerdo privado — dickgnature",
    contractSignDescription: "Revisa el acuerdo privado y añade tu firma cuando estés listo.",
    tokenSignTitle: "Revisa y firma tu acuerdo — dickgnature",
    tokenSignDescription: "Abre tu invitación privada para revisar y firmar el acuerdo de forma segura.",
    proofTitle: "Prueba privada del acuerdo — dickgnature",
    proofDescription: "Consulta la prueba privada de finalización y el registro de firmas de este acuerdo.",
  },
} satisfies Record<Locale, SeoCopy>;

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
