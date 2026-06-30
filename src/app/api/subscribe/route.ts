import { NextResponse } from 'next/server';
import { subscribeEmail, newsletterConfigured } from '@/lib/newsletter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Lightweight in-memory rate limit. Serverless instances are ephemeral and not
// shared, so this throttles bursts per-instance rather than globally — a durable
// store (Vercel KV / Redis) is the production-grade upgrade. It still raises the
// cost of naive scripted abuse against this public, write-triggering endpoint.
const RATE_LIMIT = 5;
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

/** Reject obvious cross-site callers: if an Origin is present, its host must match the request host. */
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // same-origin form posts / non-browser clients may omit it
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 403 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  let email = '';
  let honeypot = '';
  try {
    const data = await req.json();
    email = typeof data?.email === 'string' ? data.email.trim() : '';
    honeypot = typeof data?.company === 'string' ? data.company : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot: real users never fill the hidden "company" field; bots do.
  // Pretend success without subscribing so the bot gets no signal.
  if (honeypot) {
    return NextResponse.json({ ok: true });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  if (!newsletterConfigured()) {
    return NextResponse.json({ error: 'The newsletter is not live yet.' }, { status: 503 });
  }

  const result = await subscribeEmail(email);
  if (!result.ok) {
    // Don't leak provider internals (status codes, validation text) to the client.
    // Keep the detail server-side for debugging.
    console.error('newsletter subscribe failed:', result.error);
    return NextResponse.json({ error: 'Subscription failed. Please try again later.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
