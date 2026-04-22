/* --------------------------------------------------------------------------
   RubRatings — Pre-launch warm-up page
   File: app/page.tsx  (Next.js 14+ App Router, TypeScript)
   --------------------------------------------------------------------------
   Goals
   -----
   1. Capture consumer emails  ("Tell me when it launches")
   2. Capture venue operator interest ("List my venue — first 50 free")
   3. Hold the domain with a brand-correct editorial statement, not a
      generic "coming soon" placeholder.

   Brand rules honoured (per BrandGuidelines §3–4)
   -----------------------------------------------
   - Ink hero + Sand viewport below (dark-mode hero treatment)
   - Terracotta #C4513A is CTA fill, never on sage directly
   - Sage #7A9E7E is accent only (the dot, hairlines, eyebrow rules)
   - Playfair Display 900 for display; Inter for UI
   - Tagline "Find your next favourite" present, bracketed by sage hairlines
   - Sage dot at ~0.38 cap-height down from baseline (inline SVG wordmark)

   Dependencies
   ------------
   Fonts loaded via `next/font/google` (add to app/layout.tsx — see bottom
   of this file for the snippet).
   No external UI libs. Single file, inline styles for portability.
--------------------------------------------------------------------------- */

'use client';

import { useState, type FormEvent } from 'react';

// Brand tokens --------------------------------------------------------------
const C = {
  terracotta: '#C4513A',
  sand:       '#F5EDD6',
  sand60:     '#FBF6E8',
  sage:       '#7A9E7E',
  ink:        '#1A1A1A',
  ink80:      '#434343',
  ink60:      '#6E6E6E',
  ink20:      '#D9D9D9',
  errorBrick: '#A63A2B',
  hfGreen:    '#3F7A4E',
} as const;

type Audience = 'consumer' | 'venue';
type Status   = 'idle' | 'submitting' | 'success' | 'error';

// Inline wordmark -----------------------------------------------------------
// Matches §2 of BrandGuidelines: Playfair 900, sage dot between 't' pair of
// "Ratings", dot sits ~0.38 of cap-height down from baseline.
function Wordmark({ height = 28, color = C.ink, dotColor = C.sage }: {
  height?: number; color?: string; dotColor?: string;
}) {
  return (
    <svg
      height={height}
      viewBox="0 0 260 44"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Rub Ratings"
      style={{ display: 'block' }}
    >
      <text
        x="0"
        y="34"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight={900}
        fontSize="36"
        letterSpacing="-0.02em"
        fill={color}
      >
        Rub Ra<tspan>t</tspan>
        <tspan>ings</tspan>
      </text>
      {/* Sage dot — positioned over the 'i' in Ratings, ~0.38 cap-height down */}
      <circle cx="178.5" cy="19" r="3.2" fill={dotColor} />
    </svg>
  );
}

// Small UI atoms ------------------------------------------------------------
function Overline({ children, color = C.sage }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color,
    }}>
      {children}
    </span>
  );
}

function SageRule({ color = C.sage, width = 40 }: { color?: string; width?: number }) {
  return <span style={{ display: 'inline-block', width, height: 1, background: color, verticalAlign: 'middle' }} />;
}

