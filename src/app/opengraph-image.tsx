import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  const bgColor = '#1F3A5F';
  const arrowColor = '#2ECC71';
  const textDark = '#0B1220';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 50%, #F1F5F9 100%)',
          padding: 80,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 48,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
              <svg
                width="120"
                height="120"
                viewBox="0 0 44 44"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="22" cy="22" r="21" fill={bgColor} />
                <circle
                  cx="22"
                  cy="22"
                  r="21"
                  fill="none"
                  stroke={arrowColor}
                  strokeWidth="1.5"
                  opacity="0.6"
                />
                <line
                  x1="10"
                  y1="22"
                  x2="28"
                  y2="22"
                  stroke={arrowColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <polyline
                  points="22,14 31,22 22,30"
                  fill="none"
                  stroke={arrowColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="10"
                  y1="16"
                  x2="20"
                  y2="16"
                  stroke={arrowColor}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  opacity="0.45"
                />
                <line
                  x1="10"
                  y1="28"
                  x2="20"
                  y2="28"
                  stroke={arrowColor}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  opacity="0.45"
                />
              </svg>

              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: 74, fontWeight: 800, color: textDark }}>Doni</span>
                <span style={{ fontSize: 74, fontWeight: 300, color: arrowColor }}>Send</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 42, fontWeight: 800, color: textDark }}>
                Échange sécurisé
              </div>
              <div style={{ fontSize: 34, fontWeight: 700, color: '#334155' }}>
                CFA ↔ Roubles
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, color: '#475569' }}>
                Taux Google · Commission séparée · WhatsApp
              </div>
            </div>
          </div>

          <div
            style={{
              width: 380,
              height: 380,
              borderRadius: 64,
              background:
                'radial-gradient(circle at 30% 25%, rgba(46,204,113,0.25), transparent 60%), radial-gradient(circle at 70% 75%, rgba(31,58,95,0.22), transparent 62%), linear-gradient(135deg, rgba(255,255,255,0.9), rgba(241,245,249,0.8))',
              border: '1px solid rgba(15,23,42,0.08)',
              boxShadow:
                '0 20px 60px rgba(2, 6, 23, 0.12), inset 0 1px 0 rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 250,
                height: 250,
                borderRadius: 999,
                background:
                  'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.95), transparent 58%), linear-gradient(135deg, rgba(46,204,113,0.24), rgba(255,255,255,0.55), rgba(31,58,95,0.20))',
                border: '1px solid rgba(31,58,95,0.16)',
              }}
            />
          </div>
        </div>
      </div>
    ),
    size,
  );
}

