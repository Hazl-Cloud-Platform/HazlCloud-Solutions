import { renderOgImage } from '@/lib/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'HAZL Solutions — DevOps consulting and implementation'

export default function Image() {
  return renderOgImage({
    eyebrow: 'Enterprise DevOps',
    title: 'DevOps for the apps your teams are building.',
    variant: 'enterprise',
  })
}
