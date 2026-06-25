// Bundle entry for design-sync (passed as --entry). Re-exports every synced
// component so the converter's IIFE assigns them all to window.HAZL.*. Using an
// explicit --entry makes PKG_DIR walk up to the repo root (where src/ lives)
// without a node_modules self-link. Component list + per-component .d.ts binding
// come from cfg.componentSrcMap.
export { PrimaryButton, GlassPillWithIcon } from '../src/components/Buttons'
export { Hero } from '../src/components/Hero'
export { LogoMark } from '../src/components/LogoMark'
export { MobileMenu } from '../src/components/MobileMenu'
export { Navbar } from '../src/components/Navbar'
export { ProblemSection } from '../src/components/ProblemSection'
export { ServicesStrip } from '../src/components/ServicesStrip'
