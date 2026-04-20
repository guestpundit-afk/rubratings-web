import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col flex-1 bg-sand">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-xs uppercase tracking-widest text-sage font-semibold">
          Rub · Ratings
        </div>
        <h1 className="mt-2 font-display text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-ink">
          Find your next favourite.
        </h1>
        <p className="mt-5 max-w-2xl text-xl text-ink-80 leading-relaxed">
          Australia&apos;s consumer-first massage and wellness review directory. Suburb-level
          search, honest reviews, transparent pricing.
        </p>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold text-ink">
            Proof-of-concept: one suburb, fully reviewed
          </h2>
          <p className="mt-2 text-ink-60 max-w-2xl">
            Week 1 of the build ships one page end-to-end — live Strapi data, ISR, editorial
            copy, MapLibre cluster map, structured data — to prove the pipeline works.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              href="/sydney/newtown/thai-massage"
              className="group block p-6 bg-sand-60 border border-ink-20 rounded-lg hover:border-terracotta transition-colors"
            >
              <div className="text-xs uppercase tracking-widest text-sage font-semibold">
                Sydney · Newtown
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-ink group-hover:text-terracotta">
                Thai Massage
              </div>
              <p className="mt-2 text-sm text-ink-80">
                Eight Thai-massage rooms within a ten-minute walk of Newtown station — ranked
                A–B–C with health-fund badges and Fresha booking links.
              </p>
            </Link>
            <Link
              href="/search"
              className="group block p-6 bg-sand-60 border border-ink-20 rounded-lg hover:border-terracotta transition-colors"
            >
              <div className="text-xs uppercase tracking-widest text-sage font-semibold">
                Directory
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-ink group-hover:text-terracotta">
                Search & filter
              </div>
              <p className="mt-2 text-sm text-ink-80">
                Filter every venue by city, suburb, service type, health-fund rebate, and our
                internal fit score.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
