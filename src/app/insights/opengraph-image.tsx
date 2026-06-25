import { renderOgImage } from '@/lib/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'HAZL Solutions Insights — scaling AI-built products, in depth'

export default function Image() {
  return renderOgImage({
    eyebrow: 'Insights',
    title: 'Scaling AI-built products, in depth.',
    variant: 'enterprise',
  })
}
