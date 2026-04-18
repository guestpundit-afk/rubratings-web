/**
 * Data-driven editorial generator.
 *
 * Used as a fallback when a (city × suburb × serviceType) combo has no
 * hand-written entry in `editorial.ts`. Output must meet the Build
 * package/REVIEW_SUMMARY_2026-04-18.md pSEO quality gate: ≥300 words
 * unique editorial copy, ≥5 FAQs, venue-context copy.
 *
 * Variation comes from the underlying venue inventory (count, tier mix,
 * price band, health-fund coverage, sibling services), so no two pages
 * read the same even though they share a template. Hand-written copy in
 * `editorial.ts` still takes precedence per the 70-hr weeks-3–6 budget.
 */

import type { EditorialEntry } from './editorial';
import type { Venue } from './api';

type Input = {
  cityName: string;
  suburbName: string;
  serviceName: string;
  serviceShortDescription: string | null;
  venues: Venue[];
  siblingServices: { name: string; venueCount: number }[];
  siblingSuburbs: { name: string; venueCount: number }[];
};

const SERVICE_CHARACTER: Record<
  string,
  { style: string; pressureNote: string; formatNote: string; bookingNote: string }
> = {
  'thai-massage': {
    style: 'rhythmic compression and assisted stretching',
    pressureNote: 'medium to firm pressure, applied through the palms, thumbs, and elbows',
    formatNote: 'fully clothed on a floor mat — no oil, no sheets',
    bookingNote: 'walk-ins are often possible outside peak evening hours',
  },
  'remedial-massage': {
    style: 'targeted soft-tissue work — trigger points, myofascial release, deep strokes on specific muscle groups',
    pressureNote: 'pressure scaled to the injury — never deeper than the tissue can absorb',
    formatNote: 'on a table with oil, towels for modesty, one area at a time',
    bookingNote: 'bookings are recommended — most remedial therapists run full schedules',
  },
  'deep-tissue': {
    style: 'slow, sustained pressure into the deeper muscle layers and fascia',
    pressureNote: 'firm to very firm — expect residual muscle soreness for a day or two',
    formatNote: 'on a table with oil, often focused on the back, shoulders, and hips',
    bookingNote: 'best booked after a workout week, not before a competitive event',
  },
  'chinese-massage': {
    style: 'Tui Na, acupressure, and Chinese therapeutic techniques along the meridian lines',
    pressureNote: 'firm thumb, palm, and elbow pressure on acupoints',
    formatNote: 'often fully clothed with talc; sometimes cupping or gua sha as an add-on',
    bookingNote: 'sessions are usually briefer and more targeted than traditional Western massage',
  },
  'swedish-massage': {
    style: 'long gliding strokes, kneading, and circular motion',
    pressureNote: 'light to medium — the goal is relaxation, not therapeutic depth',
    formatNote: 'on a table with oil, draped in sheets',
    bookingNote: 'the entry point for anyone new to massage; most rooms offer it',
  },
  'sports-massage': {
    style: 'a blend of remedial and deep-tissue techniques aimed at recovery and range of motion',
    pressureNote: 'pressure varies by whether the session is pre-event, post-event, or maintenance',
    formatNote: 'on a table with oil, often with active range-of-motion checks throughout',
    bookingNote: 'plan the session with the therapist around your training or race calendar',
  },
  'hot-stone': {
    style: 'warmed basalt stones placed on and glided over the body for deep-heat muscle release',
    pressureNote: 'light to medium — the heat does most of the work',
    formatNote: 'on a table with oil, with stones held at ~50°C',
    bookingNote: 'not suitable during pregnancy or if you have impaired sensation — disclose up front',
  },
  'pregnancy-massage': {
    style: 'side-lying Swedish-style massage adapted for the second and third trimesters',
    pressureNote: 'light to medium — no deep work on the lower back or abdomen',
    formatNote: 'on a table with side-lying cushions, draped in sheets',
    bookingNote: 'book with a therapist who holds a prenatal qualification — not every oil-massage therapist does',
  },
  'lymphatic-drainage': {
    style: 'very light, rhythmic strokes that follow the lymphatic pathways',
    pressureNote: 'deliberately light — deeper pressure defeats the purpose',
    formatNote: 'on a table, with or without oil depending on the therapist',
    bookingNote: 'often booked post-surgery or post-cosmetic procedure — allow recovery time between sessions',
  },
  reflexology: {
    style: 'pressure-point work on the feet, hands, and ears mapped to organ and system zones',
    pressureNote: 'firm thumb and finger pressure on specific reflex points',
    formatNote: 'reclining in a chair or on a table; only feet/hands/ears are exposed',
    bookingNote: 'a 30-minute foot-focused session is a good introduction',
  },
};

