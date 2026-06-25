// design-sync shim for `next/link` — the bundle renders outside Next, with no
// app-router context, so the real next/link would throw. This passthrough
// forwards to a plain <a>, stripping Next-only props. Aliased in
// .design-sync/tsconfig.dssync.json so esbuild resolves `next/link` here.
import * as React from 'react'

type NextLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string | { pathname?: string }
  prefetch?: boolean
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
  locale?: string | false
  passHref?: boolean
  legacyBehavior?: boolean
}

const Link = React.forwardRef<HTMLAnchorElement, NextLinkProps>(function Link(
  { href, prefetch, replace, scroll, shallow, locale, passHref, legacyBehavior, children, ...rest },
  ref,
) {
  const h = typeof href === 'string' ? href : href?.pathname ?? '#'
  return React.createElement('a', { ref, href: h, ...rest }, children)
})

export default Link
