// App-level loading.tsx — shown by Next.js during route transitions
// Lightweight: no heavy imports, renders instantly
export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-surface, #0e0e0e)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        {/* Gold M mark — pure SVG, zero dependencies */}
        <svg width={44} height={44} viewBox="0 0 56 56" fill="none" aria-hidden>
          <rect x="1" y="1" width="54" height="54" stroke="rgba(198,169,105,0.20)" strokeWidth="1" />
          <line x1="1"  y1="1"  x2="10" y2="1"  stroke="#C6A969" strokeWidth="1.5" />
          <line x1="1"  y1="1"  x2="1"  y2="10" stroke="#C6A969" strokeWidth="1.5" />
          <line x1="55" y1="1"  x2="46" y2="1"  stroke="#C6A969" strokeWidth="1.5" />
          <line x1="55" y1="1"  x2="55" y2="10" stroke="#C6A969" strokeWidth="1.5" />
          <line x1="1"  y1="55" x2="10" y2="55" stroke="#C6A969" strokeWidth="1.5" />
          <line x1="1"  y1="55" x2="1"  y2="46" stroke="#C6A969" strokeWidth="1.5" />
          <line x1="55" y1="55" x2="46" y2="55" stroke="#C6A969" strokeWidth="1.5" />
          <line x1="55" y1="55" x2="55" y2="46" stroke="#C6A969" strokeWidth="1.5" />
          <path d="M13 43 L13 13 L28 26 L43 13 L43 43"
            stroke="#C6A969" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
        </svg>

        {/* 3-dot pulse — no external deps, pure CSS animation */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#C6A969',
              animation: `mp 1.2s ease-in-out ${i * 0.18}s infinite`,
              opacity: 0.5,
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes mp {
          0%,80%,100% { transform: scale(0.65); opacity: 0.3; }
          40%          { transform: scale(1.1);  opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}
