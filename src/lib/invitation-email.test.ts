import { describe, expect, it } from "vitest";
import { getMessageTranslator } from "@/i18n/messages";
import {
  buildInvitationEmail,
  LINK_TTL_DAYS,
  signingUrl,
} from "@/lib/invitation-email";

const recipient = {
  name: "Kevin <k>",
  email: "kevin@example.fr",
  token: "tok-ABC_123",
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
      { title: "Bet <fun>", tone: "fun", locale: "en", recipient },
      t,
      "notification@dickgnature.com",
    );

    expect(msg.from).toContain("notification@dickgnature.com");
    expect(msg.to).toBe("kevin@example.fr");
    // Sujet et texte restent bruts (pas de HTML) ; le lien et l'expiration sont dans le texte.
    expect(msg.subject).toContain("Bet <fun>");
    const link = signingUrl("en", recipient.token);
    expect(msg.text).toContain(link);
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
      { title: "Pari", tone: "fun", locale: "fr", recipient },
      t,
    );
    expect(msg.text).toContain(`/fr/sign/${recipient.token}`);
    expect(msg.subject).toMatch(/signer/i);
  });
});