// ==========================================================================
//  PAGE
// ==========================================================================
export default function WarmUpPage() {
  const [audience, setAudience] = useState<Audience>('consumer');
  const [email, setEmail]       = useState('');
  const [suburb, setSuburb]     = useState('');   // consumer only
  const [venueName, setVenue]   = useState('');   // venue only
  const [status, setStatus]     = useState<Status>('idle');
  const [errorMsg, setError]    = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setError('');

    try {
      const res = await fetch('/api/warmup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience,
          email,
          suburb:    audience === 'consumer' ? suburb    : undefined,
          venueName: audience === 'venue'    ? venueName : undefined,
          source: 'warmup_v1',
          ts: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <main style={{
      background: C.sand,
      color: C.ink,
      fontFamily: 'Inter, system-ui, sans-serif',
      minHeight: '100vh',
    }}>
      {/* =============================================================== */}
      {/*  HERO — Ink canvas, editorial grid, terracotta accent            */}
      {/* =============================================================== */}
      <section style={{
        position: 'relative',
        background: C.ink,
        color: C.sand,
        overflow: 'hidden',
      }}>
        {/* Behance-inspired editorial grid guides */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none',
          backgroundImage: `linear-gradient(${C.sand} 1px, transparent 1px), linear-gradient(90deg, ${C.sand} 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }} />
        {/* Terracotta corner wash */}
        <div aria-hidden style={{
          position: 'absolute', top: 0, right: 0, width: '38%', height: '100%',
          background: `linear-gradient(135deg, transparent 0%, ${C.terracotta} 120%)`,
          opacity: 0.35, pointerEvents: 'none',
        }} />

        {/* Top bar */}
        <div style={{
          position: 'relative',
          maxWidth: 1240, margin: '0 auto',
          padding: '28px 32px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Wordmark color={C.sand} dotColor={C.sage} height={26} />
          <span style={{ fontSize: 12, color: '#C9BFA1', letterSpacing: '0.04em' }}>
            Launching Sydney &amp; Melbourne · Winter 2026
          </span>
        </div>

        {/* Hero body */}
        <div style={{
          position: 'relative',
          maxWidth: 1240, margin: '0 auto',
          padding: '72px 32px 96px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <SageRule />
            <Overline>Massage · Wellness · Bodywork</Overline>
            <SageRule />
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 900,
            fontSize: 'clamp(44px, 7vw, 88px)',
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            maxWidth: 960,
            margin: 0,
          }}>
            Real rooms.<br />
            Named therapists.<br />
            <span style={{ color: C.terracotta }}>Honest</span>
            <span style={{
              display: 'inline-block',
              width: 12, height: 12, borderRadius: '50%',
              background: C.sage,
              margin: '0 18px 12px',
              verticalAlign: 'middle',
            }} />
            reviews.
          </h1>

          <p style={{
            marginTop: 32,
            maxWidth: 620,
            fontSize: 18,
            lineHeight: '30px',
            color: '#E8DFC5',
          }}>
            Australia&rsquo;s consumer-first massage directory. No ads. No
            paid-for top slots. A guide &mdash; not a booking engine. We&rsquo;re
            building it in public with Sydney and Melbourne first.
          </p>

          <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 14 }}>
            <SageRule color={C.sage} width={28} />
            <em style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 20,
              color: C.sand,
            }}>
              Find your next favourite<span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: C.sage, marginLeft: 6, marginBottom: 2,
                verticalAlign: 'middle',
              }} />
            </em>
          </div>
        </div>
      </section>

      {/* =============================================================== */}
      {/*  DUAL CTA — consumer / venue toggle                              */}
      {/* =============================================================== */}
      <section style={{
        maxWidth: 1240, margin: '0 auto',
        padding: '80px 32px 40px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 40,
        }}>
          {/* Left column — editorial copy for the selected audience */}
          <div style={{ gridColumn: 'span 5' }}>
            <Overline color={C.ink60}>
              {audience === 'consumer' ? '01 · For readers' : '02 · For venues'}
            </Overline>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 700,
              fontSize: 'clamp(28px, 3.4vw, 44px)',
              lineHeight: 1.12,
              letterSpacing: '-0.01em',
              margin: '16px 0 20px',
            }}>
              {audience === 'consumer'
                ? <>Be the first to know where to go.</>
                : <>The first fifty venues list free for three months.</>}
            </h2>
            <p style={{
              fontSize: 17, lineHeight: '28px', color: C.ink80,
              maxWidth: 520, margin: 0,
            }}>
              {audience === 'consumer'
                ? <>We&rsquo;re scoring 137 venues across Sydney and Melbourne on
                    ritual, pricing, named therapist, and health-fund
                    eligibility. When it opens, you get the list a week before
                    anyone else &mdash; plus a weekend pick, by suburb.</>
                : <>Your listing is editorial, not a form fill. We write about
                    the person who runs the room and the ritual your regulars
                    come back for. No lead-gen resale. No paid-for top slots.
                    Just a proper directory page that reads like Broadsheet.</>}
            </p>

            {/* Three quiet facts */}
            <ul style={{
              listStyle: 'none', padding: 0, margin: '36px 0 0',
              borderTop: `1px solid ${C.ink20}`,
            }}>
              {(audience === 'consumer'
                ? [
                    ['Launching', 'Winter 2026, Sydney + Melbourne'],
                    ['Coverage',  '~180 suburb-level pages at launch'],
                    ['Promise',   'No ads. No sponsored ranking. Ever.'],
                  ]
                : [
                    ['Cost',      'Free premium listing for 3 months (first 50)'],
                    ['Editorial', 'We write it. You approve before it goes live.'],
                    ['Control',   'Correct your listing any time. One email.'],
                  ]
              ).map(([k, v]) => (
                <li key={k} style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: 16,
                  padding: '16px 0',
                  borderBottom: `1px solid ${C.ink20}`,
                  fontSize: 14,
                }}>
                  <span style={{ color: C.ink60, letterSpacing: '0.04em' }}>{k}</span>
                  <span style={{ color: C.ink }}>{v}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right column — form card */}
          <div style={{ gridColumn: 'span 7' }}>
            <div style={{
              background: C.sand60,
              border: `1px solid ${C.ink20}`,
              borderRadius: 12,
              padding: '40px 44px',
            }}>
              {/* Audience toggle */}
              <div role="tablist" aria-label="Choose audience" style={{
                display: 'inline-flex',
                background: C.sand,
                border: `1px solid ${C.ink20}`,
                borderRadius: 999,
                padding: 4,
                marginBottom: 32,
              }}>
                {(['consumer', 'venue'] as Audience[]).map(a => {
                  const active = audience === a;
                  return (
                    <button
                      key={a}
                      role="tab"
                      aria-selected={active}
                      onClick={() => { setAudience(a); setStatus('idle'); }}
                      style={{
                        padding: '10px 20px',
                        fontSize: 13,
                        fontWeight: 500,
                        letterSpacing: '0.02em',
                        borderRadius: 999,
                        border: 'none',
                        cursor: 'pointer',
                        background: active ? C.ink : 'transparent',
                        color:      active ? C.sand : C.ink80,
                        transition: 'background 160ms ease, color 160ms ease',
                      }}
                    >
                      {a === 'consumer' ? 'I\u2019m a reader' : 'I run a venue'}
                    </button>
                  );
                })}
              </div>

              {status === 'success' ? (
                <SuccessPanel audience={audience} onAnother={() => {
                  setStatus('idle'); setEmail(''); setSuburb(''); setVenue('');
                }} />
              ) : (
                <form onSubmit={onSubmit} noValidate>
                  <FormField label="Email address" htmlFor="email" required>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={inputStyle}
                    />
                  </FormField>

                  {audience === 'consumer' ? (
                    <FormField label="Suburb you&rsquo;d search first" htmlFor="suburb">
                      <input
                        id="suburb"
                        type="text"
                        value={suburb}
                        onChange={e => setSuburb(e.target.value)}
                        placeholder="Surry Hills, Fitzroy, Bondi&hellip;"
                        style={inputStyle}
                      />
                    </FormField>
                  ) : (
                    <FormField label="Venue name" htmlFor="venue" required>
                      <input
                        id="venue"
                        type="text"
                        required={audience === 'venue'}
                        value={venueName}
                        onChange={e => setVenue(e.target.value)}
                        placeholder="e.g. Chatswood Thai Massage"
                        style={inputStyle}
                      />
                    </FormField>
                  )}

                  {status === 'error' && (
                    <p style={{
                      color: C.errorBrick, fontSize: 13, margin: '0 0 16px',
                    }}>{errorMsg || 'Something went wrong. Please try again.'}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    style={{
                      marginTop: 8,
                      width: '100%',
                      padding: '16px 24px',
                      background: C.terracotta,
                      color: C.sand,
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 15,
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                      cursor: status === 'submitting' ? 'wait' : 'pointer',
                      opacity: status === 'submitting' ? 0.7 : 1,
                      transition: 'background 160ms ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget.style.background = C.ink); }}
                    onMouseLeave={e => { (e.currentTarget.style.background = C.terracotta); }}
                  >
                    {status === 'submitting'
                      ? 'Sending\u2026'
                      : audience === 'consumer'
                        ? 'Tell me when it launches'
                        : 'Claim my free listing'}
                  </button>

                  <p style={{
                    marginTop: 16, fontSize: 12, color: C.ink60, lineHeight: '18px',
                  }}>
                    {audience === 'consumer'
                      ? <>One email at launch, then a weekly suburb pick. Unsubscribe any time.</>
                      : <>We&rsquo;ll be in touch within 48 hours with your editorial-listing brief. No obligation.</>}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =============================================================== */}
      {/*  WHAT TO EXPECT — three quiet editorial tiles                    */}
      {/* =============================================================== */}
      <section style={{
        maxWidth: 1240, margin: '0 auto',
        padding: '80px 32px 96px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <SageRule color={C.sage} width={28} />
          <Overline color={C.ink60}>What to expect</Overline>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
        }}>
          {[
            {
              n: '01',
              title: 'Editorial listings',
              body: 'Every venue is written up, not scraped. Named therapists, signature rituals, real rooms &mdash; the details regulars remember.',
            },
            {
              n: '02',
              title: 'Six-dimension scoring',
              body: 'Ritual, pricing transparency, named therapist, health-fund rebate, suburb fit, and booking ease. Never a single star count.',
            },
            {
              n: '03',
              title: 'No paid-for ranking',
              body: 'Premium listings get editorial room on their own page. They do not move up the list. The order is the order.',
            },
          ].map(card => (
            <article key={card.n} style={{
              background: C.sand60,
              border: `1px solid ${C.ink20}`,
              borderRadius: 12,
              padding: 28,
            }}>
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 900,
                fontSize: 48,
                lineHeight: 1,
                color: C.terracotta,
                marginBottom: 16,
              }}>{card.n}</div>
              <h3 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 700,
                fontSize: 22,
                margin: '0 0 10px',
              }}>{card.title}</h3>
              <p style={{
                fontSize: 15, lineHeight: '24px', color: C.ink80, margin: 0,
              }} dangerouslySetInnerHTML={{ __html: card.body }} />
            </article>
          ))}
        </div>
      </section>

      {/* =============================================================== */}
      {/*  FOOTER                                                          */}
      {/* =============================================================== */}
      <footer style={{
        background: C.ink,
        color: C.sand,
        padding: '56px 32px 32px',
      }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
            paddingBottom: 24,
            borderBottom: `1px solid #3A3A3A`,
          }}>
            <div>
              <Wordmark color={C.sand} dotColor={C.sage} height={24} />
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <SageRule color={C.sage} width={20} />
                <Overline>Find your next favourite</Overline>
              </div>
            </div>
            <p style={{
              fontSize: 13, color: '#C9BFA1', maxWidth: 380, margin: 0,
              lineHeight: '20px',
            }}>
              Australia&rsquo;s consumer-first massage &amp; wellness directory.
              Sydney and Melbourne at launch. Built in public.
            </p>
          </div>
          <div style={{
            paddingTop: 20,
            display: 'flex', flexWrap: 'wrap',
            justifyContent: 'space-between', gap: 12,
            fontSize: 12, color: '#8a8272',
          }}>
            <div>&copy; 2026 Rub Ratings &middot; ABN registered with ASIC &middot; rubratings.com.au</div>
            <div style={{ display: 'flex', gap: 20 }}>
              <a href="/privacy"  style={{ color: '#8a8272' }}>Privacy</a>
              <a href="/terms"    style={{ color: '#8a8272' }}>Terms</a>
              <a href="mailto:hello@rubratings.com.au" style={{ color: '#8a8272' }}>hello@rubratings.com.au</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ==========================================================================
//  Sub-components
// ==========================================================================

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  background: C.sand,
  border: `1px solid ${C.ink20}`,
  borderRadius: 8,
  fontSize: 15,
  fontFamily: 'Inter, system-ui, sans-serif',
  color: C.ink,
  outline: 'none',
  transition: 'border-color 160ms ease',
};

function FormField({
  label, htmlFor, required, children,
}: {
  label: string; htmlFor: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label htmlFor={htmlFor} style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: C.ink60,
        marginBottom: 8,
      }}
        // dangerouslySetInnerHTML so we can include &rsquo; in the label
        dangerouslySetInnerHTML={{ __html: label + (required ? ' *' : '') }}
      />
      {children}
    </div>
  );
}

