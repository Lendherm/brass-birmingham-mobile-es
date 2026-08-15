import type { IndustryType, MerchantBonus, MerchantTileKind } from '../../engine/types';
import { IndustryIcon, WildIcon } from './IndustryIcon';
import { MerchantBonusMapGlyph } from './MerchantBonusMapGlyph';
import { BeerMugMapGlyph } from './ResourceGlyphs';

function TileGlyph({ tile, size }: { tile: IndustryType | 'any'; size: number }) {
  if (tile === 'any') return <WildIcon size={size} />;
  return <IndustryIcon industry={tile} size={size} colorful />;
}

/** Cara del comerciante en el mapa — industria + barril si hay cerveza + bonus. */
export function MerchantBoardFace({
  cx,
  bodyTop,
  tiles,
  beer,
  bonus,
}: {
  cx: number;
  bodyTop: number;
  tiles: readonly MerchantTileKind[];
  beer: readonly boolean[];
  bonus: MerchantBonus;
}) {
  const slots = tiles
    .map((tile, i) => ({ tile, beer: beer[i] ?? false }))
    .filter((s) => s.tile !== 'blank');

  const slotCount = slots.length;
  const colW = slotCount <= 1 ? 26 : 22;
  const bonusW = 24;
  const totalW = slotCount * colW + bonusW;
  const left = cx - totalW / 2;
  const beerY = bodyTop + 16;
  const indY = bodyTop + 30;
  const bonusCx = left + slotCount * colW + bonusW / 2;

  return (
    <g className="merchant-board-face" data-testid="merchant-board-face">
      {slots.map((slot, i) => {
        const x = left + i * colW + colW / 2;
        return (
          <g key={i} className="merchant-board-slot">
            {slot.beer && (
              <g aria-label="Cerveza disponible">
                <title>Cerveza disponible</title>
                <BeerMugMapGlyph cx={x} cy={beerY} size={13} available />
              </g>
            )}
            <foreignObject x={x - 11} y={indY - 11} width={22} height={22}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22 }}
              >
                <TileGlyph tile={slot.tile as IndustryType | 'any'} size={slotCount <= 1 ? 18 : 15} />
              </div>
            </foreignObject>
          </g>
        );
      })}

      <MerchantBonusMapGlyph bonus={bonus} cx={bonusCx} cy={indY} size={13} />
    </g>
  );
}

/** Fila de hexágonos «2 PV enlace» sobre el nombre (uno por casilla del comerciante). */
export function MerchantLinkVPBadgeRow({ cx, y, count, size = 11 }: { cx: number; y: number; count: number; size?: number }) {
  if (count <= 0) return null;
  const gap = size + 3;
  const start = cx - ((count - 1) * gap) / 2;
  return (
    <g className="merchant-linkvp-row">
      {Array.from({ length: count }, (_, i) => (
        <MerchantLinkVPBadgeAt key={i} cx={start + i * gap} y={y} size={size} />
      ))}
    </g>
  );
}

function MerchantLinkVPBadgeAt({ cx, y, size }: { cx: number; y: number; size: number }) {
  const w = size;
  const h = size * 1.08;
  const x = cx - w / 2;
  const top = y - h / 2;
  return (
    <g className="board-linkvp-badge">
      <path
        d={`M${x + w / 2} ${top} L${x + w} ${top + h * 0.28} L${x + w} ${top + h * 0.72} L${x + w / 2} ${top + h} L${x} ${top + h * 0.72} L${x} ${top + h * 0.28} Z`}
        fill="#2a6a9a"
        stroke="#6ec8e8"
        strokeWidth={0.9}
      />
      <line x1={x + w * 0.28} y1={top + h * 0.55} x2={x + w * 0.72} y2={top + h * 0.55} stroke="#f0d060" strokeWidth={1.4} strokeLinecap="round" />
      <circle cx={x + w * 0.28} cy={top + h * 0.55} r={1.2} fill="#f0d060" />
      <circle cx={x + w * 0.72} cy={top + h * 0.55} r={1.2} fill="#f0d060" />
      <text x={cx} y={top + h * 0.42} textAnchor="middle" fontSize={size * 0.48} fontWeight={800} fill="#fff">
        2
      </text>
    </g>
  );
}
