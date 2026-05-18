import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: 'linear-gradient(145deg, #B8943A 0%, #D4AF60 35%, #EAC96E 60%, #C6A448 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(198,165,72,0.45)',
        }}
      >
        <svg width={108} height={108} viewBox="0 0 32 32" fill="none">
          <path
            d="M4 26 L4 6 L16 15.5 L28 6 L28 26"
            stroke="rgba(255,255,255,0.96)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="4" y1="26" x2="28" y2="26"
            stroke="rgba(255,255,255,0.30)"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
