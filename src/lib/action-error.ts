import { z } from "zod";
import type { ErrorMessageKey } from "@/lib/error-codes";
import { ParticipantError } from "@/lib/participants";
import { SignatureError } from "@/lib/signatures";

type MapOptions = {
  // Repli si l'erreur n'est ni une erreur de domaine ni (le cas échéant) une ZodError.
  fallback: ErrorMessageKey;
  // Repli dédié aux ZodError (validation de frontière), quand l'appelant veut un message distinct.
  onInvalidInput?: ErrorMessageKey;
};

// Traduit une erreur remontée d'une server action en **code** d'erreur stable (= clé i18n `errors`).
// La server action renvoie ce code ; la couche présentation (composant client) le localise via
// useTranslations("errors"). Pur et sans contexte de requête : directement testable, et la locale
// est résolue là où elle est disponible — côté client. Aucune logique métier ici, juste le routage
// erreur → code.
export function actionErrorCode(
  error: unknown,
  { fallback, onInvalidInput }: MapOptions,
): ErrorMessageKey {
  if (error instanceof ParticipantError || error instanceof SignatureError) {
    return error.code;
  }
  if (onInvalidInput && error instanceof z.ZodError) {
    return onInvalidInput;
  }
  return fallback;
}
