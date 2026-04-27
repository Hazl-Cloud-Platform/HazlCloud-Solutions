import { createClient, type SanityClient } from 'next-sanity'
import { apiVersion, dataset, projectId, useCdn, isSanityConfigured } from './env'

const realClient: SanityClient | null = isSanityConfigured
  ? createClient({ projectId, dataset, apiVersion, useCdn, perspective: 'published' })
  : null

type FetchOptions = { next?: { revalidate?: number | false; tags?: string[] } }

export const client = {
  fetch: async <T>(query: string, params: Record<string, unknown> = {}, options?: FetchOptions): Promise<T> => {
    if (!realClient) {
      return null as unknown as T
    }
    return realClient.fetch<T>(query, params, options as any)
  },
}

export const sanityClient = realClient
