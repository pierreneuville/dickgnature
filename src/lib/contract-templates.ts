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

// Structure indépendante de la langue : quels templates existent, leur ton suggéré et l'ordre
// des variables. Tous les textes (titre, description, libellés, corps) vivent dans les catalogues
// i18n (namespace `templates`) — source unique, traduite par langue.
export type ContractTemplateShape = {
  id: ContractTemplateId;
  suggestedTone: Tone;
  variableKeys: readonly string[];
};

export const CONTRACT_TEMPLATE_SHAPES: readonly ContractTemplateShape[] = [
  { id: "iou", suggestedTone: "serious", variableKeys: ["debtor", "creditor", "amount", "dueDate"] },
  {
    id: "item-loan",
    suggestedTone: "fun",
    variableKeys: ["lender", "borrower", "item", "returnDate"],
  },
  {
    id: "shared-expenses",
    suggestedTone: "fun",
    variableKeys: ["partyOne", "partyTwo", "expense", "amount", "settlementDate"],
  },
  {
    id: "bet",
    suggestedTone: "fun",
    variableKeys: ["challenger", "opponent", "challenge", "deadline", "stake"],
  },
  {
    id: "roommates",
    suggestedTone: "serious",
    variableKeys: ["roommateOne", "roommateTwo", "address", "sharedExpense", "splitRule", "startDate"],
  },
  {
    id: "small-service",
    suggestedTone: "serious",
    variableKeys: ["provider", "client", "service", "amount", "deliveryDate"],
  },
  {
    id: "simple-nda",
    suggestedTone: "serious",
    variableKeys: ["partyOne", "partyTwo", "confidentialInfo", "allowedPurpose", "endDate"],
  },
] satisfies readonly ContractTemplateShape[];

// Forme brute d'un template dans un catalogue i18n (lue via `t.raw` — les corps portent des
// jetons `{{clé}}` qui ne sont pas de l'ICU MessageFormat).
export type ContractTemplateMessages = {
  title: string;
  description: string;
  vars: Record<string, { label: string; placeholder: string }>;
  body: Record<Tone, string>;
};

// Template localisé, assemblé à partir d'un catalogue i18n pour la langue active.
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

export function getContractTemplateShape(id: string): ContractTemplateShape | undefined {
  return CONTRACT_TEMPLATE_SHAPES.find((shape) => shape.id === id);
}

export function buildContractTemplate(
  shape: ContractTemplateShape,
  messages: ContractTemplateMessages,
): ContractTemplate {
  return {
    id: shape.id,
    title: messages.title,
    description: messages.description,
    suggestedTone: shape.suggestedTone,
    variables: shape.variableKeys.map((key) => ({
      key,
      label: messages.vars[key].label,
      placeholder: messages.vars[key].placeholder,
    })),
    body: messages.body,
  };
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
