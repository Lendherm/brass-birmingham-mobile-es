import { BeerIcon } from './BeerIcon';

/** Tarro de cerveza 🍺 en el mapa SVG (foreignObject). */
export function BeerMugMapGlyph({
  cx,
  cy,
  size = 12,
  available = true,
}: {
  cx: number;
  cy: number;
  size?: number;
  available?: boolean;
}) {
  const half = size / 2;
  return (
    <foreignObject
      x={cx - half}
      y={cy - half}
      width={size}
      height={size}
      className={available ? 'beer-mug-map available' : 'beer-mug-map spent'}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          lineHeight: 1,
        }}
      >
        <BeerIcon available={available} size={size - 1} title={available ? 'Cerveza disponible' : 'Sin cerveza'} />
      </div>
    </foreignObject>
  );
}

/** @deprecated use BeerMugMapGlyph */
export const BeerBarrelGlyph = BeerMugMapGlyph;

/** Cubo de carbón o hierro en el mapa. */
export function ResourceCubeGlyph({
  cx,
  cy,
  kind,
  size = 8,
}: {
  cx: number;
  cy: number;
  kind: 'coal' | 'iron';
  size?: number;
}) {
  const s = size;
  return (
    <rect
      x={cx - s / 2}
      y={cy - s / 2}
      width={s}
      height={s}
      rx={1}
      strokeWidth={1}
      className={`resource-cube ${kind}`}
    />
  );
}
