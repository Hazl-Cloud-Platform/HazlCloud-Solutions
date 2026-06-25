import { renderOgImage } from '@/lib/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'HAZL Solutions — launch a real app from $80/month, no upfront cost'

export default function Image() {
  return renderOgImage({
    eyebrow: 'Build or scale your app',
    title: 'Launch a real app your customers pay for.',
    variant: 'price',
  })
}
