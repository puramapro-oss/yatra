import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = (searchParams.get('title') || 'YATRA').slice(0, 80)
  const subtitle = (searchParams.get('subtitle') || 'Voyage propre, payé, conscient').slice(0, 120)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(ellipse 1200px 500px at 30% 20%, rgba(34,197,94,0.35), transparent 60%), radial-gradient(ellipse 900px 600px at 80% 90%, rgba(6,182,212,0.30), transparent 60%), radial-gradient(ellipse 800px 400px at 60% 50%, rgba(139,92,246,0.25), transparent 60%), #0A0A0F',
          color: '#F8FAFC',
          padding: 80,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
            fontSize: 28,
            opacity: 0.7,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #22C55E, #06B6D4, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0A0A0F',
              fontWeight: 800,
              fontSize: 32,
            }}
          >
            Y
          </div>
          <span style={{ fontWeight: 700, letterSpacing: -0.5 }}>YATRA</span>
        </div>

        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: -2,
            display: 'flex',
            textAlign: 'center',
            marginBottom: 24,
            background: 'linear-gradient(135deg, #22C55E, #06B6D4 50%, #8B5CF6)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 32,
            opacity: 0.7,
            display: 'flex',
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          {subtitle}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 60,
            display: 'flex',
            fontSize: 22,
            opacity: 0.45,
          }}
        >
          yatra.purama.dev — l&apos;écosystème PURAMA
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
