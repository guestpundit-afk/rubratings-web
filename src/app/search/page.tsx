import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getAllCities,
  getAllServiceTypes,
  getAllSuburbs,
  searchVenues,
  type Suburb,
  type VenueSearchOpts,
} from '@/lib/api';
import VenueCard from '@/components/VenueCard';

export const metadata: Metadata = {
  title: 'Search massage venues — Rub Ratings',
  description:
    'Filter Australian massage and wellness venues by city, suburb, service type, health fund eligibility and fit score.',
  robots: { index: false, follow: true },
};

type RawParams = { [key: string]: string | string[] | undefined };

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

const HF_OPTIONS: { value: NonNullable<VenueSearchOpts['healthFund']>; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'probable-plus', label: 'Likely or confirmed' },
  { value: 'confirmed', label: 'Confirmed only' },
];

const FIT_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Any' },
  { value: 40, label: '40+' },
  { value: 60, label: '60+' },
  { value: 80, label: '80+ (top tier)' },
];

function parseParams(raw: RawParams): VenueSearchOpts & { hasAny: boolean } {
  const city = first(raw.city);
  const suburb = first(raw.suburb);
  const type = first(raw.type);
  const hfRaw = first(raw.hf);
  const fitRaw = first(raw.minFit);

  const healthFund =
    hfRaw === 'confirmed' || hfRaw === 'probable-plus' ? hfRaw : 'any';
  const minFitScore = fitRaw ? Math.max(0, Math.min(100, Number(fitRaw) || 0)) : 0;

  return {
    citySlug: city || undefined,
    suburbSlug: suburb || undefined,
    serviceTypeSlug: type || undefined,
    healthFund,
    minFitScore,
    hasAny: Boolean(city || suburb || type || (hfRaw && hfRaw !== 'any') || minFitScore),
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const raw = await searchParams;
  const opts = parseParams(raw);

  const [cities, serviceTypes, suburbs] = await Promise.all([
    getAllCities(),
    getAllServiceTypes(),
    getAllSuburbs(),
  ]);

  const suburbsForCity: Suburb[] = opts.citySlug
    ? suburbs.filter((s) => s.city?.slug === opts.citySlug)
    : suburbs;

  const venues = opts.hasAny ? await searchVenues(opts) : [];

  return (
    <main className="min-h-screen bg-sand">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-60">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-terracotta underline-offset-4 hover:underline">
                Home
              </Link>
            </li>
            <li className="text-ink-20">›</li>
            <li className="text-ink-80" aria-current="page">
              Search
            </li>
          </ol>
        </nav>

        <header className="mt-6 lg:mt-10">
          <div className="text-xs uppercase tracking-widest text-sage font-semibold">
            Filter the directory
          </div>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-ink">
            Find your next favourite.
          </h1>
          <p className="mt-4 text-lg text-ink-80 max-w-2xl leading-relaxed">
            Narrow by city, suburb, service, health-fund rebate, and our internal fit score.
          </p>
        </header>

        <form method="get" className="mt-10 p-6 sm:p-8 bg-sand-60 border border-ink-20 rounded-lg">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="City" htmlFor="f-city">
              <select
                id="f-city"
                name="city"
                defaultValue={opts.citySlug ?? ''}
                className="w-full px-3 py-2 bg-sand border border-ink-20 rounded text-ink focus:outline-none focus:border-terracotta"
              >
                <option value="">Any city</option>
                {cities.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Suburb" htmlFor="f-suburb">
              <select
                id="f-suburb"
                name="suburb"
                defaultValue={opts.suburbSlug ?? ''}
                className="w-full px-3 py-2 bg-sand border border-ink-20 rounded text-ink focus:outline-none focus:border-terracotta"
              >
                <option value="">Any suburb{opts.citySlug ? '' : ' — pick a city first for faster browsing'}</option>
                {suburbsForCity.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                    {!opts.citySlug && s.city ? ` — ${s.city.name}` : ''}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Service type" htmlFor="f-type">
              <select
                id="f-type"
                name="type"
                defaultValue={opts.serviceTypeSlug ?? ''}
                className="w-full px-3 py-2 bg-sand border border-ink-20 rounded text-ink focus:outline-none focus:border-terracotta"
              >
                <option value="">Any service</option>
                {serviceTypes.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Health fund" htmlFor="f-hf">
              <select
                id="f-hf"
                name="hf"
                defaultValue={opts.healthFund ?? 'any'}
                className="w-full px-3 py-2 bg-sand border border-ink-20 rounded text-ink focus:outline-none focus:border-terracotta"
              >
                {HF_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Min fit score" htmlFor="f-fit">
              <select
                id="f-fit"
                name="minFit"
                defaultValue={String(opts.minFitScore ?? 0)}
                className="w-full px-3 py-2 bg-sand border border-ink-20 rounded text-ink focus:outline-none focus:border-terracotta"
              >
                {FIT_OPTIONS.map((o) => (
                  <option key={o.value} value={String(o.value)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="px-5 py-2 bg-terracotta text-sand font-semibold rounded hover:bg-brick transition-colors"
              >
                Apply filters
              </button>
              {opts.hasAny && (
                <Link
                  href="/search"
                  className="px-3 py-2 text-sm text-ink-80 hover:text-terracotta underline-offset-4 hover:underline"
                >
                  Clear
                </Link>
              )}
            </div>
          </div>
        </form>

        <section className="mt-10">
          {!opts.hasAny ? (
            <EmptyState />
          ) : venues.length === 0 ? (
            <NoResults />
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-3xl font-black text-ink">
                  {venues.length} {venues.length === 1 ? 'venue' : 'venues'}
                </h2>
                <p className="text-sm text-ink-60">
                  Sorted by tier, then fit score, then review volume.
                </p>
              </div>
              <div className="mt-6 grid gap-4">
                {venues.map((v, i) => (
                  <VenueCard key={v.id} venue={v} rank={i + 1} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="block text-xs uppercase tracking-wider text-ink-60 font-semibold">
        {label}
      </span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

function EmptyState() {
  return (
    <div className="p-6 sm:p-8 bg-sand-60 border border-ink-20 rounded-lg">
      <h2 className="font-display text-2xl font-bold text-ink">Pick a filter to start.</h2>
      <p className="mt-2 text-ink-80">
        Choose any combination above — city, suburb, service type, health fund, or minimum fit
        score — and hit <strong>Apply filters</strong>.
      </p>
    </div>
  );
}

function NoResults() {
  return (
    <div className="p-6 sm:p-8 bg-sand-60 border border-ink-20 rounded-lg">
      <h2 className="font-display text-2xl font-bold text-ink">No venues match those filters.</h2>
      <p className="mt-2 text-ink-80">
        Try loosening the fit score or health-fund filter, or clear the suburb to see the whole
        city.
      </p>
    </div>
  );
}
