/**
 * Strapi API client — minimal read-only wrapper for ISR pages.
 *
 * The frontend talks to Strapi v5 via plain `fetch` with Next.js cache tags,
 * so pages can be revalidated on demand when Strapi content changes.
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';

export type Suburb = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  postcode: string | null;
  centroidLat: number | null;
  centroidLng: number | null;
  boundingBoxNE: unknown;
  boundingBoxSW: unknown;
  venueCount: number;
  indexable: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  introduction: string | null;
  city?: City | null;
};

export type City = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  state: string;
  timezone: string;
  centroidLat: number | null;
  centroidLng: number | null;
  defaultZoomLevel: number | null;
};

export type ServiceType = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  longDescription: string | null;
  targetKeywords: string[] | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

export type Venue = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  address: string;
  streetAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  googlePlaceId: string | null;
  nearestTransit: string | null;
  parkingNote: string | null;
  phone: string | null;
  website: string | null;
  priceMin: number | null;
  priceMax: number | null;
  healthFundStatus: 'confirmed' | 'probable' | 'no';
  bookingPlatform: string;
  freshaUrl: string | null;
  mindbodyUrl: string | null;
  brandArchetype: string | null;
  tier: 'A' | 'B' | 'C' | 'coverage-only';
  fitScore: number | null;
  signatureRitual: string | null;
  signatureRitualDescription: string | null;
  description: string | null;
  ratingAverage: number | null;
  ratingCount: number;
  namedTherapistCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
  coverPhoto: string | null;
  suburb?: Suburb | null;
  city?: City | null;
  serviceTypes?: ServiceType[];
  therapists?: { id: number; name: string; slug: string }[];
};

type StrapiList<T> = {
  data: T[];
  meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
};

/** Small qs serializer — builds the `?foo[bar][$eq]=baz&populate[0]=...` strings Strapi wants. */
function qs(params: Record<string, unknown>, prefix = ''): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const encodedKey = prefix ? `${prefix}[${encodeURIComponent(key)}]` : encodeURIComponent(key);
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (typeof v === 'object' && v !== null) {
          parts.push(qs(v as Record<string, unknown>, `${encodedKey}[${i}]`));
        } else {
          parts.push(`${encodedKey}[${i}]=${encodeURIComponent(String(v))}`);
        }
      });
    } else if (typeof value === 'object') {
      parts.push(qs(value as Record<string, unknown>, encodedKey));
    } else {
      parts.push(`${encodedKey}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.filter(Boolean).join('&');
}

async function strapiGet<T>(path: string, params: Record<string, unknown>, tag: string): Promise<T> {
  const url = `${STRAPI_URL}/api/${path}?${qs(params)}`;
  const res = await fetch(url, { next: { revalidate: 3600, tags: [tag] } });
  if (!res.ok) {
    throw new Error(`Strapi ${res.status} on ${url}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function getSuburbBySlug(slug: string): Promise<Suburb | null> {
  const data = await strapiGet<StrapiList<Suburb>>(
    'suburbs',
    {
      filters: { slug: { $eq: slug } },
      populate: ['city'],
      pagination: { pageSize: 1 },
    },
    `suburb:${slug}`,
  );
  return data.data[0] ?? null;
}

export async function getServiceTypeBySlug(slug: string): Promise<ServiceType | null> {
  const data = await strapiGet<StrapiList<ServiceType>>(
    'service-types',
    { filters: { slug: { $eq: slug } }, pagination: { pageSize: 1 } },
    `service-type:${slug}`,
  );
  return data.data[0] ?? null;
}

export async function getVenuesByTaxonomy(opts: {
  citySlug: string;
  suburbSlug: string;
  serviceTypeSlug: string;
  pageSize?: number;
}): Promise<Venue[]> {
  const data = await strapiGet<StrapiList<Venue>>(
    'venues',
    {
      filters: {
        city: { slug: { $eq: opts.citySlug } },
        suburb: { slug: { $eq: opts.suburbSlug } },
        serviceTypes: { slug: { $eq: opts.serviceTypeSlug } },
      },
      populate: ['suburb', 'city', 'serviceTypes', 'therapists', 'hours', 'pricing', 'signaturePhoto'],
      sort: ['tier:asc', 'ratingCount:desc', 'name:asc'],
      pagination: { pageSize: opts.pageSize ?? 50 },
    },
    `venues:${opts.citySlug}:${opts.suburbSlug}:${opts.serviceTypeSlug}`,
  );
  return data.data;
}

export async function getSiblingServiceTypesInSuburb(opts: {
  citySlug: string;
  suburbSlug: string;
  excludeSlug: string;
}): Promise<{ slug: string; name: string; venueCount: number }[]> {
  const data = await strapiGet<StrapiList<Venue>>(
    'venues',
    {
      filters: {
        city: { slug: { $eq: opts.citySlug } },
        suburb: { slug: { $eq: opts.suburbSlug } },
      },
      populate: ['serviceTypes'],
      pagination: { pageSize: 100 },
    },
    `venues-by-suburb:${opts.citySlug}:${opts.suburbSlug}`,
  );
  const counts = new Map<string, { slug: string; name: string; count: number }>();
  for (const v of data.data) {
    for (const st of v.serviceTypes ?? []) {
      if (st.slug === opts.excludeSlug) continue;
      const prev = counts.get(st.slug);
      if (prev) prev.count++;
      else counts.set(st.slug, { slug: st.slug, name: st.name, count: 1 });
    }
  }
  return [...counts.values()]
    .filter((x) => x.count >= 3)
    .sort((a, b) => b.count - a.count)
    .map((x) => ({ slug: x.slug, name: x.name, venueCount: x.count }));
}

/** Pull every published venue with the relations needed to aggregate pSEO inventory. */
export async function getAllVenuesForInventory(): Promise<Venue[]> {
  const pageSize = 100;
  const all: Venue[] = [];
  let page = 1;
  while (true) {
    const data = await strapiGet<StrapiList<Venue>>(
      'venues',
      {
        populate: ['city', 'suburb', 'serviceTypes'],
        pagination: { page, pageSize },
      },
      `venues-inventory:${page}`,
    );
    all.push(...data.data);
    if (page >= data.meta.pagination.pageCount) break;
    page++;
  }
  return all;
}

export type InventoryCombo = {
  citySlug: string;
  cityName: string;
  suburbSlug: string;
  suburbName: string;
  suburbUrlSegment: string;
  serviceSlug: string;
  serviceName: string;
  venueCount: number;
};

/** Build a flat list of (city, suburb, serviceType) combos with ≥3 published venues. */
export async function getQualifyingCombos(minVenues = 3): Promise<InventoryCombo[]> {
  const venues = await getAllVenuesForInventory();
  const counts = new Map<string, InventoryCombo>();
  for (const v of venues) {
    if (!v.city || !v.suburb || !v.serviceTypes?.length) continue;
    for (const st of v.serviceTypes) {
      const key = `${v.city.slug}|${v.suburb.slug}|${st.slug}`;
      const existing = counts.get(key);
      if (existing) {
        existing.venueCount++;
      } else {
        const prefix = `${v.city.slug}-`;
        const urlSegment = v.suburb.slug.startsWith(prefix)
          ? v.suburb.slug.slice(prefix.length)
          : v.suburb.slug;
        counts.set(key, {
          citySlug: v.city.slug,
          cityName: v.city.name,
          suburbSlug: v.suburb.slug,
          suburbName: v.suburb.name,
          suburbUrlSegment: urlSegment,
          serviceSlug: st.slug,
          serviceName: st.name,
          venueCount: 1,
        });
      }
    }
  }
  return [...counts.values()]
    .filter((c) => c.venueCount >= minVenues)
    .sort((a, b) => b.venueCount - a.venueCount);
}

export async function getAllCities(): Promise<City[]> {
  const data = await strapiGet<StrapiList<City>>(
    'cities',
    { sort: ['name:asc'], pagination: { pageSize: 50 } },
    'cities:all',
  );
  return data.data;
}

export async function getAllServiceTypes(): Promise<ServiceType[]> {
  const data = await strapiGet<StrapiList<ServiceType>>(
    'service-types',
    { sort: ['name:asc'], pagination: { pageSize: 100 } },
    'service-types:all',
  );
  return data.data;
}

export async function getAllSuburbs(): Promise<Suburb[]> {
  const data = await strapiGet<StrapiList<Suburb>>(
    'suburbs',
    {
      populate: ['city'],
      sort: ['name:asc'],
      pagination: { pageSize: 500 },
    },
    'suburbs:all',
  );
  return data.data;
}

export type VenueSearchOpts = {
  citySlug?: string;
  suburbSlug?: string;
  serviceTypeSlug?: string;
  healthFund?: 'any' | 'probable-plus' | 'confirmed';
  minFitScore?: number;
  pageSize?: number;
};

export async function searchVenues(opts: VenueSearchOpts): Promise<Venue[]> {
  const filters: Record<string, unknown> = {};
  if (opts.citySlug) filters.city = { slug: { $eq: opts.citySlug } };
  if (opts.suburbSlug) filters.suburb = { slug: { $eq: opts.suburbSlug } };
  if (opts.serviceTypeSlug) filters.serviceTypes = { slug: { $eq: opts.serviceTypeSlug } };
  if (opts.healthFund === 'confirmed') {
    filters.healthFundStatus = { $eq: 'confirmed' };
  } else if (opts.healthFund === 'probable-plus') {
    filters.healthFundStatus = { $in: ['confirmed', 'probable'] };
  }
  if (opts.minFitScore && opts.minFitScore > 0) {
    filters.fitScore = { $gte: opts.minFitScore };
  }

  const tag = [
    'search',
    opts.citySlug ?? '_',
    opts.suburbSlug ?? '_',
    opts.serviceTypeSlug ?? '_',
    opts.healthFund ?? '_',
    String(opts.minFitScore ?? 0),
  ].join(':');

  const data = await strapiGet<StrapiList<Venue>>(
    'venues',
    {
      filters,
      populate: ['suburb', 'city', 'serviceTypes'],
      sort: ['tier:asc', 'fitScore:desc', 'ratingCount:desc', 'name:asc'],
      pagination: { pageSize: opts.pageSize ?? 50 },
    },
    tag,
  );
  return data.data;
}

export async function getSiblingSuburbsForServiceType(opts: {
  citySlug: string;
  serviceTypeSlug: string;
  excludeSuburbSlug: string;
}): Promise<{ slug: string; name: string; venueCount: number }[]> {
  const data = await strapiGet<StrapiList<Venue>>(
    'venues',
    {
      filters: {
        city: { slug: { $eq: opts.citySlug } },
        serviceTypes: { slug: { $eq: opts.serviceTypeSlug } },
      },
      populate: ['suburb'],
      pagination: { pageSize: 200 },
    },
    `venues-by-service:${opts.citySlug}:${opts.serviceTypeSlug}`,
  );
  const counts = new Map<string, { slug: string; name: string; count: number }>();
  for (const v of data.data) {
    const s = v.suburb;
    if (!s || s.slug === opts.excludeSuburbSlug) continue;
    const prev = counts.get(s.slug);
    if (prev) prev.count++;
    else counts.set(s.slug, { slug: s.slug, name: s.name, count: 1 });
  }
  return [...counts.values()]
    .filter((x) => x.count >= 3)
    .sort((a, b) => b.count - a.count)
    .map((x) => ({ slug: x.slug, name: x.name, venueCount: x.count }));
}
