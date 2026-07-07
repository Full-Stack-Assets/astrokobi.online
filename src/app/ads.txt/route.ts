// Serves /ads.txt to authorize the AdSense seller, derived from the publisher
// id (NEXT_PUBLIC_ADSENSE_CLIENT override, else siteConfig.adsenseClient).
import { ADSENSE_CLIENT } from '@/lib/ads';

export const dynamic = 'force-dynamic';

export function GET() {
  // No publisher id configured → 404. Emitting a record with an empty seller id
  // ("google.com, , DIRECT, …") is malformed per the IAB ads.txt spec and trips
  // validators; an absent file simply means "no declared sellers".
  if (!ADSENSE_CLIENT.trim()) {
    return new Response('Not Found', { status: 404 });
  }
  // "ca-pub-1234..." -> "pub-1234..."; f08c47fec0942fa0 is Google's fixed cert id.
  const publisherId = ADSENSE_CLIENT.replace(/^ca-/, '');
  const body = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
