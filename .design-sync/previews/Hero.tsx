import { Hero } from 'hazl-solutions'
import { Stage } from '../preview-lib/stage'

// Full landing hero: background video, integrated Navbar, headline, glass pill,
// and primary CTA. Full-bleed (Stage adds no padding); rendered at a large
// viewport via cfg.overrides.Hero. The Stage only neutralizes entrance anims.
export const Default = () => (
  <Stage style={{ padding: 0 }}>
    <Hero />
  </Stage>
)
