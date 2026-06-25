import { MobileMenu } from 'hazl-solutions'
import { Stage } from '../preview-lib/stage'

// Mobile nav dropdown. Absolutely positioned (top-[72px]) and only visible when
// `open`, so it's rendered open inside a tall, relative, black stage.
export const Open = () => (
  <Stage style={{ position: 'relative', minHeight: 360, padding: 0 }}>
    <MobileMenu open={true} />
  </Stage>
)
