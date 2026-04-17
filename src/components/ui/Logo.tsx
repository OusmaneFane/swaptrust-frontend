import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'dark' | 'light' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { icon: 24, text: 18, tagline: false },
  md: { icon: 32, text: 24, tagline: false },
  lg: { icon: 44, text: 32, tagline: true },
} as const;

export function Logo({ variant = 'dark', size = 'md', className = '' }: LogoProps) {
  const s = sizes[size];
  const isDark = variant !== 'light';
  const iconOnly = variant === 'icon-only';

  const bgColor = '#1F3A5F';
  const arrowColor = '#2ECC71';
  const textMain = isDark ? '#FFFFFF' : '#1F3A5F';
  const textAccent = '#2ECC71';
  const tagColor = isDark ? '#8AA8C8' : '#243B5A';

  const iconSize = s.icon;
  const textStartX = iconSize + 10;
  // Largeur : le mot « DoniSend » + tagline (lettres espacées) dépassent vite le viewBox si trop étroit.
  const wordmarkWidth = s.text * 7.4;
  const taglineMinInnerWidth = 292;
  const totalWidth = iconOnly
    ? iconSize
    : Math.ceil(
        Math.max(iconSize + wordmarkWidth, textStartX + taglineMinInnerWidth + 12),
      );
  // Hauteur : baseline du texte + ascenders (éviter y < hauteur des capitales) + tagline.
  const wordBaselineY = iconSize * 0.5 + s.text * 0.36;
  const totalHeight =
    iconOnly ? iconSize : s.tagline && !iconOnly ? Math.ceil(wordBaselineY + 34) : iconSize + 4;

  if (iconOnly) {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 44 44"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('shrink-0', className)}
      >
        <circle cx="22" cy="22" r="21" fill={bgColor} />
        <circle cx="22" cy="22" r="21" fill="none" stroke={arrowColor} strokeWidth="1.5" opacity="0.6" />
        <line x1="10" y1="22" x2="28" y2="22" stroke={arrowColor} strokeWidth="3" strokeLinecap="round" />
        <polyline
          points="22,14 31,22 22,30"
          fill="none"
          stroke={arrowColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="10" y1="16" x2="20" y2="16" stroke={arrowColor} strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
        <line x1="10" y1="28" x2="20" y2="28" stroke={arrowColor} strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
      </svg>
    );
  }

  return (
    <svg
      width={totalWidth}
      height={totalHeight}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      className={cn('block h-auto max-w-full', className)}
    >
      <circle cx={iconSize / 2} cy={iconSize / 2} r={iconSize / 2 - 1} fill={bgColor} />
      <circle cx={iconSize / 2} cy={iconSize / 2} r={iconSize / 2 - 1} fill="none" stroke={arrowColor} strokeWidth="1.2" opacity="0.5" />
      <line
        x1={iconSize * 0.22}
        y1={iconSize / 2}
        x2={iconSize * 0.7}
        y2={iconSize / 2}
        stroke={arrowColor}
        strokeWidth={iconSize * 0.075}
        strokeLinecap="round"
      />
      <polyline
        points={`${iconSize * 0.55},${iconSize * 0.32} ${iconSize * 0.75},${iconSize * 0.5} ${iconSize * 0.55},${iconSize * 0.68}`}
        fill="none"
        stroke={arrowColor}
        strokeWidth={iconSize * 0.075}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1={iconSize * 0.22}
        y1={iconSize * 0.36}
        x2={iconSize * 0.5}
        y2={iconSize * 0.36}
        stroke={arrowColor}
        strokeWidth={iconSize * 0.045}
        strokeLinecap="round"
        opacity="0.4"
      />
      <line
        x1={iconSize * 0.22}
        y1={iconSize * 0.64}
        x2={iconSize * 0.5}
        y2={iconSize * 0.64}
        stroke={arrowColor}
        strokeWidth={iconSize * 0.045}
        strokeLinecap="round"
        opacity="0.4"
      />
      <text
        x={textStartX}
        y={wordBaselineY}
        fontFamily="'Sora', system-ui, sans-serif"
        fontSize={s.text}
        letterSpacing="-0.5"
        fontWeight="700"
      >
        <tspan fontWeight="700" fill={textMain}>
          Doni
        </tspan>
        <tspan fontWeight="300" fill={textAccent}>
          Send
        </tspan>
      </text>
      {s.tagline && (
        <>
          <line
            x1={textStartX}
            y1={wordBaselineY + 10}
            x2={totalWidth - 6}
            y2={wordBaselineY + 10}
            stroke={arrowColor}
            strokeWidth="0.8"
            opacity="0.25"
          />
          <text
            x={textStartX}
            y={wordBaselineY + 24}
            fontFamily="'Inter', system-ui, sans-serif"
            fontSize="10"
            fill={tagColor}
            letterSpacing="1.5"
            fontWeight="700"
          >
            ECHANGE SECURISE CFA ↔ RUB
          </text>
        </>
      )}
    </svg>
  );
}
