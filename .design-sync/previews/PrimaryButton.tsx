import { PrimaryButton } from 'hazl-solutions'
import { ArrowRight, Calendar, Sparkles } from 'lucide-react'
import { Stage } from '../preview-lib/stage'

// Solid white pill — the site's primary call-to-action on dark backgrounds.
// One showcase cell sweeps the icon options (none / left / right / as-link).
export const Variants = () => (
  <Stage style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
    <PrimaryButton>Book a discovery call</PrimaryButton>
    <PrimaryButton icon={ArrowRight} iconRight>
      Get started
    </PrimaryButton>
    <PrimaryButton icon={Calendar}>Schedule a review</PrimaryButton>
    <PrimaryButton icon={Sparkles} href="https://hazlcloud.com">
      Explore HAZL Cloud
    </PrimaryButton>
  </Stage>
)
