/** Un hexágono: el comerciante aporta 2 PV a cada enlace adyacente al puntuar. */
export function MerchantLinkVPBadge({ cx, y, size = 13 }: { cx: number; y: number; size?: number }) {
  const w = size;
  const h = size * 1.08;
  const x = cx - w / 2;
  const top = y - h / 2;
  return (
    <g className="board-linkvp-badge" transform={`translate(${x}, ${top})`}>
      <title>2 PV por enlace — se suma al puntuar cada vía conectada</title>
      <path
        d={`M${w / 2} 0 L${w} ${h * 0.28} L${w} ${h * 0.72} L${w / 2} ${h} L0 ${h * 0.72} L0 ${h * 0.28} Z`}
        fill="#2a6a9a"
        stroke="#6ec8e8"
        strokeWidth={1}
      />
      <line x1={w * 0.28} y1={h * 0.55} x2={w * 0.72} y2={h * 0.55} stroke="#f0d060" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={w * 0.28} cy={h * 0.55} r={1.4} fill="#f0d060" />
      <circle cx={w * 0.72} cy={h * 0.55} r={1.4} fill="#f0d060" />
      <text x={w / 2} y={h * 0.4} textAnchor="middle" fontSize={size * 0.5} fontWeight={800} fill="#fff">
        2
      </text>
    </g>
  );
}
