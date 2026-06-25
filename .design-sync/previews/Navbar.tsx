import { Navbar } from 'hazl-solutions'
import { Stage } from '../preview-lib/stage'

// Top site navigation: logo mark + "HAZL SOLUTIONS" wordmark, primary links,
// and the mobile-menu trigger. Full-bleed on black; rendered at a wide viewport.
export const Default = () => (
  <Stage style={{ padding: 0 }}>
    <Navbar />
  </Stage>
)
