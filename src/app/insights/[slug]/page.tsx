import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Home } from 'lucide-react'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { LogoMark } from '@/components/LogoMark'
import { client } from '@/sanity/client'
import { INSIGHT_BY_SLUG_QUERY, INSIGHTS_SLUGS_QUERY } from '@/sanity/queries'
import { urlForImage } from '@/sanity/image'

export const revalidate = 3600
export const dynamicParams = true

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hazlsolutions.com'

type InsightDoc = {
  _id: string
  title: string
  slug: string
  excerpt: string
  body: any
  coverImage?: { asset?: { _ref?: string }; alt?: string } | null
  publishedAt: string
  _updatedAt: string
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
  author?: { name?: string; role?: string; bio?: string; avatar?: any } | null
}

export async function generateStaticParams() {
  const slugs = (await client.fetch<{ slug: string }[] | null>(INSIGHTS_SLUGS_QUERY, {})) ?? []
  return slugs.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await client.fetch<InsightDoc | null>(INSIGHT_BY_SLUG_QUERY, { slug: params.slug }, undefined)
  if (!post) return { title: 'Insight not found' }

  const ogImage = post.coverImage?.asset
    ? urlForImage(post.coverImage).width(1200).height(630).url()
    : '/brand/hazlCloud-logo-bw2.png'

  const title = post.seoTitle || post.title
  const description = post.seoDescription || post.excerpt

  return {
    title,
    description,
    alternates: { canonical: `/insights/${post.slug}` },
    openGraph: {
      type: 'article',
      url: `${siteUrl}/insights/${post.slug}`,
      title,
      description,
      publishedTime: post.publishedAt,
      modifiedTime: post._updatedAt,
      authors: post.author?.name ? [post.author.name] : undefined,
      tags: post.tags,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.coverImage?.alt || post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

const portableComponents: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2 className="approach-h2" style={{ maxWidth: 'none', marginTop: 48 }}>{children}</h2>,
    h3: ({ children }) => <h3 className="approach-h3" style={{ marginTop: 36 }}>{children}</h3>,
    blockquote: ({ children }) => (
      <blockquote className="insight-quote">{children}</blockquote>
    ),
    normal: ({ children }) => <p className="insight-paragraph">{children}</p>,
  },
  marks: {
    code: ({ children }) => <code className="insight-inline-code">{children}</code>,
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target={value?.newTab ? '_blank' : undefined}
        rel={value?.newTab ? 'noreferrer' : undefined}
        className="insight-link"
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }) => {
      const src = urlForImage(value).width(1600).url()
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={value?.alt || ''} loading="lazy" className="insight-body-image" />
      )
    },
    codeBlock: ({ value }) => (
      <pre className="insight-codeblock"><code>{value?.code}</code></pre>
    ),
  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function InsightArticlePage({ params }: { params: { slug: string } }) {
  const post = await client.fetch<InsightDoc | null>(
    INSIGHT_BY_SLUG_QUERY,
    { slug: params.slug },
    { next: { revalidate: 3600, tags: [`insight:${params.slug}`] } }
  )

  if (!post) notFound()

  const cover = post.coverImage?.asset
    ? urlForImage(post.coverImage).width(1600).url()
    : null

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/insights/${post.slug}`,
    },
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: cover ? [cover] : undefined,
    datePublished: post.publishedAt,
    dateModified: post._updatedAt,
    author: post.author?.name
      ? { '@type': 'Person', name: post.author.name }
      : { '@type': 'Organization', name: 'HAZL Solutions' },
    publisher: {
      '@type': 'Organization',
      name: 'HAZL Solutions',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/brand/hazlCloud-logo-bw2.png` },
    },
    keywords: post.tags?.join(', '),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Insights', item: `${siteUrl}/insights` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${siteUrl}/insights/${post.slug}` },
    ],
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
        <article className="insight-article">
          <div className="insight-article-meta">
            <Link href="/insights" className="insight-back">← All insights</Link>
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            {post.author?.name && <span> · {post.author.name}</span>}
          </div>

          <h1 className="approach-h1" style={{ textWrap: 'balance', marginTop: 12 }}>
            {post.title}
          </h1>
          <p className="lead" style={{ maxWidth: '60ch' }}>{post.excerpt}</p>

          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={post.coverImage?.alt || post.title} className="insight-hero-image" />
          )}

          <div className="insight-body">
            <PortableText value={post.body} components={portableComponents} />
          </div>

          <footer className="insight-article-footer">
            <Link href="/approach" className="about-link">
              See how we help teams ship reliably →
            </Link>
          </footer>
        </article>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  )
}
