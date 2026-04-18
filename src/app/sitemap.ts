import type { MetadataRoute } from 'next';
import { getQualifyingCombos } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rubratings.com.au';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const combos = await getQualifyingCombos(3);
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
  ];

  for (const c of combos) {
    entries.push({
      url: `${SITE_URL}/${c.citySlug}/${c.suburbUrlSegment}/${c.serviceSlug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  return entries;
}
