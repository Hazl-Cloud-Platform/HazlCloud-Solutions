import { GlassPillWithIcon } from 'hazl-solutions'
import { Sparkles, Activity, ShieldCheck } from 'lucide-react'
import { Stage } from '../preview-lib/stage'

// Frosted "liquid glass" pill — secondary action / status chip. Staged over a
// soft radial so the backdrop-blur and the gradient border edge are legible
// (on the live site these sit over the hero video).
export const Variants = () => (
  <Stage
    style={{
      background: 'radial-gradient(130% 130% at 25% 12%, #3a3a3a 0%, #161616 46%, #000 100%)',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 16,
      alignItems: 'center',
    }}
  >
    <GlassPillWithIcon icon={Sparkles}>AI-built, production-hardened</GlassPillWithIcon>
    <GlassPillWithIcon icon={Activity}>99.9% uptime, monitored 24/7</GlassPillWithIcon>
    <GlassPillWithIcon icon={ShieldCheck} iconRight>
      Secure by default
    </GlassPillWithIcon>
  </Stage>
)
