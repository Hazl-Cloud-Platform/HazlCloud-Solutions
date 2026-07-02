import { renderOgImage } from '@/lib/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'HAZL Solutions — AI-generated software made secure, scalable and ready for real customers, from $80/month'

export default function Image() {
  return renderOgImage({
    eyebrow: 'No code · no upfront cost',
    title: 'AI-generated software, made ready for real customers.',
    variant: 'price',
  })
}
