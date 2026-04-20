/* --------------------------------------------------------------------------
   RubRatings — Warm-up signup endpoint
   File: app/api/warmup/route.ts
   --------------------------------------------------------------------------
   MVP: logs + validates. Swap the TODO for a Strapi POST once the
   `warmup-signup` collection exists in rubratings-api.

   Suggested Strapi collection (create in rubratings-api):
     warmup-signup
       audience    : enumeration [consumer, venue]   (required)
       email       : email                           (required, unique)
       suburb      : string                          (optional)
       venueName   : string                          (optional)
       source      : string                          (default: 'warmup_v1')
       submittedAt : datetime                        (default: now)
--------------------------------------------------------------------------- */

import { NextResponse } from 'next/server';

type Body = {
  audience?: 'consumer' | 'venue';
  email?: string;
  suburb?: string;
  venueName?: string;
  source?: string;
  ts?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { audience, email, suburb, venueName, source, ts } = body;

  if (audience !== 'consumer' && audience !== 'venue') {
    return NextResponse.json({ ok: false, error: 'Invalid audience' }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'Invalid email' }, { status: 400 });
  }
  if (audience === 'venue' && !venueName?.trim()) {
    return NextResponse.json({ ok: false, error: 'Venue name required' }, { status: 400 });
  }

  // -----------------------------------------------------------------------
  // TODO: replace this block with a Strapi write once the collection exists.
  //
  // const strapi = process.env.STRAPI_URL;
  // const token  = process.env.STRAPI_API_TOKEN;
  // if (strapi && token) {
  //   const r = await fetch(`${strapi}/api/warmup-signups`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: `Bearer ${token}`,
  //     },
  //     body: JSON.stringify({
  //       data: {
  //         audience, email, suburb, venueName,
  //         source: source ?? 'warmup_v1',
  //         submittedAt: ts ?? new Date().toISOString(),
  //       },
  //     }),
  //   });
  //   if (!r.ok) {
  //     const text = await r.text();
  //     console.error('[warmup] strapi error', r.status, text);
  //     return NextResponse.json({ ok: false, error: 'Storage error' }, { status: 500 });
  //   }
  // }
  // -----------------------------------------------------------------------

  console.log('[warmup]', {
    audience, email,
    suburb: suburb ?? null,
    venueName: venueName ?? null,
    source: source ?? 'warmup_v1',
    ts: ts ?? new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
