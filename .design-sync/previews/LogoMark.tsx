import { LogoMark } from 'hazl-solutions'
import { Stage } from '../preview-lib/stage'

// The HAZL Cloud glyph (light wordmark image at /brand/hazlCloud-logo-bw2.png,
// served by the host at its web root). Shown at the default 36px and a larger
// 64px size on the brand's black surface.
export const Logo = () => (
  <Stage style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
    <LogoMark />
    <LogoMark className="w-16 h-16" />
  </Stage>
)
