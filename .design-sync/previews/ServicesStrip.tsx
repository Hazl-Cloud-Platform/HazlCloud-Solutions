import { ServicesStrip } from 'hazl-solutions'
import { Stage } from '../preview-lib/stage'

// Four-up capability strip (AI / Software / Ops / Security) in liquid-glass
// cards. Uses `hidden md:grid`, so its card renders at a desktop width via
// cfg.overrides.ServicesStrip; staged over a soft radial so the glass reads.
export const Default = () => (
  <Stage
    style={{
      padding: '28px 32px',
      background: 'radial-gradient(120% 140% at 50% 0%, #232323 0%, #111 45%, #000 100%)',
    }}
  >
    <ServicesStrip delay={0} />
  </Stage>
)
