import { renderOgImage } from '@/lib/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'HAZL Solutions — turn your idea into an app that makes money, from $80/month'

export default function Image() {
  return renderOgImage({
    eyebrow: 'No code · no upfront cost',
    title: 'Turn your idea into an app that makes money.',
    variant: 'price',
  })
}
