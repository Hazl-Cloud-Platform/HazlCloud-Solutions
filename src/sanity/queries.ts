import { groq } from 'next-sanity'

export const INSIGHTS_LIST_QUERY = groq`
  *[_type == "insight" && defined(slug.current) && !(_id in path("drafts.**"))]
    | order(coalesce(publishedAt, _createdAt) desc) {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      coverImage,
      publishedAt,
      _updatedAt,
      tags,
      "author": author->{ name, role }
    }
`

export const INSIGHT_BY_SLUG_QUERY = groq`
  *[_type == "insight" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    coverImage,
    body,
    publishedAt,
    _updatedAt,
    tags,
    seoTitle,
    seoDescription,
    "author": author->{ name, role, bio, avatar }
  }
`

export const INSIGHTS_SLUGS_QUERY = groq`
  *[_type == "insight" && defined(slug.current) && !(_id in path("drafts.**"))]{
    "slug": slug.current,
    _updatedAt
  }
`
