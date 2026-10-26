import { renderOgImage } from '@/lib/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'HAZL Solutions — DevOps consulting: your gateway from laptop to production'

export default function Image() {
  return renderOgImage({
    eyebrow: 'DevOps consulting & implementation',
    title: 'Your gateway from laptop to production.',
    variant: 'enterprise',
  })
}
