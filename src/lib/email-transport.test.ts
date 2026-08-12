import { describe, expect, it, vi } from "vitest";
import {
  CaptureEmailTransport,
  createEmailTransport,
  EmailTransportError,
  LogEmailTransport,
  ResendEmailTransport,
  type EmailMessage,
} from "@/lib/email-transport";

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

const MESSAGE: EmailMessage = {
  from: "Dossiers signés <documents@example.fr>",
  to: "sam@example.fr",
  subject: "Votre contrat signé — Accord",
  text: "Votre copie est jointe.",
  html: "<p>Votre copie est jointe.</p>",
  attachments: [
    { filename: "accord.pdf", contentType: "application/pdf", content: PDF },
  ],
};

describe("email transports", () => {
  it("uses the offline log transport without a Resend key", () => {
    expect(createEmailTransport({})).toBeInstanceOf(LogEmailTransport);
  });

  it("fails closed without a Resend key in production", () => {
    expect(() =>
      createEmailTransport({ NODE_ENV: "production", RESEND_API_KEY: "   " }),
    ).toThrow(EmailTransportError);
  });

  it("uses Resend when a key is configured and maps the attachment", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    const transport = new ResendEmailTransport(
      "test-api-key",
      fetchMock,
    );

    await transport.send(MESSAGE);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer test-api-key" });
    const payload = JSON.parse(String(init?.body));
    expect(payload.to).toEqual(["sam@example.fr"]);
    expect(payload.attachments).toEqual([
      {
        filename: "accord.pdf",
        content: Buffer.from(PDF).toString("base64"),
      },
    ]);
    expect(createEmailTransport({ RESEND_API_KEY: " configured " })).toBeInstanceOf(
      ResendEmailTransport,
    );
  });

  it("surfaces a provider rejection", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("invalid sender", { status: 422 }));
    const transport = new ResendEmailTransport(
      "test-api-key",
      fetchMock,
    );

    await expect(transport.send(MESSAGE)).rejects.toBeInstanceOf(
      EmailTransportError,
    );
  });

  it("captures messages without network access", async () => {
    const transport = new CaptureEmailTransport();
    await transport.send(MESSAGE);
    expect(transport.messages).toEqual([MESSAGE]);
  });
});
