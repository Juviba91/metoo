import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: '#0a0a0a',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 40,
      }}
    >
      <span style={{ color: 'white', fontSize: 105, fontWeight: 800, fontFamily: 'sans-serif', letterSpacing: -3 }}>
        m
      </span>
    </div>,
    { ...size },
  )
}
