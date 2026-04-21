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

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at 30% 25%, rgba(46,204,113,0.18), transparent 62%), radial-gradient(circle at 75% 70%, rgba(31,58,95,0.16), transparent 60%), linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 55%, #F1F5F9 100%)',
          padding: 96,
        }}
      >
        <div
          style={{
            width: 520,
            height: 520,
            borderRadius: 128,
            background:
              'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.95), transparent 58%), linear-gradient(135deg, rgba(46,204,113,0.24), rgba(255,255,255,0.55), rgba(31,58,95,0.20))',
            border: '1px solid rgba(15,23,42,0.10)',
            boxShadow:
              '0 24px 80px rgba(2, 6, 23, 0.16), inset 0 1px 0 rgba(255,255,255,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="360" height="360" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
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
        </div>
      </div>
    ),
    size,
  );
}

