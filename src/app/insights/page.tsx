import Link from 'next/link'
import { Home } from 'lucide-react'
import { LogoMark } from '@/components/LogoMark'
import { client } from '@/sanity/client'
import { INSIGHTS_LIST_QUERY } from '@/sanity/queries'
import { urlForImage } from '@/sanity/image'

export const revalidate = 3600

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hazlsolutions.com'

type InsightListItem = {
  _id: string
  title: string
  slug: string
  excerpt: string
  publishedAt: string
  _updatedAt: string
  tags?: string[]
  coverImage?: { asset?: { _ref?: string }; alt?: string } | null
  author?: { name?: string; role?: string } | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function InsightsIndexPage() {
  const insights = (await client.fetch<InsightListItem[] | null>(
    INSIGHTS_LIST_QUERY,
    {},
    { next: { revalidate: 3600, tags: ['insights'] } }
  )) ?? []

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: insights.map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}/insights/${post.slug}`,
      name: post.title,
    })),
  }

  return (
    <>
      <header className="approach-nav">
        <Link href="/" className="approach-logo">
          <LogoMark className="approach-logo-mark" />
          <span className="approach-logo-word">HAZL</span>
          <span className="approach-logo-sub">Solutions</span>
        </Link>
        <nav className="approach-nav-links">
          <Link href="/" className="approach-home" aria-label="Home">
            <Home size={16} strokeWidth={1.5} />
          </Link>
          <Link href="/approach">Approach</Link>
          <Link href="/approach#contact">Contact</Link>
          <Link href="/insights" className="active">News</Link>
        </nav>
      </header>

      <main id="main-content" className="approach-main">
        <section className="approach-section opening">
          <div className="eyebrow">News & ideas</div>
          <h1 className="approach-h1" style={{ fontSize: 'clamp(26px, 3.4vw, 44px)', textWrap: 'wrap', whiteSpace: 'normal' }}>
            Updates from our team, plus the news and ideas worth sharing.
          </h1>
        </section>

        <section className="approach-section">
          {insights.length === 0 ? (
            <p className="lead">No posts yet. Check back soon.</p>
          ) : (
            <ul className="insights-grid">
              {insights.map((post) => {
                const cover = post.coverImage?.asset
                  ? urlForImage(post.coverImage).width(1200).height(630).url()
                  : null
                return (
                  <li key={post._id} className="insight-card">
                    <Link href={`/insights/${post.slug}`} className="insight-card-link">
                      {cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt={post.coverImage?.alt || post.title}
                          loading="lazy"
                          className="insight-cover"
                        />
                      )}
                      <div className="insight-meta">
                        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                        {post.author?.name && <span> · {post.author.name}</span>}
                      </div>
                      <h2 className="insight-title">{post.title}</h2>
                      <p className="insight-excerpt">{post.excerpt}</p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="insight-tags">
                          {post.tags.map((t) => (
                            <span key={t} className="insight-tag">{t}</span>
                          ))}
                        </div>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
    </>
  )
}