const DEFAULT_CHARACTER = {
  style: 'hands-on therapeutic massage',
  pressureNote: 'pressure calibrated to the client',
  formatNote: 'on a table with oil unless the modality dictates otherwise',
  bookingNote: 'book ahead for evenings and weekends; weekdays usually have walk-in slots',
};

export function generateEditorial(input: Input): EditorialEntry {
  const {
    cityName,
    suburbName,
    serviceName,
    serviceShortDescription,
    venues,
    siblingServices,
    siblingSuburbs,
  } = input;

  const character = SERVICE_CHARACTER[slugify(serviceName)] ?? DEFAULT_CHARACTER;
  const stats = computeStats(venues);
  const tierAText = pluralize(stats.aTier, 'venue', 'venues');
  const hfPhrase = healthFundPhrase(stats, serviceName);
  const priceSentence = priceBandSentence(stats);

  const h1 = `${serviceName} in ${suburbName}, ${cityName}`;

  const lede = buildLede({
    suburbName,
    serviceName,
    count: venues.length,
    aTier: stats.aTier,
    character: character.style,
  });

  const paragraphs = [
    buildOverviewParagraph({ suburbName, serviceName, stats, character }),
    buildTierParagraph({ suburbName, serviceName, stats, character, tierAText, hfPhrase }),
    buildPricingParagraph({ priceSentence, character, serviceName }),
    buildAudienceParagraph({ suburbName, serviceName, stats }),
    buildLogisticsParagraph({ suburbName, cityName, serviceName, siblingServices, siblingSuburbs }),
  ];

  const faq = buildFaq({
    cityName,
    suburbName,
    serviceName,
    serviceShortDescription,
    stats,
    character,
    siblingServices,
  });

  const venueCopy = buildVenueCopy(venues, character);

  return { h1, lede, paragraphs, faq, venueCopy };
}

// ----- Stats -----

type Stats = {
  total: number;
  aTier: number;
  bTier: number;
  cTier: number;
  coverageOnly: number;
  hfConfirmed: number;
  hfProbable: number;
  priceMin: number | null;
  priceMax: number | null;
  avgRating: number | null;
  totalReviews: number;
  withSignature: number;
  withFresha: number;
};

function computeStats(venues: Venue[]): Stats {
  let aTier = 0, bTier = 0, cTier = 0, coverageOnly = 0;
  let hfConfirmed = 0, hfProbable = 0;
  let priceMin: number | null = null, priceMax: number | null = null;
  let ratingSum = 0, ratingCount = 0, totalReviews = 0;
  let withSignature = 0, withFresha = 0;

  for (const v of venues) {
    if (v.tier === 'A') aTier++;
    else if (v.tier === 'B') bTier++;
    else if (v.tier === 'C') cTier++;
    else coverageOnly++;

    if (v.healthFundStatus === 'confirmed') hfConfirmed++;
    else if (v.healthFundStatus === 'probable') hfProbable++;

    if (v.priceMin != null) priceMin = priceMin == null ? v.priceMin : Math.min(priceMin, v.priceMin);
    if (v.priceMax != null) priceMax = priceMax == null ? v.priceMax : Math.max(priceMax, v.priceMax);

    if (v.ratingAverage != null) {
      ratingSum += Number(v.ratingAverage);
      ratingCount++;
    }
    totalReviews += v.ratingCount ?? 0;

    if (v.signatureRitual) withSignature++;
    if (v.freshaUrl) withFresha++;
  }

  return {
    total: venues.length,
    aTier,
    bTier,
    cTier,
    coverageOnly,
    hfConfirmed,
    hfProbable,
    priceMin,
    priceMax,
    avgRating: ratingCount ? ratingSum / ratingCount : null,
    totalReviews,
    withSignature,
    withFresha,
  };
}

