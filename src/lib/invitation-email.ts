import { prisma } from "@/lib/db";
import { getMessageTranslator, normalizeLocale, type MessageTranslator } from "@/i18n/messages";
import type { Locale } from "@/i18n/routing";
import {
  createEmailTransport,
  type EmailMessage,
  type EmailTransport,
} from "@/lib/email-transport";
import { localizedPath, siteUrl } from "@/lib/seo";
import { LINK_TTL_MS, participantLinkState } from "@/lib/participants";

const DEFAULT_FROM_ADDRESS = "onboarding@resend.dev";

// TTL du lien exprimé en jours entiers, pour l'annoncer dans l'email (le participant sait combien
// de temps il lui reste). Dérivé de la source unique LINK_TTL_MS afin de rester cohérent si elle bouge.
export const LINK_TTL_DAYS = Math.round(LINK_TTL_MS / (1000 * 60 * 60 * 24));

export type InvitationRecipient = {
  name: string;
  email: string;
  token: string;
};

// Résultat d'un envoi de campagne d'invitations : combien sont partis, et les adresses en échec.
// L'échec est renvoyé (pas avalé) car l'email est le SEUL canal de distribution du lien — la couche
// action le remonte au créateur.
export type InvitationSendResult = {
  sent: number;
  failed: string[];
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// URL absolue et localisée du lien de signature tokenisé : `${SITE_URL}/{locale}/sign/{token}`
// (l'anglais reste sans préfixe, cf. routing). Le token base64url est sûr en URL.
export function signingUrl(locale: Locale, token: string): string {
  return new URL(localizedPath(locale, `sign/${token}`), siteUrl).toString();
}

// Rendu d'un email d'invitation dans la langue du contrat (namespace `invitationEmails`) et selon
// le ton (fun/serious). Le sujet et le texte restent bruts ; seules les valeurs injectées dans le
// HTML sont échappées, et le lien est produit via un gestionnaire `<link>` sous notre contrôle.
export function buildInvitationEmail(
  params: {
    title: string;
    tone: string;
    locale: Locale;
    recipient: InvitationRecipient;
    expiresDays?: number;
  },
  t: MessageTranslator,
  fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_ADDRESS,
): EmailMessage {
  const variant = params.tone === "fun" ? "fun" : "serious";
  const days = params.expiresDays ?? LINK_TTL_DAYS;
  const link = signingUrl(params.locale, params.recipient.token);

  return {
    from: `${t(`${variant}.sender`)} <${fromAddress}>`,
    to: params.recipient.email,
    subject: t(`${variant}.subject`, { title: params.title }),
    text: t(`${variant}.text`, {
      name: params.recipient.name,
      title: params.title,
      link,
      days,
    }),
    html: t.markup(`${variant}.html`, {
      name: escapeHtml(params.recipient.name),
      title: escapeHtml(params.title),
      days,
      p: (chunks) => `<p>${chunks}</p>`,
      strong: (chunks) => `<strong>${chunks}</strong>`,
      link: (chunks) => `<a href="${escapeHtml(link)}">${chunks}</a>`,
    }),
    attachments: [],
  };
}

// Envoie une invitation à signer à chaque destinataire, dans la langue et le ton du contrat. Un
// envoi qui échoue n'empêche pas les autres (Promise.allSettled) : les adresses en échec sont
// collectées, loguées, et renvoyées à l'appelant qui décide de la remontée à l'utilisateur.
export async function sendInvitationEmails(
  contractId: string,
  recipients: ReadonlyArray<InvitationRecipient>,
  transport: EmailTransport = createEmailTransport(),
): Promise<InvitationSendResult> {
  if (recipients.length === 0) {
    return { sent: 0, failed: [] };
  }

  const contract = await prisma.contract.findUniqueOrThrow({
    where: { id: contractId },
  });
  const locale = normalizeLocale(contract.locale);
  const t = await getMessageTranslator(locale, "invitationEmails");

  const outcomes = await Promise.allSettled(
    recipients.map((recipient) =>
      transport.send(
        buildInvitationEmail(
          { title: contract.title, tone: contract.tone, locale, recipient },
          t,
        ),
      ),
    ),
  );

  const failed: string[] = [];
  outcomes.forEach((outcome, index) => {
    if (outcome.status === "rejected") {
      const recipient = recipients[index];
      failed.push(recipient.email);
      console.error(
        `[invitation-email] envoi échoué pour ${recipient.email} (contrat ${contractId}) : ` +
          `${outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason)}`,
      );
    }
  });

  return { sent: recipients.length - failed.length, failed };
}

export type ResendInvitationResult =
  | { status: "sent" }
  | { status: "notFound" }
  | { status: "notOpen" }
  | { status: "sendFailed" };

// Renvoi manuel depuis la page créateur : ne renvoie l'email que pour un participant appartenant au
// contrat ET dont le lien est encore « ouvert » (ni signé ni expiré). Sinon, statut d'échec explicite.
export async function resendInvitation(
  contractId: string,
  participantId: string,
  transport: EmailTransport = createEmailTransport(),
): Promise<ResendInvitationResult> {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });
  if (!participant || participant.contractId !== contractId) {
    return { status: "notFound" };
  }
  if (participantLinkState(participant) !== "open") {
    return { status: "notOpen" };
  }

  const { failed } = await sendInvitationEmails(
    contractId,
    [
      {
        name: participant.name,
        email: participant.email,
        token: participant.token,
      },
    ],
    transport,
  );
  return failed.length > 0 ? { status: "sendFailed" } : { status: "sent" };
}
