import type { Tone } from "@/lib/tone";

export const CONTRACT_TEMPLATE_IDS = [
  "iou",
  "item-loan",
  "shared-expenses",
  "bet",
  "roommates",
  "small-service",
  "simple-nda",
] as const;

export type ContractTemplateId = (typeof CONTRACT_TEMPLATE_IDS)[number];

export type ContractTemplateVariable = {
  key: string;
  label: string;
  placeholder: string;
};

export type ContractTemplate = {
  id: ContractTemplateId;
  title: string;
  description: string;
  suggestedTone: Tone;
  variables: readonly ContractTemplateVariable[];
  body: Record<Tone, string>;
};

export type RenderedContractTemplate = {
  title: string;
  body: string;
  tone: Tone;
};

export const CONTRACT_TEMPLATES: readonly ContractTemplate[] = [
  {
    id: "iou",
    title: "Reconnaissance de dette",
    description: "Formaliser une somme avancée et sa date de remboursement.",
    suggestedTone: "serious",
    variables: [
      { key: "debtor", label: "Personne qui rembourse", placeholder: "Camille Martin" },
      { key: "creditor", label: "Personne qui a avancé", placeholder: "Noa Bernard" },
      { key: "amount", label: "Montant", placeholder: "120 €" },
      { key: "dueDate", label: "Date de remboursement", placeholder: "30 septembre 2026" },
    ],
    body: {
      fun: "{{debtor}} reconnaît que {{creditor}} lui a sauvé la mise en avançant {{amount}}. Promis, juré : la somme sera remboursée au plus tard le {{dueDate}}. Les deux personnes gardent une copie de cet accord, histoire que la mémoire ne devienne pas soudainement créative.",
      serious: "{{debtor}} reconnaît devoir à {{creditor}} la somme de {{amount}}. Cette somme sera remboursée intégralement au plus tard le {{dueDate}}. Les parties déclarent accepter les termes du présent accord et en conserver chacune une copie.",
    },
  },
  {
    id: "item-loan",
    title: "Prêt d’objet",
    description: "Prêter un objet sans perdre de vue qui le rend, et quand.",
    suggestedTone: "fun",
    variables: [
      { key: "lender", label: "Personne qui prête", placeholder: "Noa Bernard" },
      { key: "borrower", label: "Personne qui emprunte", placeholder: "Camille Martin" },
      { key: "item", label: "Objet prêté", placeholder: "vidéoprojecteur Epson" },
      { key: "returnDate", label: "Date de retour", placeholder: "18 août 2026" },
    ],
    body: {
      fun: "{{lender}} confie son précieux {{item}} à {{borrower}}. Mission de {{borrower}} : en prendre soin comme si c’était le dernier exemplaire sur Terre et le rendre au plus tard le {{returnDate}}, complet et en bon état.",
      serious: "{{lender}} prête à {{borrower}} l’objet suivant : {{item}}. {{borrower}} s’engage à en prendre soin et à le restituer complet et en bon état au plus tard le {{returnDate}}.",
    },
  },
  {
    id: "shared-expenses",
    title: "Partage de dépenses",
    description: "Décider clairement qui paie quoi pour une dépense commune.",
    suggestedTone: "fun",
    variables: [
      { key: "partyOne", label: "Première personne", placeholder: "Camille Martin" },
      { key: "partyTwo", label: "Deuxième personne", placeholder: "Noa Bernard" },
      { key: "expense", label: "Dépense partagée", placeholder: "week-end à Marseille" },
      { key: "amount", label: "Montant total", placeholder: "460 €" },
      { key: "settlementDate", label: "Date de règlement", placeholder: "31 août 2026" },
    ],
    body: {
      fun: "{{partyOne}} et {{partyTwo}} partagent la dépense « {{expense}} », d’un montant total de {{amount}}, à parts égales. Les comptes seront réglés au plus tard le {{settlementDate}} : paix des ménages, tableur facultatif.",
      serious: "{{partyOne}} et {{partyTwo}} conviennent de partager à parts égales la dépense suivante : {{expense}}, pour un montant total de {{amount}}. Le solde entre les parties sera réglé au plus tard le {{settlementDate}}.",
    },
  },
  {
    id: "bet",
    title: "Pari ou défi",
    description: "Graver un défi mémorable et son enjeu dans le marbre numérique.",
    suggestedTone: "fun",
    variables: [
      { key: "challenger", label: "Personne qui lance le défi", placeholder: "Camille Martin" },
      { key: "opponent", label: "Personne qui relève le défi", placeholder: "Noa Bernard" },
      { key: "challenge", label: "Défi", placeholder: "courir 10 km en moins d’une heure" },
      { key: "deadline", label: "Date limite", placeholder: "1er octobre 2026" },
      { key: "stake", label: "Enjeu", placeholder: "un brunch maison" },
    ],
    body: {
      fun: "{{challenger}} défie officiellement {{opponent}} de {{challenge}} avant le {{deadline}}. Si le défi est réussi, {{challenger}} devra offrir {{stake}}. Sinon, {{opponent}} s’en chargera. Mauvaise foi interdite, panache recommandé.",
      serious: "{{challenger}} et {{opponent}} conviennent du défi suivant : {{challenge}}, à réaliser avant le {{deadline}}. En cas de réussite, {{challenger}} fournira {{stake}} ; à défaut, {{opponent}} le fournira. Les parties apprécieront ensemble si le défi est rempli.",
    },
  },
  {
    id: "roommates",
    title: "Accord de colocation",
    description: "Fixer une règle simple pour la vie et les frais du logement.",
    suggestedTone: "serious",
    variables: [
      { key: "roommateOne", label: "Première personne", placeholder: "Camille Martin" },
      { key: "roommateTwo", label: "Deuxième personne", placeholder: "Noa Bernard" },
      { key: "address", label: "Adresse du logement", placeholder: "12 rue des Lilas, Lyon" },
      { key: "sharedExpense", label: "Frais concernés", placeholder: "électricité, internet et produits communs" },
      { key: "splitRule", label: "Règle de partage", placeholder: "moitié chacun" },
      { key: "startDate", label: "Date de début", placeholder: "1er septembre 2026" },
    ],
    body: {
      fun: "À partir du {{startDate}}, {{roommateOne}} et {{roommateTwo}}, colocataires au {{address}}, partageront {{sharedExpense}} selon la règle suivante : {{splitRule}}. Chacun paie sa part à temps et prévient l’autre en cas de souci — parce qu’un frigo vide suffit déjà comme drame domestique.",
      serious: "À compter du {{startDate}}, {{roommateOne}} et {{roommateTwo}}, occupant le logement situé au {{address}}, conviennent de partager les frais suivants : {{sharedExpense}}. La répartition appliquée sera : {{splitRule}}. Chaque partie informera l’autre sans délai de toute difficulté de paiement.",
    },
  },
  {
    id: "small-service",
    title: "Petite prestation",
    description: "Cadrer un petit service, son prix et sa date de livraison.",
    suggestedTone: "serious",
    variables: [
      { key: "provider", label: "Personne qui réalise", placeholder: "Camille Martin" },
      { key: "client", label: "Personne qui commande", placeholder: "Noa Bernard" },
      { key: "service", label: "Prestation", placeholder: "photographier la fête d’anniversaire" },
      { key: "amount", label: "Prix convenu", placeholder: "250 €" },
      { key: "deliveryDate", label: "Date de livraison", placeholder: "15 octobre 2026" },
    ],
    body: {
      fun: "{{provider}} réalisera pour {{client}} la mission suivante : {{service}}. La livraison est prévue au plus tard le {{deliveryDate}}, contre {{amount}}. Retours clairs, paiement ponctuel et high-five final inclus.",
      serious: "{{provider}} s’engage à réaliser pour {{client}} la prestation suivante : {{service}}. La livraison interviendra au plus tard le {{deliveryDate}}. En contrepartie, {{client}} versera la somme de {{amount}} selon les modalités convenues entre les parties.",
    },
  },
  {
    id: "simple-nda",
    title: "Accord de confidentialité simple",
    description: "Protéger une information précise échangée entre deux personnes.",
    suggestedTone: "serious",
    variables: [
      { key: "partyOne", label: "Première partie", placeholder: "Camille Martin" },
      { key: "partyTwo", label: "Deuxième partie", placeholder: "Noa Bernard" },
      { key: "confidentialInfo", label: "Information confidentielle", placeholder: "le prototype du projet Orion" },
      { key: "allowedPurpose", label: "Usage autorisé", placeholder: "évaluer une collaboration" },
      { key: "endDate", label: "Fin de confidentialité", placeholder: "31 décembre 2027" },
    ],
    body: {
      fun: "{{partyOne}} et {{partyTwo}} garderont sous clé l’information suivante : {{confidentialInfo}}. Elle ne pourra être utilisée que pour {{allowedPurpose}} et ne sera partagée avec personne sans accord préalable, jusqu’au {{endDate}}. Motus, bouche cousue, accord signé.",
      serious: "{{partyOne}} et {{partyTwo}} s’engagent à garder confidentielle l’information suivante : {{confidentialInfo}}. Cette information ne pourra être utilisée que pour {{allowedPurpose}}, ni être communiquée à un tiers sans accord écrit préalable, jusqu’au {{endDate}}.",
    },
  },
] satisfies readonly ContractTemplate[];

export function getContractTemplate(id: string): ContractTemplate | undefined {
  return CONTRACT_TEMPLATES.find((template) => template.id === id);
}

function renderVariables(
  source: string,
  definitions: readonly ContractTemplateVariable[],
  values: Readonly<Record<string, string>>,
): string {
  const variables = new Map(definitions.map((variable) => [variable.key, variable]));

  return source.replace(/{{([a-zA-Z0-9]+)}}/g, (_match, key: string) => {
    const value = values[key]?.trim();
    if (value) return value;

    const variable = variables.get(key);
    return variable ? `[${variable.label}]` : `[${key}]`;
  });
}

export function renderContractTemplate(
  template: ContractTemplate,
  tone: Tone,
  values: Readonly<Record<string, string>> = {},
): RenderedContractTemplate {
  return {
    title: template.title,
    body: renderVariables(template.body[tone], template.variables, values),
    tone,
  };
}
