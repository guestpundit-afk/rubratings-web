/**
 * Hand-written editorial copy per suburb×service-type.
 *
 * Keyed on `${citySlug}|${suburbSlug}|${serviceSlug}`. The Week 1 proof-of-
 * concept ships one bespoke entry (Sydney / Newtown / Thai Massage). Weeks
 * 3–6 add the remaining suburb×type combos per the 70-hour card-copy budget
 * in Build package/REVIEW_SUMMARY_2026-04-18.md.
 *
 * Pages without a bespoke entry fall back to a data-driven template — the
 * programmatic-seo review flags generic filler as a thin-content risk, so
 * template pages are allowed to ship only when the quality gate (≥3 venues,
 * ≥300 words unique copy) can still be met.
 */

export type VenueCopy = {
  /** Keyed by venue slug. Short second-person paragraph shown under the venue card. */
  [venueSlug: string]: string;
};

export type EditorialEntry = {
  h1: string;
  lede: string;
  /** Editorial body — rendered as paragraphs. 300+ words total. */
  paragraphs: string[];
  faq: { question: string; answer: string }[];
  venueCopy: VenueCopy;
  /** Optional related reading / outbound references. */
  furtherReading?: { label: string; href: string }[];
};

const sydneyNewtownThai: EditorialEntry = {
  h1: 'Thai Massage in Newtown, Sydney',
  lede:
    "Eight Thai massage rooms within a ten-minute walk of Newtown station — the densest Thai-massage strip on Sydney's inner-west side. This is where to go when you want the real thing, not the day-spa adaptation.",
  paragraphs: [
    "Newtown's Thai-massage cluster runs almost the entire length of King Street, from the Missenden Road end down to the lighter, student-heavier blocks near Erskineville. Most rooms opened in the 2010s wave and have stayed open through the lease churn that closed other inner-west businesses — a useful proxy for whether locals actually keep coming back. A handful are health-fund eligible for remedial work; the rest run the traditional Thai format, which uses rhythmic compression, palming, and assisted stretching, delivered fully clothed on a floor mat with no oil.",
    "If you've had Thai massage before and want the real thing — not a Swedish-style oil massage with 'Thai' on the door — the three A-tier rooms on this list are the ones the Thai community in Sydney actually books. They are busier, they run later, and they tend to employ one or two senior therapists (Thai-trained, not locally trained) whose technique is noticeably different. The B-tier rooms are still competent; they tilt toward day-spa framing and a slightly gentler touch, and they're where to book if you're new to Thai massage and want a first session that won't over-shock your hamstrings.",
    "Pricing across Newtown's Thai rooms is tight — most sit between $70 and $110 for a 60-minute traditional Thai massage, with 90-minute sessions around $110–$160. The health-fund eligible venues generally charge a small premium for remedial time and will process on-the-spot HICAPS rebates. We list the booking platform and rebate status on each card below; if a venue takes walk-ins, we've flagged it (useful after work when you don't want to commit two hours ahead).",
    "A note on directions: every venue on this page is within an 800-metre walk of Newtown station, so you don't need to drive. Paid street parking on King Street is metered and tightly policed during the day; the residential side-streets north of King (Australia Street, Lennox Street) have 1P and 2P limits. If you're driving in from the inner west or Marrickville, the off-street spots behind the King Street Plaza are your best bet on a weekend.",
  ],
  faq: [
    {
      question: 'Is traditional Thai massage the same as deep-tissue or remedial massage?',
      answer:
        "No. Traditional Thai massage uses compression, palming, and assisted stretching while you're fully clothed on a floor mat — no oil, no sheets. Remedial and deep-tissue massage use direct pressure on specific muscle groups with oil, on a table. Most Newtown Thai venues offer both traditional Thai and a separate oil-massage menu, so read the service list before booking.",
    },
    {
      question: 'Can I claim Thai massage on my private health fund?',
      answer:
        'Only if the session is booked as remedial massage under a therapist with recognised credentials — not the traditional Thai format. Of the eight Newtown venues, the three A-tier rooms have remedial-eligible therapists and will process HICAPS rebates on the spot; look for the "health-fund eligible" badge on the cards below.',
    },
    {
      question: 'How long should my first Thai-massage session be?',
      answer:
        "60 minutes is enough to cover the whole body at a steady pace. 90 minutes gives the therapist room to spend longer on the areas you flag up front (usually hips, shoulders, neck). Anything under 60 minutes tends to feel rushed — Thai massage isn't worth doing at 30 minutes unless it's a targeted foot or back-only session.",
    },
    {
      question: 'Are walk-ins possible, or do I need to book?',
      answer:
        "Walk-ins are usually fine for a 60-minute session on weekday afternoons and can be worth a try on a Sunday evening. For 90-minute or couples bookings, and for anything on a Friday or Saturday evening, book at least a day ahead. Several venues on this page use Fresha, which will show you live availability — we've linked to each venue's booking page where one exists.",
    },
    {
      question: "What's the difference between Tier A and Tier B venues on this list?",
      answer:
        "Tier A means the room meets our consumer-first criteria on all five dimensions we score — genuine Thai-trained technique, transparent pricing, consistent hygiene signals, strong review volume, and either named therapists or a stable roster. Tier B venues are solid, but miss one or two dimensions — most commonly a lighter tourist-oriented technique rather than the real traditional style, or a less stable therapist roster.",
    },
    {
      question: 'Which Newtown Thai room is best for an injury or a stiff back?',
      answer:
        'Book with one of the remedial-eligible venues (look for the health-fund badge) and ask for a therapist who does combined remedial + Thai. Traditional Thai without the remedial overlay is excellent for mobility and fascial glide, but for a localised injury you want someone who can point-load specific tissue.',
    },
  ],
  venueCopy: {
    'organic-thai-massage-newtown-newtown':
      "Organic Thai is the community-favourite anchor of the Newtown strip — 1,500+ reviews and a 4.9 average, which is the highest rated venue on this list. Strong remedial capability alongside traditional Thai, and one of the few Newtown rooms that reliably processes health-fund rebates.",
    'secret-world-thai-massage-newtown':
      "Secret World runs a quieter room than most of its King Street neighbours, with a calmer front-of-house feel and a tighter focus on full-body Thai + hot stone combinations. A good pick if you find the busier rooms overstimulating.",
    'blue-sky-thai-massage-newtown-newtown':
      "Blue Sky is the closest thing Newtown has to a 'beginner-friendly' Thai room without stepping down to tourist-style technique. Strong on hip and shoulder work, and their remedial option is a genuine hybrid rather than a Thai-with-oil.",
    'nahm-thai-massage-newtown':
      "Nahm sits a block off King Street and runs a little later than the main cluster, which makes it the go-to for an after-dinner session. Their deep-tissue add-on is firmer than most Newtown rooms — worth flagging if you prefer stronger pressure.",
    'thai-villa-massage-spa-newtown-newtown':
      "Thai Villa leans spa-side, with a reflexology menu and hot-stone work alongside traditional Thai. If you're combining a couples booking with a foot spa, this is the room most set up for it on the strip.",
    'senses-co-thai-massage-newtown':
      "Senses & Co. runs a mid-sized operation that balances traditional Thai with a remedial menu. Fair pricing, steady quality, and a solid first stop if you're new to the Newtown strip.",
    'newtown-thai-massage-newtown':
      "Traditional Thai format, no frills, lower-priced than the A-tier rooms — a reasonable walk-in option on a weekday, particularly for a straight 60-minute session.",
    'best-thai-massage-and-day-spa-newtown-newtown':
      "Day-spa framing with traditional Thai on the menu alongside hot-stone and oil work. Good for couples bookings and gift-voucher use; less distinctive for solo traditional-Thai sessions than the A-tier rooms.",
  },
};

const registry: Record<string, EditorialEntry> = {
  'sydney|sydney-newtown|thai-massage': sydneyNewtownThai,
};

export function getEditorial(
  citySlug: string,
  suburbSlug: string,
  serviceSlug: string,
): EditorialEntry | null {
  return registry[`${citySlug}|${suburbSlug}|${serviceSlug}`] ?? null;
}
