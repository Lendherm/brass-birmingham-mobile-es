import type { IndustryType } from '../../engine/types';
import { industryIconColors } from './industryTheme';

interface Props {
  industry: IndustryType;
  size?: number;
  className?: string;
  muted?: boolean;
  colorful?: boolean;
}

export function IndustryIcon({
  industry,
  size = 20,
  className,
  muted = false,
  colorful = true,
}: Props) {
  const s = size;
  const icon = industryIconColors(industry);
  const useColor = colorful && !muted;

  const wrapStyle = muted
    ? { opacity: 0.4, filter: 'grayscale(1)' as const }
    : { filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.35))' };

  const body = useColor ? icon.body : 'var(--muted)';
  const detail = useColor ? icon.detail : 'var(--muted)';
  const accent = useColor ? icon.accent : 'var(--muted)';

  switch (industry) {
    case 'cotton':
      // Factory with twin chimneys
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden style={wrapStyle}>
          <rect x="3" y="12" width="18" height="9" rx="1.5" fill={body} stroke={detail} strokeWidth="0.8" />
          <rect x="5" y="7" width="3.5" height="5" rx="0.5" fill={detail} />
          <rect x="15.5" y="5" width="3.5" height="7" rx="0.5" fill={detail} />
          <rect x="9" y="9" width="5" height="3" rx="0.5" fill={accent} opacity="0.7" />
          <ellipse cx="6.8" cy="5.5" rx="1.2" ry="1.5" fill={accent} opacity="0.5" />
          <ellipse cx="17.2" cy="3.5" rx="1.2" ry="1.5" fill={accent} opacity="0.5" />
        </svg>
      );
    case 'goods':
      // Wooden crate
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden style={wrapStyle}>
          <rect x="4" y="7" width="16" height="13" rx="2" fill={body} stroke={detail} strokeWidth="0.8" />
          <path d="M4 12h16M12 7v13" stroke={detail} strokeWidth="1" opacity="0.6" />
          <path d="M4 7l8-3 8 3" fill="none" stroke={detail} strokeWidth="0.8" />
          <rect x="10" y="13" width="4" height="3" rx="0.5" fill={accent} opacity="0.8" />
        </svg>
      );
    case 'pottery':
      // Bottle kiln
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden style={wrapStyle}>
          <path d="M7 20h10l-1.5-12c0-3-2.5-5-3.5-5s-3.5 2-3.5 5z" fill={body} stroke={detail} strokeWidth="0.8" />
          <ellipse cx="12" cy="8" rx="5" ry="2.5" fill={accent} stroke={detail} strokeWidth="0.6" />
          <rect x="10" y="3" width="4" height="3" rx="1" fill={detail} opacity="0.7" />
        </svg>
      );
    case 'coal':
      // Mine headframe + coal lumps
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden style={wrapStyle}>
          <path d="M12 3 L20 20 H4 Z" fill="none" stroke={detail} strokeWidth="1.2" />
          <line x1="12" y1="3" x2="12" y2="20" stroke={detail} strokeWidth="0.8" />
          <line x1="8" y1="10" x2="16" y2="10" stroke={detail} strokeWidth="0.8" />
          <circle cx="9" cy="18" r="2.2" fill={body} stroke={accent} strokeWidth="0.5" />
          <circle cx="14" cy="17" r="2.5" fill={body} stroke={accent} strokeWidth="0.5" />
          <circle cx="12" cy="20" r="1.8" fill={detail} />
        </svg>
      );
    case 'iron':
      // Furnace with glow
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden style={wrapStyle}>
          <rect x="6" y="4" width="12" height="16" rx="2" fill={body} stroke={detail} strokeWidth="0.8" />
          <rect x="8" y="10" width="8" height="7" rx="1" fill={accent} opacity="0.85" />
          <rect x="9" y="6" width="6" height="3" rx="0.5" fill={detail} opacity="0.6" />
          <path d="M8 20h8" stroke={detail} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'brewery':
      // Botella de cerveza (industria; el mercado sigue usando 🍺)
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden style={wrapStyle}>
          <rect x="10" y="2" width="4" height="2.2" rx="0.6" fill={detail} />
          <rect x="10.5" y="4" width="3" height="4.5" rx="0.5" fill={body} stroke={detail} strokeWidth="0.7" />
          <path
            d="M9 8.5h6l1.4 2.2v9.8c0 1-.8 1.8-1.8 1.8h-4.8c-1 0-1.8-.8-1.8-1.8v-9.8L9 8.5z"
            fill={body}
            stroke={detail}
            strokeWidth="0.8"
          />
          <path
            d="M9.6 13.2h4.8v8.3c0 .7-.6 1.3-1.3 1.3h-2.2c-.7 0-1.3-.6-1.3-1.3v-8.3z"
            fill={accent}
            opacity="0.88"
          />
          <rect x="9.5" y="11" width="5" height="2.8" rx="0.4" fill={accent} opacity="0.45" stroke={detail} strokeWidth="0.4" />
        </svg>
      );
    default:
      return null;
  }
}

export function LocationIcon({ size = 20, className, zoneColor }: { size?: number; className?: string; zoneColor?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" fill={zoneColor ?? 'currentColor'} />
      <circle cx="12" cy="9" r="2.5" fill="var(--panel)" />
    </svg>
  );
}

export function WildIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <polygon points="12,2 15,9 22,9 16.5,13.5 18.5,21 12,17 5.5,21 7.5,13.5 2,9 9,9" fill="var(--card-wild-border)" />
    </svg>
  );
}
