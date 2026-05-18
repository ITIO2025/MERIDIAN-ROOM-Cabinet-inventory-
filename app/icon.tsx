import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: 'linear-gradient(145deg, #B8943A 0%, #D4AF60 35%, #EAC96E 60%, #C6A448 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={19} height={19} viewBox="0 0 32 32" fill="none">
          <path
            d="M4 26 L4 6 L16 15.5 L28 6 L28 26"
            stroke="rgba(255,255,255,0.96)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="4" y1="26" x2="28" y2="26"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
