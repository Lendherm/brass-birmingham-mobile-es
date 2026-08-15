import type { Era } from '../../engine/types';

interface Props {
  era: Era;
  size?: number;
  className?: string;
}

/** Barco (era canal) o tren (era ferrocarril) sobre enlaces construidos. */
export function LinkTransportIcon({ era, size = 14, className }: Props) {
  const s = size;
  if (era === 'canal') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden>
        <path
          d="M3 16h18l-1.2-4.5H4.2L3 16z"
          fill="currentColor"
          opacity={0.95}
        />
        <path d="M6 11.5h12l.8-2.5H5.2l.8 2.5z" fill="currentColor" opacity={0.75} />
        <path d="M12 5v3M9 6.5l1.5 1M15 6.5l-1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity={0.85} />
        <path d="M2 17.5c2 .8 4 1.2 6 1.2s4-.4 6-1.2 4-.4 6-1.2" stroke="currentColor" strokeWidth="1" fill="none" opacity={0.5} />
      </svg>
    );
  }
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="2" y="9" width="20" height="7" rx="1.5" fill="currentColor" opacity={0.9} />
      <rect x="4" y="6" width="8" height="5" rx="1" fill="currentColor" />
      <rect x="5" y="7.5" width="2.5" height="2" rx="0.4" fill="var(--panel, #1a1a22)" opacity={0.35} />
      <circle cx="7" cy="17" r="2.2" fill="currentColor" />
      <circle cx="17" cy="17" r="2.2" fill="currentColor" />
      <circle cx="7" cy="17" r="1" fill="var(--panel, #1a1a22)" opacity={0.4} />
      <circle cx="17" cy="17" r="1" fill="var(--panel, #1a1a22)" opacity={0.4} />
      <path d="M13 7h5v2h-5z" fill="currentColor" opacity={0.75} />
    </svg>
  );
}
