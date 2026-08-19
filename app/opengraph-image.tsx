import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'metoo — Apoyo entre personas que lo han vivido'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '80px',
        }}
      >
        {/* Top pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '100px',
            padding: '10px 22px',
            marginBottom: '48px',
            color: '#888',
            fontSize: '20px',
          }}
        >
          <span style={{ fontSize: '16px' }}>💛</span>
          <span>Apoyo real entre personas que lo han vivido</span>
        </div>

        {/* Logo */}
        <div
          style={{
            color: '#ffffff',
            fontSize: '96px',
            fontWeight: '700',
            letterSpacing: '-3px',
            lineHeight: 1,
            marginBottom: '32px',
          }}
        >
          metoo.
        </div>

        {/* Tagline */}
        <div
          style={{
            color: '#ffffff',
            fontSize: '40px',
            fontWeight: '700',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: '24px',
            maxWidth: '800px',
          }}
        >
          Alguien ya estuvo donde estás tú.
        </div>

        {/* Subtitle */}
        <div
          style={{
            color: '#888',
            fontSize: '22px',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: 1.5,
          }}
        >
          Conectamos a personas que pasan por momentos difíciles con voluntarios que han vivido la misma experiencia.
        </div>

        {/* Bottom decorative dots */}
        <div
          style={{
            position: 'absolute',
            bottom: '56px',
            display: 'flex',
            gap: '8px',
          }}
        >
          {['#333', '#444', '#555', '#444', '#333'].map((c, i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: c,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
