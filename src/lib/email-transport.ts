export type EmailAttachment = {
  filename: string;
  contentType: string;
  content: Uint8Array;
};

export type EmailMessage = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments: EmailAttachment[];
};

// Frontière provider-agnostic : le métier ne dépend ni du SDK ni du format d'API Resend.
export interface EmailTransport {
  send(message: EmailMessage): Promise<void>;
}

export class EmailTransportError extends Error {}

type FetchLike = typeof fetch;

export class ResendEmailTransport implements EmailTransport {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const response = await this.fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: message.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments.map((attachment) => ({
          filename: attachment.filename,
          content: Buffer.from(attachment.content).toString("base64"),
        })),
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new EmailTransportError(
        `Resend rejected the email (${response.status})${details ? `: ${details}` : "."}`,
      );
    }
  }
}

// Transport hors-ligne par défaut en local, en test et dans verify : aucune clé ni requête réseau.
export class LogEmailTransport implements EmailTransport {
  async send(message: EmailMessage): Promise<void> {
    console.info(
      `[email:log] ${message.subject} -> ${message.to} (${message.attachments.length} attachment(s))`,
    );
  }
}

// Transport de capture injectable : utile dans les tests et pour une prévisualisation locale.
export class CaptureEmailTransport implements EmailTransport {
  readonly messages: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.messages.push(message);
  }
}

export function createEmailTransport(
  env: Record<string, string | undefined> = process.env,
): EmailTransport {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (apiKey) {
    return new ResendEmailTransport(apiKey);
  }
  if (env.NODE_ENV === "production") {
    throw new EmailTransportError(
      "RESEND_API_KEY is required to send email in production.",
    );
  }
  return new LogEmailTransport();
}
