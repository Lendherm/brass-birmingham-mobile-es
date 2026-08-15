import type { MerchantBonus } from '../../engine/types';

/** Bonificación del comerciante dibujada en SVG puro (mapa). */
export function MerchantBonusMapGlyph({
  bonus,
  cx,
  cy,
  size = 14,
}: {
  bonus: MerchantBonus;
  cx: number;
  cy: number;
  size?: number;
}) {
  const s = size;
  switch (bonus.kind) {
    case 'vp': {
      const w = s;
      const h = s * 1.08;
      const x = cx - w / 2;
      const y = cy - h / 2;
      return (
        <g className="merchant-bonus-glyph merchant-bonus-vp">
          <path
            d={`M${x + w / 2} ${y} L${x + w} ${y + h * 0.28} L${x + w} ${y + h * 0.72} L${x + w / 2} ${y + h} L${x} ${y + h * 0.72} L${x} ${y + h * 0.28} Z`}
            fill="#2a6a9a"
            stroke="#6ec8e8"
            strokeWidth={0.9}
          />
          <text x={cx} y={cy + s * 0.12} textAnchor="middle" fontSize={s * 0.48} fontWeight={800} fill="#fff">
            {bonus.amount}
          </text>
        </g>
      );
    }
    case 'money':
      return (
        <g className="merchant-bonus-glyph merchant-bonus-money">
          <circle cx={cx} cy={cy} r={s * 0.48} fill="#fbbf24" stroke="#b45309" strokeWidth={0.7} />
          <text x={cx} y={cy + s * 0.15} textAnchor="middle" fontSize={s * 0.34} fontWeight={800} fill="#78350f">
            £{bonus.amount}
          </text>
        </g>
      );
    case 'incomeSpaces':
      return (
        <g className="merchant-bonus-glyph merchant-bonus-income">
          <path
            d={`M${cx} ${cy - s * 0.42} L${cx + s * 0.42} ${cy - s * 0.05} L${cx + s * 0.28} ${cy + s * 0.38} H${cx - s * 0.28} L${cx - s * 0.42} ${cy - s * 0.05} Z`}
            fill="#facc15"
            stroke="#ca8a04"
            strokeWidth={0.6}
          />
          <text x={cx} y={cy + s * 0.28} textAnchor="middle" fontSize={s * 0.38} fontWeight={800} fill="#78350f">
            +{bonus.amount}
          </text>
        </g>
      );
    case 'develop':
      return (
        <g className="merchant-bonus-glyph merchant-bonus-develop">
          <path
            d={`M${cx - s * 0.15} ${cy + s * 0.38} H${cx + s * 0.15} M${cx - s * 0.1} ${cy + s * 0.5} H${cx + s * 0.1}`}
            stroke="#ca8a04"
            strokeWidth={0.7}
            strokeLinecap="round"
          />
          <path
            d={`M${cx} ${cy - s * 0.45} C${cx + s * 0.35} ${cy - s * 0.2} ${cx + s * 0.35} ${cy + s * 0.25} ${cx} ${cy + s * 0.25} C${cx - s * 0.35} ${cy + s * 0.25} ${cx - s * 0.35} ${cy - s * 0.2} ${cx} ${cy - s * 0.45} Z`}
            fill="#fef08a"
            stroke="#ca8a04"
            strokeWidth={0.65}
          />
          <text x={cx} y={cy + s * 0.08} textAnchor="middle" fontSize={s * 0.34} fontWeight={800} fill="#78350f">
            +{bonus.amount}
          </text>
        </g>
      );
  }
}
