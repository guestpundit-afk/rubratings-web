import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getSuburbBySlug,
  getServiceTypeBySlug,
  getVenuesByTaxonomy,
  getSiblingServiceTypesInSuburb,
  getSiblingSuburbsForServiceType,
  getQualifyingCombos,
  type Venue,
} from '@/lib/api';
import { getEditorial } from '@/lib/editorial';
import { generateEditorial } from '@/lib/editorial-generated';
import ClusterMap from '@/components/ClusterMap';
import VenueCard from '@/components/VenueCard';
import CrossTaxonomyLinks from '@/components/CrossTaxonomyLinks';

export const revalidate = 3600;
export const dynamicParams = true;

const MIN_VENUES_TO_INDEX = 3;

export async function generateStaticParams() {
  const combos = await getQualifyingCombos(MIN_VENUES_TO_INDEX);
  return combos.map((c) => ({
    city: c.citySlug,
    suburb: c.suburbUrlSegment,
    type: c.serviceSlug,
  }));
}

type Params = { city: string; suburb: string; type: string };

async function loadPageData({ city, suburb, type }: Params) {
  const suburbSlug = `${city}-${suburb}`;
  const [suburbRec, serviceType] = await Promise.all([
    getSuburbBySlug(suburbSlug),
    getServiceTypeBySlug(type),
  ]);
  if (!suburbRec || !serviceType) return null;
  if (suburbRec.city?.slug !== city) return null;

  const venues = await getVenuesByTaxonomy({
    citySlug: city,
    suburbSlug,
    serviceTypeSlug: type,
  });

  return { city, suburb, type, suburbSlug, suburbRec, serviceType, venues };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = await params;
  const data = await loadPageData(p);
  if (!data) return { title: 'Page not found — Rub Ratings' };

  const { suburbRec, serviceType, venues } = data;
  const cityName = suburbRec.city?.name ?? '';
  const count = venues.length;
  const title =
    count >= MIN_VENUES_TO_INDEX
      ? `${serviceType.name} in ${suburbRec.name}, ${cityName} — ${count} reviewed venues | Rub Ratings`
      : `${serviceType.name} in ${suburbRec.name}, ${cityName} | Rub Ratings`;
  const description =
    count >= MIN_VENUES_TO_INDEX
      ? `Every ${serviceType.name.toLowerCase()} room in ${suburbRec.name}, ${cityName} — reviewed, ranked A–B–C, with transparent pricing and health-fund eligibility. ${count} venues listed.`
      : `${serviceType.name} venues in ${suburbRec.name} — still building our coverage. Get notified when ${count === 0 ? 'the first' : `more`} venues are reviewed.`;

  return {
    title: title.slice(0, 70),
    description: description.slice(0, 170),
    alternates: { canonical: `/${p.city}/${p.suburb}/${p.type}` },
    robots:
      count >= MIN_VENUES_TO_INDEX
        ? { index: true, follow: true }
        : { index: false, follow: true },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const p = await params;
  const data = await loadPageData(p);
  if (!data) notFound();

  const { suburbRec, serviceType, venues } = data;
  const cityName = suburbRec.city?.name ?? '';
  const cityCentroid: [number, number] | undefined =
    suburbRec.centroidLat && suburbRec.centroidLng
      ? [Number(suburbRec.centroidLng), Number(suburbRec.centroidLat)]
      : suburbRec.city?.centroidLat && suburbRec.city?.centroidLng
      ? [Number(suburbRec.city.centroidLng), Number(suburbRec.city.centroidLat)]
      : undefined;

  const meetsQualityGate = venues.length >= MIN_VENUES_TO_INDEX;

  const [siblingTypes, siblingSuburbs] = await Promise.all([
    getSiblingServiceTypesInSuburb({
      citySlug: p.city,
      suburbSlug: data.suburbSlug,
      excludeSlug: p.type,
    }),
    getSiblingSuburbsForServiceType({
      citySlug: p.city,
      serviceTypeSlug: p.type,
      excludeSuburbSlug: data.suburbSlug,
    }),
  ]);

  const bespoke = getEditorial(p.city, data.suburbSlug, p.type);
  const editorial =
    bespoke ??
    (meetsQualityGate
      ? generateEditorial({
          cityName,
          suburbName: suburbRec.name,
          serviceName: serviceType.name,
          serviceShortDescription: serviceType.shortDescription,
          venues,
          siblingServices: siblingTypes.map((s) => ({ name: s.name, venueCount: s.venueCount })),
          siblingSuburbs: siblingSuburbs.map((s) => ({ name: s.name, venueCount: s.venueCount })),
        })
      : null);

  const pins = venues
    .filter((v): v is Venue & { latitude: number; longitude: number } =>
      v.latitude != null && v.longitude != null,
    )
    .map((v) => ({
      id: v.id,
      name: v.name,
      lat: Number(v.latitude),
      lng: Number(v.longitude),
      tier: v.tier,
      href: `/venue/${v.slug}`,
    }));

  // ----- Structured data -----
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rubratings.com.au';
  const pageUrl = `${siteUrl}/${p.city}/${p.suburb}/${p.type}`;
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: cityName, item: `${siteUrl}/${p.city}` },
      {
        '@type': 'ListItem',
        position: 3,
        name: suburbRec.name,
        item: `${siteUrl}/${p.city}/${p.suburb}`,
      },
      { '@type': 'ListItem', position: 4, name: serviceType.name, item: pageUrl },
    ],
  };
  const itemListLd = meetsQualityGate
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${serviceType.name} in ${suburbRec.name}, ${cityName}`,
        numberOfItems: venues.length,
        itemListElement: venues.map((v, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'LocalBusiness',
            '@id': `${siteUrl}/venue/${v.slug}`,
            name: v.name,
            address: v.streetAddress ?? v.address,
            telephone: v.phone,
            url: v.website,
            geo:
              v.latitude && v.longitude
                ? { '@type': 'GeoCoordinates', latitude: v.latitude, longitude: v.longitude }
                : undefined,
            aggregateRating: v.ratingAverage
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: v.ratingAverage,
                  reviewCount: v.ratingCount,
                }
              : undefined,
          },
        })),
      }
    : null;
  const faqLd =
    editorial && meetsQualityGate
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: editorial.faq.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }
      : null;

  return (
    <>
      <StructuredData data={breadcrumbLd} />
      {itemListLd && <StructuredData data={itemListLd} />}
      {faqLd && <StructuredData data={faqLd} />}

      <main className="min-h-screen bg-sand">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: cityName, href: `/${p.city}` },
              { label: suburbRec.name, href: `/${p.city}/${p.suburb}` },
              { label: serviceType.name, href: null },
            ]}
          />

          <header className="mt-6 lg:mt-10">
            <div className="text-xs uppercase tracking-widest text-sage font-semibold">
              {cityName} · {suburbRec.name}
            </div>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-ink">
              {editorial?.h1 ?? `${serviceType.name} in ${suburbRec.name}, ${cityName}`}
            </h1>
            {editorial?.lede ? (
              <p className="mt-4 text-xl text-ink-80 max-w-3xl leading-relaxed">{editorial.lede}</p>
            ) : serviceType.shortDescription ? (
              <p className="mt-4 text-xl text-ink-80 max-w-3xl leading-relaxed">
                {serviceType.shortDescription}
              </p>
            ) : null}
            <div className="mt-6 flex items-center gap-4 text-sm text-ink-60">
              <span>
                <strong className="text-ink">{venues.length}</strong>{' '}
                {venues.length === 1 ? 'venue' : 'venues'} reviewed
              </span>
              {!meetsQualityGate && (
                <span className="inline-flex items-center px-3 py-1 bg-amber/10 text-amber border border-amber/30 rounded-full text-xs font-semibold uppercase tracking-wider">
                  Coverage in progress
                </span>
              )}
            </div>
          </header>

          {!meetsQualityGate ? (
            <NoindexNotice
              venueCount={venues.length}
              suburbName={suburbRec.name}
              serviceName={serviceType.name}
            />
          ) : (
            <>
              {editorial && (
                <section className="mt-10 max-w-3xl space-y-5 text-lg text-ink-80 leading-relaxed">
                  {editorial.paragraphs.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </section>
              )}

              <section className="mt-12">
                <h2 className="font-display text-3xl font-black text-ink">
                  The list — ranked
                </h2>
                <p className="mt-2 text-sm text-ink-60">
                  Ordered by tier then review volume. Tier A = meets all five of our consumer-first
                  criteria. Tier B = strong local pick. Tier C = listed for coverage.
                </p>
                <div className="mt-6 grid gap-4">
                  {venues.map((v, i) => (
                    <VenueCard
                      key={v.id}
                      venue={v}
                      rank={i + 1}
                      contextCopy={editorial?.venueCopy[v.slug]}
                    />
                  ))}
                </div>
              </section>

              {pins.length >= 2 && (
                <section className="mt-14">
                  <h2 className="font-display text-3xl font-black text-ink">
                    The Newtown cluster
                  </h2>
                  <p className="mt-2 text-sm text-ink-60 max-w-2xl">
                    All eight rooms sit within an 800-metre walk of Newtown station. Tap a pin for
                    the venue name.
                  </p>
                  <div className="mt-6">
                    <ClusterMap pins={pins} center={cityCentroid} zoom={14} />
                  </div>
                  <p className="mt-3 text-xs text-ink-60">
                    Tiles © OpenFreeMap · Map data © OpenStreetMap contributors. Venue
                    coordinates sourced from Google Places at seed.
                  </p>
                </section>
              )}

              {editorial && editorial.faq.length > 0 && (
                <section className="mt-14">
                  <h2 className="font-display text-3xl font-black text-ink">
                    Frequently asked
                  </h2>
                  <dl className="mt-6 divide-y divide-ink-20 border-y border-ink-20">
                    {editorial.faq.map((item, i) => (
                      <div key={i} className="py-5">
                        <dt className="font-display text-xl font-bold text-ink">{item.question}</dt>
                        <dd className="mt-2 text-ink-80 leading-relaxed">{item.answer}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              <CrossTaxonomyLinks
                sections={[
                  {
                    kind: 'service',
                    heading: `Other massage in ${suburbRec.name}`,
                    links: siblingTypes.map((s) => ({
                      href: `/${p.city}/${p.suburb}/${s.slug}`,
                      label: s.name,
                      venueCount: s.venueCount,
                    })),
                  },
                  {
                    kind: 'geo',
                    heading: `${serviceType.name} elsewhere in ${cityName}`,
                    links: siblingSuburbs.map((s) => ({
                      href: `/${p.city}/${s.slug.replace(new RegExp(`^${p.city}-`), '')}/${p.type}`,
                      label: s.name,
                      venueCount: s.venueCount,
                    })),
                  },
                ]}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}

function StructuredData({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}

function Breadcrumbs({
  items,
}: {
  items: { label: string; href: string | null }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-ink-60">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {item.href ? (
              <Link href={item.href} className="hover:text-terracotta underline-offset-4 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink-80" aria-current="page">
                {item.label}
              </span>
            )}
            {i < items.length - 1 && <span className="text-ink-20">›</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function NoindexNotice({
  venueCount,
  suburbName,
  serviceName,
}: {
  venueCount: number;
  suburbName: string;
  serviceName: string;
}) {
  return (
    <section className="mt-10 p-6 sm:p-8 bg-sand-60 border border-ink-20 rounded-lg max-w-2xl">
      <h2 className="font-display text-2xl font-bold text-ink">
        Coverage for {serviceName} in {suburbName} is still building.
      </h2>
      <p className="mt-3 text-ink-80 leading-relaxed">
        We currently list{' '}
        <strong>
          {venueCount} reviewed {venueCount === 1 ? 'venue' : 'venues'}
        </strong>{' '}
        for this combination — below our three-venue threshold for ranked pages. This page won&apos;t
        show up in search results until we have enough coverage to rank rooms meaningfully.
      </p>
      <p className="mt-4 text-ink-80 leading-relaxed">
        If you run or use a {serviceName.toLowerCase()} venue in {suburbName} that should be on this
        list, tell us — and we&apos;ll email you when the page is live.
      </p>
      <form
        className="mt-6 flex flex-col sm:flex-row gap-3"
        action="/api/coverage-request"
        method="post"
      >
        <input type="hidden" name="context" value={`${serviceName} in ${suburbName}`} />
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="flex-1 px-4 py-3 border border-ink-20 rounded bg-sand text-ink placeholder-ink-60 focus:outline-none focus:border-terracotta"
        />
        <button
          type="submit"
          className="px-5 py-3 bg-terracotta text-sand font-semibold rounded hover:bg-brick transition-colors"
        >
          Notify me
        </button>
      </form>
    </section>
  );
}

