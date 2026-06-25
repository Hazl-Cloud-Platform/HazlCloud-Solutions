import { renderOgImage } from '@/lib/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'HAZL Solutions — our approach: from MVP to production-ready'

export default function Image() {
  return renderOgImage({
    eyebrow: 'Our approach',
    title: 'From MVP to production-ready.',
    variant: 'enterprise',
  })
}
