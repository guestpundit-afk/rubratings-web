import Link from 'next/link';

export type TaxonomyKind = 'geo' | 'service' | 'condition' | 'practitioner';

export type CrossTaxonomyLink = {
  href: string;
  label: string;
  venueCount?: number;
};

export type CrossTaxonomySection = {
  kind: TaxonomyKind;
  heading: string;
  links: CrossTaxonomyLink[];
  maxLinks?: number;
};

type Props = {
  sections: CrossTaxonomySection[];
  /**
   * Minimum distinct taxonomy kinds that must appear in outbound links.
   * Per the 2026-04-18 pSEO review: every index page links to pages from ≥2
   * of (geo / service / condition / practitioner). Violations throw in dev
   * so they surface immediately; production renders what it has.
   */
  minDistinctTaxonomies?: number;
};

const COL_CLASS: Record<1 | 2 | 3 | 4, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export default function CrossTaxonomyLinks({
  sections,
  minDistinctTaxonomies = 2,
}: Props) {
  const populated = sections.filter((s) => s.links.length > 0);
  const distinctKinds = new Set(populated.map((s) => s.kind));

  if (
    process.env.NODE_ENV !== 'production' &&
    distinctKinds.size < minDistinctTaxonomies
  ) {
    throw new Error(
      `CrossTaxonomyLinks: index page must link to ≥${minDistinctTaxonomies} taxonomy kinds (geo/service/condition/practitioner); got ${distinctKinds.size} (${[...distinctKinds].join(', ') || 'none'}).`,
    );
  }

  if (populated.length === 0) return null;

  const colKey = (Math.min(populated.length, 4) as 1 | 2 | 3 | 4);

  return (
    <section className={`mt-14 grid gap-10 ${COL_CLASS[colKey]}`}>
      {populated.map((section) => {
        const cap = section.maxLinks ?? 6;
        return (
          <div key={`${section.kind}:${section.heading}`}>
            <h2 className="font-display text-2xl font-bold text-ink">
              {section.heading}
            </h2>
            <ul className="mt-4 space-y-2">
              {section.links.slice(0, cap).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-baseline justify-between gap-3 py-2 border-b border-ink-20 hover:border-terracotta group"
                  >
                    <span className="text-ink group-hover:text-terracotta font-medium">
                      {link.label}
                    </span>
                    {typeof link.venueCount === 'number' && (
                      <span className="text-sm text-ink-60 tabular-nums">
                        {link.venueCount} venues
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
