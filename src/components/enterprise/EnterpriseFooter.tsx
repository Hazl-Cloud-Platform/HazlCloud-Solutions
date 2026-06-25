export function EnterpriseFooter() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,.1)', padding: '36px 5vw' }}>
      <div
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
          fontSize: 12.5,
          color: 'rgba(255,255,255,.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/hazlCloud-logo-bw2.png"
            alt="HAZL Solutions"
            width={26}
            height={26}
            style={{ width: 26, height: 26 }}
          />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>HAZL</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,.42)' }}>SOLUTIONS</span>
        </div>
        <span>© HAZL Solutions · Built by operators, not just developers.</span>
      </div>
    </footer>
  )
}
