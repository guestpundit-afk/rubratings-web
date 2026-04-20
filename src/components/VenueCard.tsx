import type { Venue } from '@/lib/api';
import Image from "next/image";
import VenuePlaceholderImage from "@/components/VenuePlaceholderImage";

type Props = {
  venue: Venue;
  rank: number;
  contextCopy?: string;
};

const TIER_LABEL: Record<string, string> = {
  A: 'Top pick',
  B: 'Strong local',
  C: 'Worth a look',
  'coverage-only': 'Listed',
};

const HF_LABEL: Record<string, string> = {
  confirmed: 'Health fund eligible',
  probable: 'Health fund likely',
  no: 'No health fund rebate',
};

export default function VenueCard({ venue, rank, contextCopy }: Props) {
  const priceRange =
    venue.priceMin && venue.priceMax
      ? `$${venue.priceMin}–${venue.priceMax}`
      : venue.priceMin
      ? `from $${venue.priceMin}`
      : null;

  const rating = venue.ratingAverage ? venue.ratingAverage.toFixed(1) : null;
  const tierLabel = TIER_LABEL[venue.tier] ?? 'Listed';
  const hfLabel = HF_LABEL[venue.healthFundStatus] ?? null;

  return (
    <article className="group relative flex flex-col bg-sand-60 border border-ink-20 rounded-lg overflow-hidden hover:border-terracotta transition-colors">
      <div className="relative aspect-[4/3] overflow-hidden">
        {venue.coverPhoto ? (
          <Image
            src={venue.coverPhoto}
            alt={venue.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <VenuePlaceholderImage
            venueName={venue.name}
            suburb={venue.suburb?.name}
            size="card"
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </div>
      <div className="flex flex-col gap-4 p-6">
      <div className="flex items-start gap-4">
        <div className="shrink-0 font-display text-5xl font-black leading-none text-terracotta tabular-nums">
          {String(rank).padStart(2, '0')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-60">
            <span className="inline-block px-2 py-0.5 bg-sand border border-ink-20 rounded-full">
              {tierLabel}
            </span>
            {venue.brandArchetype && (
              <span className="hidden sm:inline text-ink-60">
                {venue.brandArchetype.replace(/-/g, ' ')}
              </span>
            )}
          </div>
          <h3 className="mt-1 font-display text-2xl font-bold leading-tight text-ink">{venue.name}</h3>
          <p className="text-sm text-ink-80 mt-1">{venue.streetAddress ?? venue.address}</p>
        </div>
        {rating && (
          <div className="shrink-0 text-right">
            <div className="font-display text-3xl font-black text-ink leading-none">{rating}</div>
            <div className="text-xs text-ink-60">{venue.ratingCount} reviews</div>
          </div>
        )}
      </div>

      {contextCopy && <p className="text-ink-80 leading-relaxed">{contextCopy}</p>}

      {venue.signatureRitual && (
        <div className="border-l-2 border-sage pl-4">
          <div className="text-xs uppercase tracking-wider text-sage font-semibold">Signature ritual</div>
          <div className="font-medium text-ink">{venue.signatureRitual}</div>
          {venue.signatureRitualDescription && (
            <p className="text-sm text-ink-80 mt-1">{venue.signatureRitualDescription}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {priceRange && (
          <span className="inline-flex items-center gap-1 text-ink-80">
            <span className="font-semibold text-ink">{priceRange}</span>
            <span className="text-ink-60">per session</span>
          </span>
        )}
        {hfLabel && venue.healthFundStatus !== 'no' && (
          <span className="inline-flex items-center px-2 py-1 bg-hf/10 text-hf text-xs font-semibold rounded border border-hf/30">
            {hfLabel}
          </span>
        )}
        {venue.namedTherapistCount > 0 && (
          <span className="text-ink-60">
            {venue.namedTherapistCount} named {venue.namedTherapistCount === 1 ? 'therapist' : 'therapists'}
          </span>
        )}
      </div>

      {(venue.serviceTypes?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {venue.serviceTypes!.map((st) => (
            <span
              key={st.slug}
              className="inline-block px-2 py-1 bg-sand border border-ink-20 rounded text-xs text-ink-80"
            >
              {st.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm">
        {venue.phone && (
          <a href={`tel:${venue.phone}`} className="font-semibold text-terracotta hover:text-brick underline-offset-4 hover:underline">
            Call {venue.phone}
          </a>
        )}
        {(venue.freshaUrl || venue.website) && (
          <a
            href={venue.freshaUrl ?? venue.website!}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-terracotta hover:text-brick underline-offset-4 hover:underline"
          >
            {venue.freshaUrl ? 'Book on Fresha ↗' : 'Visit website ↗'}
          </a>
        )}
      </div>
      </div>
    </article>
  );
}
