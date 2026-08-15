import type { MerchantBonus } from '../../engine/types';

interface Props {
  bonus: MerchantBonus;
  size?: number;
  className?: string;
}

/** Símbolo de bonificación al consumir cerveza del comerciante (estilo juego original). */
/** VP bonus en popup: hex azul como en el mapa. */
export function MerchantBonusIcon({ bonus, size = 20, className }: Props) {
  const s = size;
  switch (bonus.kind) {
    case 'vp': {
      const w = s;
      const h = s * 1.08;
      return (
        <svg width={s} height={s * 1.08} viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden>
          <path
            d={`M${w / 2} 0 L${w} ${h * 0.28} L${w} ${h * 0.72} L${w / 2} ${h} L0 ${h * 0.72} L0 ${h * 0.28} Z`}
            fill="#2a6a9a"
            stroke="#6ec8e8"
            strokeWidth="0.8"
          />
          <text x={w / 2} y={h * 0.58} textAnchor="middle" fontSize={s * 0.42} fontWeight={800} fill="#fff">
            {bonus.amount}
          </text>
        </svg>
      );
    }
    case 'money':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden>
          <circle cx="12" cy="12" r="9" fill="#fbbf24" stroke="#b45309" strokeWidth="0.8" />
          <text x="12" y="15.5" textAnchor="middle" fontSize={s * 0.42} fontWeight={800} fill="#78350f">
            £{bonus.amount}
          </text>
        </svg>
      );
    case 'incomeSpaces':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden>
          <rect x="4" y="11" width="16" height="9" rx="1" fill="#dbeafe" stroke="#2563eb" strokeWidth="0.8" />
          <path d="M12 4 L18 11 H6 Z" fill="#93c5fd" stroke="#2563eb" strokeWidth="0.7" />
          <text x="12" y="18" textAnchor="middle" fontSize={s * 0.38} fontWeight={800} fill="#1e3a5f">
            +{bonus.amount}
          </text>
        </svg>
      );
    case 'develop':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M9 18h6M10 21h4M12 3a5 5 0 0 1 3 9.2V14H9v-1.8A5 5 0 0 1 12 3z"
            fill="#fef08a"
            stroke="#ca8a04"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
          <text x="12" y="12.5" textAnchor="middle" fontSize={s * 0.38} fontWeight={800} fill="#78350f">
            +{bonus.amount}
          </text>
        </svg>
      );
  }
}
