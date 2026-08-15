import type { IndustryType } from '../../engine/types';
import { RESOURCE_INDUSTRIES } from '../../engine/types';
import { BeerMugMapGlyph, ResourceCubeGlyph } from './ResourceGlyphs';

/** Recursos restantes en una ficha construida (cerveza, carbón, hierro). */
export function TileResourceBadge({
  industry,
  count,
  cx,
  bottomY,
}: {
  industry: IndustryType;
  count: number;
  cx: number;
  bottomY: number;
}) {
  if (count <= 0 || !RESOURCE_INDUSTRIES.includes(industry)) return null;

  const label =
    industry === 'brewery' ? `${count} cerveza` : industry === 'coal' ? `${count} carbón` : `${count} hierro`;

  return (
    <g className="tile-resource-badge" aria-label={`${label} disponible`}>
      <title>{`${label} disponible`}</title>
      {industry === 'brewery' ? (
        <>
          <BeerMugMapGlyph cx={cx - 2} cy={bottomY - 6} size={12} available />
          <text x={cx + 4} y={bottomY - 2} fontSize={8} fontWeight={700} fill="var(--ind-brewery-text, #78350f)">
            {count}
          </text>
        </>
      ) : (
        <>
          <ResourceCubeGlyph cx={cx - 5} cy={bottomY - 5} kind={industry as 'coal' | 'iron'} size={8} />
          <text x={cx + 4} y={bottomY - 2} fontSize={8} fontWeight={700} fill="var(--text)">
            {count}
          </text>
        </>
      )}
    </g>
  );
}
