import * as React from 'react'

// Shared preview helper (NOT a component — leading underscore; the converter
// only builds previews named after the 8 components). Two jobs:
//  1. NEUTRALIZE the design system's entrance animations so preview captures
//     render the settled state deterministically. The shipped styles.css keeps
//     `animate-blur-fade-up` / `reveal` for real designs — this <style> lives
//     only in the preview cards, freezing them at their final, fully-opaque frame.
//  2. Provide an on-brand dark stage so atoms (buttons, pills, logo) sit on the
//     site's black surface instead of a mostly-empty viewport.
const NEUTRALIZE =
  '.animate-blur-fade-up,.reveal{opacity:1!important;filter:none!important;transform:none!important;animation:none!important}'

export function Stage({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{ background: '#000', padding: 40, ...style }}>
      <style>{NEUTRALIZE}</style>
      {children}
    </div>
  )
}
