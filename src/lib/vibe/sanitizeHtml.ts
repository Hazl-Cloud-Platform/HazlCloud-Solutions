import { parse, serialize } from 'parse5'
import type { DefaultTreeAdapterMap } from 'parse5'

type Node = DefaultTreeAdapterMap['node']
type ChildNode = DefaultTreeAdapterMap['childNode']
type Element = DefaultTreeAdapterMap['element']
type ParentNode = DefaultTreeAdapterMap['parentNode']

/**
 * Turns a model-authored HTML string into a document we are willing to frame.
 *
 * The central decision: we do NOT try to scrub the model's document with regexes
 * and hope. We parse it and RECONSTRUCT it -- our own <head>, their sanitized
 * <body>. That matters because the Content-Security-Policy is delivered as a
 * <meta> tag, and a meta CSP only governs what comes AFTER it. "Insert it as the
 * first child of <head>" via regex fails on a document with no <head> at all
 * (extremely common -- browsers synthesise one), on `<HEAD>`, on `<head >`, on a
 * `<!-- <head> -->` comment appearing earlier, and on anything emitted before
 * `<html>`. Any one of those misses means scripts run with no policy. Owning
 * <head> outright removes the entire class of failure, and it also means <base>
 * and <meta http-equiv="refresh"> cannot exist in the output because we never
 * copy them.
 */

/** Pinned deliberately. The bare origin `https://cdn.tailwindcss.com` 302-redirects
 *  to the current version, and CSP drops the path component of a source expression
 *  once a redirect is involved -- so an unpinned URL both floats the version and
 *  weakens the policy. This exact URL serves 200 with no redirect. */
export const TAILWIND_CDN = 'https://cdn.tailwindcss.com/3.4.16'

const ALLOWED_STYLESHEET_ORIGINS = ['https://fonts.googleapis.com']
const ALLOWED_PRECONNECT_ORIGINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com']
const ALLOWED_IMAGE_ORIGINS = ['https://picsum.photos', 'https://fastly.picsum.photos']

/** Elements that create a nested browsing context or load a plugin. Dropped
 *  outright -- a mockup has no legitimate use for any of them. */
const FORBIDDEN_TAGS = new Set([
  'base',
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'applet',
  'portal',
  'meta',
  'link',
  'title',
  'html',
  'head',
  'body',
])

/**
 * The policy the framed document runs under.
 *
 * `connect-src 'none'` is the load-bearing directive: it kills fetch, XHR,
 * WebSocket, EventSource and sendBeacon. The system prompt asks the model not to
 * make network calls; this is what actually enforces it.
 *
 * `'unsafe-inline'` for script and style is unavoidable for a single
 * self-contained document, and is acceptable only because the frame runs in an
 * OPAQUE origin (sandbox="allow-scripts" with no allow-same-origin) and has no
 * network egress. WARNING: if anyone ever "tightens" this by adding a nonce or
 * 'strict-dynamic', 'unsafe-inline' becomes IGNORED per CSP3 and every
 * model-emitted inline script silently stops running.
 */
export function buildCsp(allowImageCdn: boolean): string {
  const img = allowImageCdn ? `data: ${ALLOWED_IMAGE_ORIGINS.join(' ')}` : 'data:'
  return [
    "default-src 'none'",
    `script-src 'unsafe-inline' ${TAILWIND_CDN}`,
    `style-src 'unsafe-inline' https://fonts.googleapis.com ${TAILWIND_CDN}`,
    'font-src https://fonts.gstatic.com data:',
    `img-src ${img}`,
    "connect-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
    "frame-src 'none'",
    "child-src 'none'",
    "object-src 'none'",
    "media-src 'none'",
    "worker-src 'none'",
    "manifest-src 'none'",
  ].join('; ')
}

function isElement(node: Node): node is Element {
  return 'tagName' in node
}

function getAttr(el: Element, name: string): string | undefined {
  return el.attrs.find((a) => a.name === name)?.value
}

function setAttr(el: Element, name: string, value: string): void {
  const existing = el.attrs.find((a) => a.name === name)
  if (existing) existing.value = value
  else el.attrs.push({ name, value })
}

function removeAttr(el: Element, name: string): void {
  el.attrs = el.attrs.filter((a) => a.name !== name)
}

function originAllowed(url: string, origins: string[]): boolean {
  return origins.some((o) => url === o || url.startsWith(`${o}/`))
}

function isTailwindCdn(url: string): boolean {
  return /^https:\/\/cdn\.tailwindcss\.com(\/|$)/.test(url)
}

interface Collected {
  fontLinks: string[]
  hasTailwind: boolean
}

/**
 * Recursively sanitizes body content in place, returning the nodes to keep.
 * Anything not explicitly permitted is dropped.
 */
