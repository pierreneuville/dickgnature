import { describe, expect, it } from "vitest";
import { getMessageTranslator } from "@/i18n/messages";
import {
  buildInvitationEmail,
  LINK_TTL_DAYS,
  remainingDays,
  signingUrl,
} from "@/lib/invitation-email";

// Horloge figée : le lien expire dans exactement LINK_TTL_DAYS pour l'instant `NOW`.
const NOW = new Date("2026-08-12T10:00:00Z");
const FRESH_EXPIRY = new Date(NOW.getTime() + LINK_TTL_DAYS * 24 * 60 * 60 * 1000);

const recipient = {
  id: "p-1",
  name: "Kevin <k>",
  email: "kevin@example.fr",
  token: "tok-ABC_123",
  expiresAt: FRESH_EXPIRY,
};

describe("signingUrl", () => {
  it("builds an absolute tokenized link, unprefixed for the default locale", () => {
    const url = signingUrl("en", "tok-1");
    expect(url).toMatch(/^https?:\/\//);
    expect(new URL(url).pathname).toBe("/sign/tok-1");
  });

  it("prefixes non-default locales", () => {
    expect(new URL(signingUrl("fr", "tok-1")).pathname).toBe("/fr/sign/tok-1");
  });
});

describe("buildInvitationEmail", () => {
  it("renders the fun variant with the link, expiry and escaped HTML values", async () => {
    const t = await getMessageTranslator("en", "invitationEmails");
    const msg = buildInvitationEmail(
      { title: "Bet <fun>", tone: "fun", locale: "en", recipient, now: NOW },
      t,
      "notification@dickgnature.com",
    );

    expect(msg.from).toContain("notification@dickgnature.com");
    expect(msg.to).toBe("kevin@example.fr");
    // Sujet et texte restent bruts (pas de HTML) ; le lien et l'expiration sont dans le texte.
    expect(msg.subject).toContain("Bet <fun>");
    const link = signingUrl("en", recipient.token);
    expect(msg.text).toContain(link);
    // Lien tout juste émis → l'expiration annoncée vaut le TTL nominal.
    expect(msg.text).toContain(String(LINK_TTL_DAYS));
    // Le HTML porte une ancre vers le lien et échappe les valeurs injectées.
    expect(msg.html).toContain(`href="${link}"`);
    expect(msg.html).toContain("Bet &lt;fun&gt;");
    expect(msg.html).not.toContain("<fun>");
    expect(msg.html).toContain("Kevin &lt;k&gt;");
    // Aucune pièce jointe (contrairement à l'email de complétion).
    expect(msg.attachments).toHaveLength(0);
  });

  it("selects a distinct serious variant when the tone is serious", async () => {
    const t = await getMessageTranslator("en", "invitationEmails");
    const fun = buildInvitationEmail(
      { title: "X", tone: "fun", locale: "en", recipient },
      t,
    );
    const serious = buildInvitationEmail(
      { title: "X", tone: "serious", locale: "en", recipient },
      t,
    );
    expect(serious.subject).not.toBe(fun.subject);
    expect(serious.subject.toLowerCase()).toContain("invitation");
  });

  it("localizes content and the link to the contract locale", async () => {
    const t = await getMessageTranslator("fr", "invitationEmails");
    const msg = buildInvitationEmail(
      { title: "Pari", tone: "fun", locale: "fr", recipient, now: NOW },
      t,
    );
    expect(msg.text).toContain(`/fr/sign/${recipient.token}`);
    expect(msg.subject).toMatch(/signer/i);
  });

  it("announces the real remaining lifetime on a late resend, not the nominal TTL", async () => {
    const t = await getMessageTranslator("en", "invitationEmails");
    // Renvoi au 29e jour : il ne reste qu'un jour avant l'expiration persistée.
    const oneDayLeft = {
      ...recipient,
      expiresAt: new Date(NOW.getTime() + 24 * 60 * 60 * 1000),
    };
    const msg = buildInvitationEmail(
      { title: "Bet", tone: "fun", locale: "en", recipient: oneDayLeft, now: NOW },
      t,
    );
    expect(msg.text).toContain(" 1 ");
    expect(msg.text).not.toContain(String(LINK_TTL_DAYS));
  });
});

describe("remainingDays", () => {
  it("rounds up whole days left and floors at zero once expired", () => {
    const now = new Date("2026-08-12T10:00:00Z");
    const day = 24 * 60 * 60 * 1000;
    expect(remainingDays(new Date(now.getTime() + 30 * day), now)).toBe(30);
    // 23 h restantes → arrondi au jour supérieur = 1 (jamais « 0 jour » alors que le lien vit encore).
    expect(remainingDays(new Date(now.getTime() + 23 * 60 * 60 * 1000), now)).toBe(1);
    expect(remainingDays(new Date(now.getTime() - day), now)).toBe(0);
  });
});
