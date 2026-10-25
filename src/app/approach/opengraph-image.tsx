import { renderOgImage } from '@/lib/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'HAZL Solutions — our approach: assess, implement, operate'

export default function Image() {
  return renderOgImage({
    eyebrow: 'Our approach',
    title: 'Your teams build. We make it run.',
    variant: 'enterprise',
  })
}
