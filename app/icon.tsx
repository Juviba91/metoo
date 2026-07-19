import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: '#0a0a0a',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 110,
      }}
    >
      <span style={{ color: 'white', fontSize: 290, fontWeight: 800, fontFamily: 'sans-serif', letterSpacing: -8 }}>
        m
      </span>
    </div>,
    { ...size },
  )
}