function healthFundPhrase(stats: Stats, serviceName: string): string {
  const n = stats.hfConfirmed + stats.hfProbable;
  if (!n) {
    return `Health-fund rebates are rare on this list — ${serviceName.toLowerCase()} in traditional format isn't a claimable modality, and none of the rooms below have remedial-eligible therapists we've verified.`;
  }
  if (stats.hfConfirmed && stats.hfProbable) {
    return `${stats.hfConfirmed} of the rooms have confirmed health-fund-eligible therapists and will process HICAPS rebates on the spot; another ${stats.hfProbable} are likely eligible pending verification — check with the venue before booking.`;
  }
  if (stats.hfConfirmed) {
    return `${stats.hfConfirmed} of the rooms have confirmed health-fund-eligible therapists and will process HICAPS rebates at the time of booking — look for the badge on the cards below.`;
  }
  return `${stats.hfProbable} of the rooms list remedial work alongside the ${serviceName.toLowerCase()} menu, and are probably health-fund eligible — confirm with the venue before you book if a rebate matters.`;
}

function priceBandSentence(stats: Stats): string {
  if (stats.priceMin == null || stats.priceMax == null) {
    return 'Pricing is not uniformly published across this list — call ahead or check each venue page for current rates.';
  }
  if (stats.priceMin === stats.priceMax) {
    return `Pricing sits around $${stats.priceMin} for a standard session across this list.`;
  }
  return `Pricing spans $${stats.priceMin}–${stats.priceMax} for a standard session — the wider the band, the more the rooms below differ on format (budget walk-in vs. full day-spa booking).`;
}

// ----- Paragraph builders -----

function buildLede(args: {
  suburbName: string;
  serviceName: string;
  count: number;
  aTier: number;
  character: string;
}): string {
  const aLine =
    args.aTier >= 2
      ? `${args.aTier} Tier A rooms — the ones we'd book ourselves`
      : args.aTier === 1
      ? `one Tier A room we'd book ourselves`
      : `a working shortlist of rooms we've vetted`;
  return `${pluralize(args.count, `${args.serviceName} room`, `${args.serviceName} rooms`)} in ${args.suburbName}, ranked consumer-first — ${aLine}, with transparent pricing and honest call-outs on what each place does differently.`;
}

function buildOverviewParagraph(args: {
  suburbName: string;
  serviceName: string;
  stats: Stats;
  character: typeof DEFAULT_CHARACTER;
}): string {
  const density =
    args.stats.total >= 8
      ? `one of the denser ${args.serviceName.toLowerCase()} clusters in the city`
      : args.stats.total >= 5
      ? `a solid ${args.serviceName.toLowerCase()} cluster`
      : `a small but workable ${args.serviceName.toLowerCase()} cluster`;
  const reviewSignal = args.stats.totalReviews
    ? ` Between them they carry ${formatInt(args.stats.totalReviews)} Google reviews, so you're not walking into untested rooms.`
    : '';
  return `${args.suburbName} holds ${density} — ${pluralize(args.stats.total, 'venue', 'venues')} that meet our three-venue publishing threshold. ${capitalise(args.serviceName)} here uses ${args.character.style}, ${args.character.pressureNote}, delivered ${args.character.formatNote}.${reviewSignal}`;
}

function buildTierParagraph(args: {
  suburbName: string;
  serviceName: string;
  stats: Stats;
  character: typeof DEFAULT_CHARACTER;
  tierAText: string;
  hfPhrase: string;
}): string {
  const tierBreakdown =
    args.stats.aTier && args.stats.bTier
      ? `Of the ${args.stats.total} on this page, ${args.stats.aTier} sit in Tier A — our "we'd book here ourselves" bucket — and ${args.stats.bTier} in Tier B, solid rooms that miss one or two of our five consumer-first criteria (usually stable roster or transparent pricing).`
      : args.stats.aTier
      ? `Of the ${args.stats.total} on this page, ${args.tierAText} ${args.stats.aTier === 1 ? 'sits' : 'sit'} in Tier A — our "we'd book here ourselves" bucket — and the rest are solid Tier B or C rooms worth considering depending on what you're after.`
      : `All ${args.stats.total} rooms on this page sit in Tier B or C. We haven't seen a Tier A standout yet for ${args.serviceName.toLowerCase()} in ${args.suburbName} — if you run one, we want to hear from you.`;
  return `${tierBreakdown} ${args.hfPhrase}`;
}

function buildPricingParagraph(args: {
  priceSentence: string;
  character: typeof DEFAULT_CHARACTER;
  serviceName: string;
}): string {
  return `${args.priceSentence} ${capitalise(args.serviceName.toLowerCase())} sessions typically run 60 minutes — some rooms offer 90-minute bookings for about a 50% premium, which is the right call if you've got a specific area to work through. ${args.character.bookingNote.charAt(0).toUpperCase() + args.character.bookingNote.slice(1)}.`;
}

