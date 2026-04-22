import "server-only";

// Minimal email client. Mirrors src/lib/payments/stripe-client.ts: a thin
// interface, a real fetch-backed implementation, and a test-swappable
// override. The real send path is a generic HTTPS POST to whatever transport
// the operator wires via EMAIL_API_URL + EMAIL_API_KEY (Postmark, Resend,
// Mailgun — the request shape is compatible enough). When no env is set we
// fall back to a logging client so dev environments don't blow up.

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  headers?: Record<string, string>;
  tag?: string;
};

export type EmailSendResult = {
  id: string;
  to: string;
  acceptedAt: string;
};

export interface EmailClient {
  send(message: EmailMessage): Promise<EmailSendResult>;
}

const httpEmailClient = (apiUrl: string, apiKey: string): EmailClient => ({
  send: async (message) => {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      error?: string;
    };
    if (!res.ok) {
      throw new Error(
        `[email] send to ${message.to} failed: ${json.error ?? res.status}`,
      );
    }
    return {
      id: json.id ?? `email_${Date.now()}`,
      to: message.to,
      acceptedAt: new Date().toISOString(),
    };
  },
});

const loggingEmailClient = (): EmailClient => ({
  send: async (message) => {
    // Dev fallback — no API key configured. Keep a visible breadcrumb so
    // missing config doesn't silently swallow outbound mail.
    console.warn(
      `[email] EMAIL_API_URL/EMAIL_API_KEY not set; logging send to ${message.to}: ${message.subject}`,
    );
    return {
      id: `log_${Date.now()}`,
      to: message.to,
      acceptedAt: new Date().toISOString(),
    };
  },
});

let override: EmailClient | null = null;

export const setEmailClient = (client: EmailClient | null): void => {
  override = client;
};

export const getEmailClient = (): EmailClient => {
  if (override) return override;
  const url = process.env.EMAIL_API_URL;
  const key = process.env.EMAIL_API_KEY;
  if (url && key) return httpEmailClient(url, key);
  return loggingEmailClient();
};
