export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-01'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || ''
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
export const useCdn = false
export const readToken = process.env.SANITY_API_READ_TOKEN || ''
export const revalidateSecret = process.env.SANITY_REVALIDATE_SECRET || ''

export const isSanityConfigured = Boolean(projectId && dataset)
