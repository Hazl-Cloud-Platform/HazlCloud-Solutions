import type { MetadataRoute } from 'next'
import { client } from '@/sanity/client'
import { INSIGHTS_SLUGS_QUERY } from '@/sanity/queries'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hazlsolutions.com'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()

  let insightEntries: MetadataRoute.Sitemap = []
  try {
    const slugs = (await client.fetch<{ slug: string; _updatedAt: string }[] | null>(
      INSIGHTS_SLUGS_QUERY,
      {},
      { next: { revalidate: 3600, tags: ['insights'] } }
    )) ?? []
    insightEntries = slugs.map((s) => ({
      url: `${siteUrl}/insights/${s.slug}`,
      lastModified: s._updatedAt ? new Date(s._updatedAt) : lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch {
    // Sanity not configured yet — emit core routes only
  }

  // Gated on the same public flag as the CTAs: advertising the studio while it is
  // disabled would put a 404 in the sitemap.
  const studioEntry: MetadataRoute.Sitemap =
    process.env.NEXT_PUBLIC_VIBE_ENABLED === '1'
      ? [
          {
            url: `${siteUrl}/startup/studio`,
            lastModified,
            changeFrequency: 'monthly' as const,
            priority: 0.8,
          },
        ]
      : []

  return [
    ...studioEntry,
    {
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${siteUrl}/startup`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${siteUrl}/enterprise`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/approach`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/insights`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    ...insightEntries,
  ]
}