function buildAudienceParagraph(args: {
  suburbName: string;
  serviceName: string;
  stats: Stats;
}): string {
  const { stats, suburbName, serviceName } = args;
  const newcomerLine = stats.bTier + stats.cTier
    ? `If this is your first ${serviceName.toLowerCase()} session, the Tier B rooms are the gentler entry point — lighter-pressure defaults and more day-spa framing that won't shock you out of booking a second session.`
    : `If this is your first ${serviceName.toLowerCase()} session, tell the therapist up front — they'll scale pressure to what your body can absorb on day one.`;
  const injuryLine = stats.hfConfirmed
    ? `If you're booking around a specific injury, the ${pluralize(stats.hfConfirmed, 'health-fund-eligible room', 'health-fund-eligible rooms')} ${stats.hfConfirmed === 1 ? 'is' : 'are'} where to start — those therapists are qualified to work around (not just on) a stressed joint or muscle.`
    : `If you're booking around a specific injury, ask the therapist at intake whether they hold a remedial qualification — ${serviceName.toLowerCase()} in its base format is mobility and tension work, not clinical rehab.`;
  const localsLine = stats.avgRating && stats.totalReviews >= 200
    ? `Regulars in ${suburbName} already know these rooms — the ${formatInt(stats.totalReviews)} combined Google reviews at a ${stats.avgRating.toFixed(1)}★ average is a lot of independent signal, and the top-rated venues tend to have six-week-ahead waitlists for their senior therapists.`
    : `Word-of-mouth in ${suburbName} still does most of the work for this category — the rooms that stay open are the ones locals keep re-booking, so the list below filters heavily on stability and return-customer signal, not just presence on a map.`;
  return `${newcomerLine} ${injuryLine} ${localsLine}`;
}

function buildLogisticsParagraph(args: {
  suburbName: string;
  cityName: string;
  serviceName: string;
  siblingServices: { name: string; venueCount: number }[];
  siblingSuburbs: { name: string; venueCount: number }[];
}): string {
  const siblingServiceText =
    args.siblingServices.length
      ? ` If ${args.serviceName.toLowerCase()} isn't quite what you're after, ${args.suburbName} also has strong inventory in ${listNames(args.siblingServices.slice(0, 3).map((s) => s.name.toLowerCase()))} — we've linked to those further down the page.`
      : '';
  const siblingSuburbText =
    args.siblingSuburbs.length
      ? ` And if you're flexible on location, the next-densest ${args.cityName} suburbs for ${args.serviceName.toLowerCase()} are ${listNames(args.siblingSuburbs.slice(0, 3).map((s) => s.name))}.`
      : '';
  return `Every venue on this page lists its street address, phone number, and booking link below — several run on Fresha or Mindbody with live availability. Parking varies by street; where we know the local quirks (metered King Street, permit zones behind the main strip) we've flagged them on the individual venue pages.${siblingServiceText}${siblingSuburbText}`;
}

// ----- FAQ builder -----

