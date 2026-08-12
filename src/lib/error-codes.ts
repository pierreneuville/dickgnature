// Codes d'erreur de domaine stables. Le domaine (participants.ts, signatures.ts) est hors contexte
// de requête next-intl : il ne peut pas traduire. Il lève donc un **code** stable ; la couche
// présentation (server actions) traduit ce code via le namespace i18n `errors`. Le code EST la clé.
//
// Ce module est une feuille (aucun import du domaine) pour éviter tout cycle : les classes d'erreur
// importent d'ici, jamais l'inverse.

export const DOMAIN_ERROR_CODES = [
  "contractNotFound",
  "signerListLocked",
  "noSigners",
  "duplicateSigner",
  "linkInvalid",
  "linkExpired",
  "linkAlreadySigned",
  "consentRequired",
  "proofIncomplete",
  "modeNotAllowed",
] as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];

// Codes propres à la couche action (validation de frontière et imprévus). Ils n'ont pas de site de
// levée dans le domaine : les server actions les choisissent comme repli. Ils vivent aussi dans le
// namespace i18n `errors` pour être traduits comme les autres.
export const ACTION_ERROR_CODES = [
  "invalidSigner",
  "addSignerFailed",
  "signFailed",
  "createContractFailed",
] as const;

export type ActionErrorCode = (typeof ACTION_ERROR_CODES)[number];

// L'ensemble des clés du namespace i18n `errors` = codes domaine + codes action.
export type ErrorMessageKey = DomainErrorCode | ActionErrorCode;

// Messages anglais par défaut, portés par `Error.message`. Ils servent aux logs et aux contextes
// hors requête (tests, appels serveur sans i18n). Le texte montré à l'utilisateur en requête vient
// toujours du catalogue i18n via le code — ces chaînes ne sont pas le canal d'affichage.
const DEFAULT_MESSAGES: Record<DomainErrorCode, string> = {
  contractNotFound: "Agreement not found.",
  signerListLocked: "The signer list is locked after the first signature.",
  noSigners: "Add at least one person to sign.",
  duplicateSigner: "Someone with that email is already on this agreement.",
  linkInvalid: "That signing link isn't valid.",
  linkExpired: "This signing link has expired.",
  linkAlreadySigned: "This link has already been signed.",
  consentRequired: "Please explicitly agree before signing this document.",
  proofIncomplete: "The proof trail is incomplete.",
  modeNotAllowed: "That signing style isn't available for this agreement.",
};

export function domainErrorMessage(code: DomainErrorCode): string {
  return DEFAULT_MESSAGES[code];
}
