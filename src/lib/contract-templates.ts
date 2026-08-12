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
    title: "IOU",
    description: "Record money owed and the date it comes home.",
    suggestedTone: "serious",
    variables: [
      { key: "debtor", label: "Person paying back", placeholder: "Camille Martin" },
      { key: "creditor", label: "Person who paid upfront", placeholder: "Noa Bernard" },
      { key: "amount", label: "Amount", placeholder: "€120" },
      { key: "dueDate", label: "Payback date", placeholder: "September 30, 2026" },
    ],
    body: {
      fun: "{{debtor}} confirms that {{creditor}} saved the day by fronting {{amount}}. Pinky promise: the full amount will be paid back by {{dueDate}}. Both people keep a copy, in case anyone's memory suddenly gets creative.",
      serious: "{{debtor}} acknowledges owing {{creditor}} the sum of {{amount}}. The amount will be repaid in full no later than {{dueDate}}. Both parties accept these terms and will each retain a copy of this agreement.",
    },
  },
  {
    id: "item-loan",
    title: "Borrowed item",
    description: "Lend something without losing track of who returns it, or when.",
    suggestedTone: "fun",
    variables: [
      { key: "lender", label: "Person lending it", placeholder: "Noa Bernard" },
      { key: "borrower", label: "Person borrowing it", placeholder: "Camille Martin" },
      { key: "item", label: "Borrowed item", placeholder: "Epson projector" },
      { key: "returnDate", label: "Return date", placeholder: "August 18, 2026" },
    ],
    body: {
      fun: "{{lender}} is entrusting the precious {{item}} to {{borrower}}. The mission: treat it like the last one on Earth and return it complete, unharmed, and no later than {{returnDate}}.",
      serious: "{{lender}} lends {{borrower}} the following item: {{item}}. {{borrower}} agrees to take reasonable care of it and return it complete and in good condition by {{returnDate}}.",
    },
  },
  {
    id: "shared-expenses",
    title: "Shared expenses",
    description: "Settle who pays what before the group chat gets weird.",
    suggestedTone: "fun",
    variables: [
      { key: "partyOne", label: "First person", placeholder: "Camille Martin" },
      { key: "partyTwo", label: "Second person", placeholder: "Noa Bernard" },
      { key: "expense", label: "Shared expense", placeholder: "weekend in Marseille" },
      { key: "amount", label: "Total amount", placeholder: "€460" },
      { key: "settlementDate", label: "Settle-up date", placeholder: "August 31, 2026" },
    ],
    body: {
      fun: "{{partyOne}} and {{partyTwo}} will split “{{expense}}”, totalling {{amount}}, equally. Everything will be settled by {{settlementDate}}. Domestic peace restored; spreadsheet optional.",
      serious: "{{partyOne}} and {{partyTwo}} agree to split the following expense equally: {{expense}}, for a total of {{amount}}. Any balance between the parties will be settled no later than {{settlementDate}}.",
    },
  },
  {
    id: "bet",
    title: "Bet or dare",
    description: "Carve a glorious challenge and its stakes into digital stone.",
    suggestedTone: "fun",
    variables: [
      { key: "challenger", label: "Person calling the dare", placeholder: "Camille Martin" },
      { key: "opponent", label: "Person taking it on", placeholder: "Noa Bernard" },
      { key: "challenge", label: "The challenge", placeholder: "run 10 km in under an hour" },
      { key: "deadline", label: "Deadline", placeholder: "October 1, 2026" },
      { key: "stake", label: "The stakes", placeholder: "a homemade brunch" },
    ],
    body: {
      fun: "{{challenger}} officially dares {{opponent}} to {{challenge}} before {{deadline}}. If they pull it off, {{challenger}} owes {{stake}}. If not, {{opponent}} does. Sore-loser energy forbidden; dramatic flair encouraged.",
      serious: "{{challenger}} and {{opponent}} agree to the following challenge: {{challenge}}, to be completed before {{deadline}}. If successful, {{challenger}} will provide {{stake}}; otherwise {{opponent}} will provide it. Both parties will determine together whether the challenge was completed.",
    },
  },
  {
    id: "roommates",
    title: "Roommate agreement",
    description: "Set one clear rule for shared-home life and costs.",
    suggestedTone: "serious",
    variables: [
      { key: "roommateOne", label: "First roommate", placeholder: "Camille Martin" },
      { key: "roommateTwo", label: "Second roommate", placeholder: "Noa Bernard" },
      { key: "address", label: "Home address", placeholder: "12 Rue des Lilas, Lyon" },
      { key: "sharedExpense", label: "Shared costs", placeholder: "electricity, internet, and household supplies" },
      { key: "splitRule", label: "How to split it", placeholder: "half each" },
      { key: "startDate", label: "Start date", placeholder: "September 1, 2026" },
    ],
    body: {
      fun: "From {{startDate}}, {{roommateOne}} and {{roommateTwo}}, roommates at {{address}}, will split {{sharedExpense}} like this: {{splitRule}}. Everyone pays on time and speaks up if there's a problem — an empty fridge is enough household drama already.",
      serious: "From {{startDate}}, {{roommateOne}} and {{roommateTwo}}, residents of {{address}}, agree to share the following costs: {{sharedExpense}}. The split will be: {{splitRule}}. Each party will promptly inform the other of any payment difficulty.",
    },
  },
  {
    id: "small-service",
    title: "Small service",
    description: "Pin down a small job, its price, and delivery date.",
    suggestedTone: "serious",
    variables: [
      { key: "provider", label: "Person doing the work", placeholder: "Camille Martin" },
      { key: "client", label: "Person hiring them", placeholder: "Noa Bernard" },
      { key: "service", label: "The service", placeholder: "photograph the birthday party" },
      { key: "amount", label: "Agreed price", placeholder: "€250" },
      { key: "deliveryDate", label: "Delivery date", placeholder: "October 15, 2026" },
    ],
    body: {
      fun: "{{provider}} will do the following for {{client}}: {{service}}. Delivery is due by {{deliveryDate}} for {{amount}}. Clear feedback, on-time payment, and a celebratory high-five included.",
      serious: "{{provider}} agrees to provide {{client}} with the following service: {{service}}. Delivery will take place no later than {{deliveryDate}}. In return, {{client}} will pay {{amount}} under the terms agreed by both parties.",
    },
  },
  {
    id: "simple-nda",
    title: "Simple NDA",
    description: "Keep one specific piece of shared information under wraps.",
    suggestedTone: "serious",
    variables: [
      { key: "partyOne", label: "First party", placeholder: "Camille Martin" },
      { key: "partyTwo", label: "Second party", placeholder: "Noa Bernard" },
      { key: "confidentialInfo", label: "Confidential information", placeholder: "the Project Orion prototype" },
      { key: "allowedPurpose", label: "Allowed use", placeholder: "assess a potential collaboration" },
      { key: "endDate", label: "Confidentiality end date", placeholder: "December 31, 2027" },
    ],
    body: {
      fun: "{{partyOne}} and {{partyTwo}} will keep this under lock and key: {{confidentialInfo}}. It may only be used to {{allowedPurpose}} and won't be shared with anyone else without prior agreement until {{endDate}}. Lips zipped, deal signed.",
      serious: "{{partyOne}} and {{partyTwo}} agree to keep the following information confidential: {{confidentialInfo}}. It may only be used to {{allowedPurpose}} and may not be shared with a third party without prior written agreement until {{endDate}}.",
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