function SuccessPanel({ audience, onAnother }: { audience: Audience; onAnother: () => void }) {
  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '6px 12px',
        background: C.hfGreen, color: C.sand,
        borderRadius: 999, fontSize: 12, fontWeight: 600,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        marginBottom: 20,
      }}>
        <span style={{
          display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
          background: C.sand,
        }} />
        You&rsquo;re on the list
      </div>
      <h3 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: 700,
        fontSize: 28,
        lineHeight: 1.15,
        margin: '0 0 12px',
      }}>
        {audience === 'consumer'
          ? 'Thank you. We\u2019ll write first.'
          : 'Thank you. A real human will reply.'}
      </h3>
      <p style={{ fontSize: 15, lineHeight: '24px', color: C.ink80, margin: 0, maxWidth: 460 }}>
        {audience === 'consumer'
          ? 'Watch your inbox the week before launch. No spam, ever — just the list and a weekend pick by suburb.'
          : 'We\u2019ll be in touch within 48 hours with a short editorial-listing brief and a sample writeup from your suburb.'}
      </p>
      <button
        type="button"
        onClick={onAnother}
        style={{
          marginTop: 28,
          padding: '10px 18px',
          background: 'transparent',
          color: C.ink,
          border: `1px solid ${C.ink}`,
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Submit another
      </button>
    </div>
  );
}

