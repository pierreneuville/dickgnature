import { createTranslator, hasLocale } from "next-intl";
import { routing, type Locale } from "./routing";

// Traduction HORS contexte de requête (génération du PDF signé et des emails de complétion,
// déclenchée après commit dans une server action). next-intl/server ne s'applique pas ici : on
// charge le catalogue de la locale et on instancie un traducteur autonome via createTranslator.

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && hasLocale(routing.locales, value);
}

// Toute valeur inattendue (locale absente, legacy, corrompue) retombe sur la locale par défaut.
export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : routing.defaultLocale;
}

async function loadMessages(locale: Locale): Promise<Record<string, unknown>> {
  return (await import(`../messages/${locale}.json`)).default;
}

// Signature minimale d'un traducteur : clé (éventuellement pointée) + valeurs d'interpolation.
// `markup` rend un message balisé (ex. HTML d'email) en chaîne : chaque balise ICU reçoit un
// gestionnaire (chunks) → string, ce que ne permet pas l'appel simple (qui rejette les balises).
export type MarkupHandler = (chunks: string) => string;
export type MessageTranslator = ((
  key: string,
  values?: Record<string, string | number>,
) => string) & {
  markup: (
    key: string,
    values?: Record<string, string | number | MarkupHandler>,
  ) => string;
};

// Traducteur lié à une locale et, optionnellement, à un namespace du catalogue. Le cast reflète
// l'usage réel (messages typés dynamiquement, chargés à l'exécution) : createTranslator renvoie
// bien une fonction appelable (clé, valeurs) → string, dotée d'une méthode `markup`.
export async function getMessageTranslator(
  locale: Locale,
  namespace?: string,
): Promise<MessageTranslator> {
  const messages = await loadMessages(locale);
  return createTranslator({ locale, messages, namespace }) as unknown as MessageTranslator;
}
