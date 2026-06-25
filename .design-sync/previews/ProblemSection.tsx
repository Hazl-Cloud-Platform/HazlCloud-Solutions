import { ProblemSection } from 'hazl-solutions'
import { Stage } from '../preview-lib/stage'

// "AI makes building easy. Running software is hard." — the problem grid of
// four failure-mode cards. Self-contained section; full-bleed on black.
export const Default = () => (
  <Stage style={{ padding: 0 }}>
    <ProblemSection />
  </Stage>
)