function sanitizeChildren(parent: ParentNode, collected: Collected, allowImageCdn: boolean): void {
  const kept: ChildNode[] = []

  for (const child of parent.childNodes) {
    if (!isElement(child)) {
      // Text and comments are harmless; comments could carry markup that a
      // mis-parsing browser revives, so drop them rather than reason about it.
      if (child.nodeName === '#comment') continue
      kept.push(child)
      continue
    }

    const tag = child.tagName.toLowerCase()

    if (FORBIDDEN_TAGS.has(tag)) continue

    if (tag === 'script') {
      const src = getAttr(child, 'src')
      if (src === undefined) {
        // Inline script: permitted by design (mockups need tab switching and
        // modals) and already covered by 'unsafe-inline'.
        kept.push(child)
        continue
      }
      if (isTailwindCdn(src)) {
        // Normalise to the pinned URL so it matches the exact-path CSP source.
        setAttr(child, 'src', TAILWIND_CDN)
        collected.hasTailwind = true
        continue // hoisted into our own <head>
      }
      continue // any other external script is dropped
    }

    if (tag === 'a') {
      const href = getAttr(child, 'href')
      // Sandbox flags gate TOP-LEVEL navigation, but a link can still navigate
      // the frame itself -- which would replace the mockup with a stranger's site
      // inside our chrome. No CSP directive covers that, so neutralise the href.
      if (!href || !href.startsWith('#')) setAttr(child, 'href', '#')
      removeAttr(child, 'target')
      removeAttr(child, 'download')
      removeAttr(child, 'ping')
    }

    if (tag === 'form') {
      // Belt and braces over form-action 'none'.
      removeAttr(child, 'action')
      removeAttr(child, 'method')
      setAttr(child, 'onsubmit', 'return false')
    }

    if (tag === 'img' || tag === 'source') {
      const src = getAttr(child, 'src')
      const ok = src && (src.startsWith('data:image/') || (allowImageCdn && originAllowed(src, ALLOWED_IMAGE_ORIGINS)))
      if (!ok) {
        // Keep the element (layout depends on it) but blank the source, and give
        // it a neutral background so the design does not collapse.
        removeAttr(child, 'src')
        removeAttr(child, 'srcset')
        const style = getAttr(child, 'style') ?? ''
        setAttr(child, 'style', `${style};background:#e5e7eb`.replace(/^;/, ''))
      }
      removeAttr(child, 'crossorigin')
    }

    // Anything that can point at a URL we have not vetted.
    for (const attr of [...child.attrs]) {
      const v = attr.value.trim().toLowerCase()
      if (/^(javascript|data|vbscript):/.test(v) && attr.name !== 'src' && attr.name !== 'style') {
        removeAttr(child, attr.name)
      }
    }

    if ('childNodes' in child) sanitizeChildren(child, collected, allowImageCdn)
    kept.push(child)
  }

  parent.childNodes = kept
}

/** Pulls the font <link>s worth preserving out of the model's head. */
function collectHeadAssets(head: ParentNode, collected: Collected): void {
  for (const node of head.childNodes) {
    if (!isElement(node)) continue
    const tag = node.tagName.toLowerCase()

    if (tag === 'link') {
      const href = getAttr(node, 'href') ?? ''
      const rel = (getAttr(node, 'rel') ?? '').toLowerCase()
      if (rel.includes('stylesheet') && originAllowed(href, ALLOWED_STYLESHEET_ORIGINS)) {
        collected.fontLinks.push(`<link rel="stylesheet" href="${escapeAttr(href)}">`)
      } else if (rel.includes('preconnect') && originAllowed(href, ALLOWED_PRECONNECT_ORIGINS)) {
        const cross = getAttr(node, 'crossorigin') !== undefined ? ' crossorigin' : ''
        collected.fontLinks.push(`<link rel="preconnect" href="${escapeAttr(href)}"${cross}>`)
      }
      continue
    }

    if (tag === 'script') {
      const src = getAttr(node, 'src')
      if (src && isTailwindCdn(src)) collected.hasTailwind = true
    }
  }
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function findElement(root: ParentNode, tagName: string): Element | null {
  for (const node of root.childNodes) {
    if (isElement(node)) {
      if (node.tagName.toLowerCase() === tagName) return node
      if ('childNodes' in node) {
        const found = findElement(node, tagName)
        if (found) return found
      }
    }
  }
  return null
}

export interface SanitizeResult {
  html: string
  bytes: number
}

/**
 * Rebuilds `raw` as a safe, framable document. Never throws on malformed input --
 * parse5 is a spec-compliant parser and will produce a tree for anything.
 */
export function sanitizeMockupHtml(raw: string, opts: { allowImageCdn?: boolean; title?: string } = {}): SanitizeResult {
  const allowImageCdn = opts.allowImageCdn ?? true
  const doc = parse(raw)

  const head = findElement(doc, 'head')
  const body = findElement(doc, 'body')

  const collected: Collected = { fontLinks: [], hasTailwind: false }
  if (head) collectHeadAssets(head, collected)

  // Style blocks from the model's head are kept: they are inline CSS, covered by
  // style-src 'unsafe-inline', and dropping them would break the design.
  const headStyles: string[] = []
  if (head) {
    for (const node of head.childNodes) {
      if (isElement(node) && node.tagName.toLowerCase() === 'style') {
        headStyles.push(serializeElement(node))
      }
    }
  }

  let bodyHtml = ''
  if (body) {
    sanitizeChildren(body, collected, allowImageCdn)
    bodyHtml = serialize(body)
  }

  const rawTitle = opts.title ?? findTitle(doc) ?? 'Mockup'
  const title = escapeText(rawTitle.replace(/\s+/g, ' ').trim().slice(0, 120))

  // The CSP is the FIRST thing in <head> by construction, not by search-and-hope.
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Security-Policy" content="${escapeAttr(buildCsp(allowImageCdn))}">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${collected.fontLinks.join('\n')}
${collected.hasTailwind ? `<script src="${TAILWIND_CDN}"></script>` : ''}
${headStyles.join('\n')}
</head>
<body>
${bodyHtml}
</body>
</html>`

  return { html, bytes: Buffer.byteLength(html, 'utf8') }
}

/** parse5's serialize() emits a node's CHILDREN, so serializing an element needs
 *  a wrapper whose only child is that element. */
function serializeElement(el: Element): string {
  const holder = { nodeName: '#document-fragment', childNodes: [el] } as unknown as ParentNode
  return serialize(holder)
}

function findTitle(doc: ParentNode): string | null {
  const el = findElement(doc, 'title')
  if (!el) return null
  const text = el.childNodes.find((n) => n.nodeName === '#text')
  return text && 'value' in text ? (text.value as string) : null
}