/* --------------------------------------------------------------------------
   SETUP SNIPPETS — add these to your app
   --------------------------------------------------------------------------

   1) app/layout.tsx  (load fonts and set the Sand background)

      import { Playfair_Display, Inter } from 'next/font/google';

      const playfair = Playfair_Display({
        subsets: ['latin'],
        weight: ['700', '900'],
        style:  ['normal', 'italic'],
        variable: '--font-playfair',
        display: 'swap',
      });
      const inter = Inter({
        subsets: ['latin'],
        weight: ['400', '500', '600'],
        variable: '--font-inter',
        display: 'swap',
      });

      export const metadata = {
        title: 'Rub Ratings — Find your next favourite',
        description:
          'Australia&rsquo;s consumer-first massage directory. ' +
          'Editorial listings, named therapists, honest reviews. ' +
          'Launching Sydney and Melbourne in Winter 2026.',
        openGraph: {
          title: 'Rub Ratings — Find your next favourite',
          description: 'Australia\u2019s consumer-first massage directory. Launching Winter 2026.',
          url: 'https://rubratings.com.au',
          siteName: 'Rub Ratings',
          type: 'website',
        },
      };

      export default function RootLayout({ children }: { children: React.ReactNode }) {
        return (
          <html lang="en-AU" className={`${playfair.variable} ${inter.variable}`}>
            <body style={{ margin: 0, background: '#F5EDD6', color: '#1A1A1A' }}>
              {children}
            </body>
          </html>
        );
      }

   2) app/api/warmup/route.ts  (email capture endpoint — Strapi or DB later)

      import { NextResponse } from 'next/server';

      // Swap this out for Strapi call, Resend, or a Postgres insert.
      export async function POST(req: Request) {
        const body = await req.json();
        const { audience, email, suburb, venueName } = body ?? {};

        if (!email || typeof email !== 'string' || !email.includes('@')) {
          return NextResponse.json({ ok: false, error: 'Invalid email' }, { status: 400 });
        }
        if (audience === 'venue' && !venueName) {
          return NextResponse.json({ ok: false, error: 'Venue name required' }, { status: 400 });
        }

        // TODO: persist to Strapi collection `WarmupSignup` with fields:
        //   audience (enum: consumer|venue), email, suburb?, venueName?, source, ts
        // Example (pseudo):
        //   await fetch(`${process.env.STRAPI_URL}/api/warmup-signups`, {
        //     method: 'POST',
        //     headers: {
        //       'Content-Type': 'application/json',
        //       Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
        //     },
        //     body: JSON.stringify({ data: { audience, email, suburb, venueName, source: body.source, ts: body.ts } }),
        //   });

        console.log('[warmup]', { audience, email, suburb, venueName });
        return NextResponse.json({ ok: true });
      }

   3) Mobile breakpoint (optional, add once happy with desktop)
      The grid uses `gridTemplateColumns: 'repeat(12, 1fr)'` — wrap in a media
      query via CSS module or styled-jsx to collapse to single column under 900px.

--------------------------------------------------------------------------- */
