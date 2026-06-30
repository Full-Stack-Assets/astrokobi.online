import type { NewsletterResult } from './index';

const API = 'https://api.buttondown.email/v1';

function headers() {
  return {
    'content-type': 'application/json',
    Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
  };
}

/** Add a subscriber. Treats an already-subscribed address as success (idempotent). */
export async function subscribeButtondown(email: string): Promise<NewsletterResult> {
  const res = await fetch(`${API}/subscribers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email_address: email }),
  });
  if (res.ok) return { ok: true };

  const text = await res.text();
  if (res.status === 400 && /already|exists/i.test(text)) return { ok: true };
  return { ok: false, error: `buttondown ${res.status}: ${text.slice(0, 200)}` };
}

/**
 * Create an email as a DRAFT in Buttondown for human review — it is NOT sent
 * automatically. Review and send it yourself from the Buttondown dashboard
 * (Emails → the draft → Send). To auto-send instead, change status to
 * 'about_to_send'.
 */
export async function sendEmailButtondown(subject: string, body: string): Promise<NewsletterResult> {
  const res = await fetch(`${API}/emails`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ subject, body, status: 'draft' }),
  });
  if (res.ok) return { ok: true };
  return { ok: false, error: `buttondown ${res.status}: ${(await res.text()).slice(0, 200)}` };
}