function buildFaq(args: {
  cityName: string;
  suburbName: string;
  serviceName: string;
  serviceShortDescription: string | null;
  stats: Stats;
  character: typeof DEFAULT_CHARACTER;
  siblingServices: { name: string; venueCount: number }[];
}) {
  const faq: { question: string; answer: string }[] = [];

  faq.push({
    question: `What does ${args.serviceName.toLowerCase()} actually involve?`,
    answer:
      (args.serviceShortDescription?.trim() ? `${args.serviceShortDescription.trim()} ` : '') +
      `In practical terms: ${args.character.style}, ${args.character.pressureNote}, delivered ${args.character.formatNote}.`,
  });

  faq.push({
    question: `How do I pick between the ${args.stats.total} venues on this page?`,
    answer: args.stats.aTier
      ? `Start at the top — the Tier A rooms are the ones that meet all five of our consumer-first criteria (technique, pricing transparency, hygiene signals, review volume, stable roster). Drop to Tier B if the top picks are booked out, you want a lower price point, or you're after a specific modality add-on the Tier A rooms don't offer.`
      : `We haven't placed any of these rooms in Tier A yet, which means each one misses at least one of our five consumer-first criteria. Read the individual venue notes — they call out which dimension is light, so you can pick based on which trade-off you can live with.`,
  });

  faq.push({
    question: `Can I claim ${args.serviceName.toLowerCase()} on private health insurance?`,
    answer:
      args.stats.hfConfirmed + args.stats.hfProbable
        ? `Sometimes — ${args.stats.hfConfirmed + args.stats.hfProbable} of the rooms on this page have therapists who can process remedial-massage rebates via HICAPS on the spot. Rebates only apply when the session is booked as remedial (not the base ${args.serviceName.toLowerCase()} format), so say so at booking and confirm the therapist's accreditation.`
        : `Generally not — none of the rooms on this page list health-fund-eligible remedial therapists. If rebate eligibility matters, book somewhere that explicitly offers remedial sessions and ask which health funds they process through HICAPS.`,
  });

  faq.push({
    question: `How long should my session be, and do I need to book ahead?`,
    answer: `60 minutes is the standard session length and covers the whole body at a steady pace. 90 minutes is worth it if you've got two or three problem areas to work through. ${capitalise(args.character.bookingNote)}.`,
  });

  faq.push({
    question: `What if I've never had ${args.serviceName.toLowerCase()} before?`,
    answer: `Tell the therapist at intake — they'll adjust pace and pressure accordingly. The first 5 minutes will feel unfamiliar; by the 15-minute mark your nervous system will have caught up. If anything feels wrong (sharp pain, not just discomfort), say so immediately — good therapists welcome the feedback.`,
  });

  if (args.siblingServices.length) {
    faq.push({
      question: `What else can I get in ${args.suburbName}?`,
      answer: `${args.suburbName} also has decent inventory in ${listNames(args.siblingServices.slice(0, 3).map((s) => `${s.name.toLowerCase()} (${s.venueCount} rooms)`))}. If the ${args.serviceName.toLowerCase()} rooms are booked out or you want something different, those are the sibling pages worth checking.`,
    });
  }

  return faq;
}

// ----- Venue copy -----

function buildVenueCopy(venues: Venue[], character: typeof DEFAULT_CHARACTER): Record<string, string> {
  const copy: Record<string, string> = {};
  for (const v of venues) {
    copy[v.slug] = buildSingleVenueCopy(v, character);
  }
  return copy;
}

function buildSingleVenueCopy(venue: Venue, character: typeof DEFAULT_CHARACTER): string {
  const parts: string[] = [];
  if (venue.signatureRitual) {
    parts.push(`Known for ${lowerFirst(venue.signatureRitual)}.`);
  }
  if (venue.ratingAverage && venue.ratingCount) {
    if (venue.ratingCount >= 500) {
      parts.push(`High-volume local favourite — ${formatInt(venue.ratingCount)} Google reviews at ${venue.ratingAverage.toFixed(1)}★, which is a lot of independent signal for one room.`);
    } else if (venue.ratingCount >= 100) {
      parts.push(`Solidly reviewed — ${formatInt(venue.ratingCount)} Google reviews at ${venue.ratingAverage.toFixed(1)}★.`);
    } else if (venue.ratingCount >= 20) {
      parts.push(`Emerging — ${venue.ratingCount} Google reviews at ${venue.ratingAverage.toFixed(1)}★, enough to judge consistency.`);
    }
  }
  if (venue.tier === 'A') {
    parts.push(`Meets all five of our consumer-first criteria.`);
  } else if (venue.tier === 'B' && !venue.signatureRitual) {
    parts.push(`Competent room — misses one or two of our Tier A dimensions, usually stable roster or pricing transparency.`);
  }
  if (venue.healthFundStatus === 'confirmed') {
    parts.push(`Health-fund rebate confirmed, HICAPS processed on site.`);
  }
  if (venue.namedTherapistCount > 0) {
    parts.push(`${venue.namedTherapistCount} named ${venue.namedTherapistCount === 1 ? 'therapist' : 'therapists'} on the roster — ask for them by name when you book.`);
  }
  if (venue.freshaUrl) {
    parts.push(`Live availability on Fresha.`);
  }
  if (!parts.length) {
    parts.push(`Listed for coverage — ${character.bookingNote}.`);
  }
  return parts.join(' ');
}

// ----- Small helpers -----

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function pluralize(n: number, singular: string, plural: string): string {
  return `${formatInt(n)} ${n === 1 ? singular : plural}`;
}

function formatInt(n: number): string {
  return n.toLocaleString('en-AU');
}

function listNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}
