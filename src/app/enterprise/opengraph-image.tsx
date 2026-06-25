import { renderOgImage } from '@/lib/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'HAZL Solutions — your technical partner in scaling AI-built products'

export default function Image() {
  return renderOgImage({
    eyebrow: 'Scale-up & enterprise',
    title: 'Your technical partner in scaling AI-built products.',
    variant: 'enterprise',
  })
}
