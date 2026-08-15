import type { Era, IndustryTileSpec, IndustryType } from '../../engine/types';
import { BeerIcon } from './BeerIcon';
import { IncomeArrowIcon } from './IncomeArrowIcon';
import { IndustryIcon } from './IndustryIcon';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export function levelRoman(level: number): string {
  return ROMAN[level] ?? String(level);
}

export function matTileTitle(spec: IndustryTileSpec, era: Era, remaining: number): string {
  const parts = [
    `Nivel ${spec.level} (${levelRoman(spec.level)})`,
    `Coste £${spec.cost}`,
    spec.costCoal ? `${spec.costCoal} carbón` : null,
    spec.costIron ? `${spec.costIron} hierro` : null,
    `${spec.vp} PV al voltear`,
    `+${spec.incomeBump} ingreso por ronda`,
    spec.linkVP ? `${spec.linkVP} PV enlace` : null,
    spec.producesCoal ? `Produce ${spec.producesCoal} carbón` : null,
    spec.producesIron ? `Produce ${spec.producesIron} hierro` : null,
    spec.producesBeer ? `Produce ${spec.producesBeer[era]} cerveza` : null,
    spec.beerToSell != null && spec.beerToSell > 0
      ? `Gasta ${spec.beerToSell} cerveza al vender (no produce; solo las cervecerías producen)`
      : null,
    `${remaining} en mat`,
    !spec.eras.includes(era) ? 'No disponible en esta era' : null,
    era === 'canal' && spec.level === 1 ? 'Se retira al final de la Era Canal (nivel I)' : null,
  ].filter(Boolean);
  return parts.join(' · ');
}

interface Props {
  industry: IndustryType;
  spec: IndustryTileSpec;
  era: Era;
  remaining: number;
  infoActive?: boolean;
  onInfoRequest?: (text: string) => void;
}

export function MatTile({ industry, spec, era, remaining, infoActive, onInfoRequest }: Props) {
  const empty = remaining === 0;
  const eraLocked = !spec.eras.includes(era);
  const beerOut = spec.producesBeer?.[era];
  const beerToSell = spec.beerToSell ?? 0;
  const infoText = matTileTitle(spec, era, remaining);

  return (
    <div
      className={[
        'mat-tile',
        `ind-${industry}`,
        empty ? 'empty' : 'available',
        eraLocked && !empty ? 'era-locked' : '',
        infoActive ? 'mat-tile-info-active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={infoText}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onInfoRequest?.(infoText);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {eraLocked && !empty && <span className="mat-tile-ban" aria-hidden />}
      {remaining > 1 && <span className="mat-tile-stack">×{remaining}</span>}

      <div className="mat-tile-top">
        <span className="mat-tile-badge mat-tile-cost">£{spec.cost}</span>
        <span className="mat-tile-badge mat-tile-vp" aria-hidden>
          ★{spec.vp}
        </span>
      </div>

      {beerToSell > 0 && (
        <span className="mat-tile-beer-sell" aria-hidden title={`Gasta ${beerToSell} cerveza al vender`}>
          <span className="mat-beer-sell-sign">−</span>
          <BeerIcon available={false} size={9} />
          {beerToSell}
        </span>
      )}

      <div className="mat-tile-icon">
        <IndustryIcon industry={industry} size={22} colorful={!empty} muted={empty} />
      </div>

      <div className="mat-tile-side mat-tile-resources">
        {spec.costCoal > 0 && (
          <span className="mat-res mat-res-coal" aria-hidden>
            <span className="mat-res-cube coal" />
            {spec.costCoal}
          </span>
        )}
        {spec.costIron > 0 && (
          <span className="mat-res mat-res-iron" aria-hidden>
            <span className="mat-res-cube iron" />
            {spec.costIron}
          </span>
        )}
        {spec.producesCoal != null && (
          <span className="mat-res mat-res-out" aria-hidden>
            +{spec.producesCoal}
            <span className="mat-res-cube coal" />
          </span>
        )}
        {spec.producesIron != null && (
          <span className="mat-res mat-res-out" aria-hidden>
            +{spec.producesIron}
            <span className="mat-res-cube iron" />
          </span>
        )}
        {beerOut != null && (
          <span className="mat-res mat-res-out mat-res-beer" aria-hidden title={`Produce ${beerOut} cerveza`}>
            +{beerOut}
            <BeerIcon available size={8} />
          </span>
        )}
      </div>

      <div className="mat-tile-side mat-tile-rewards">
        <span className="mat-tile-income" aria-hidden>
          <IncomeArrowIcon size={9} />
          {spec.incomeBump}
        </span>
        {spec.linkVP > 0 && (
          <span className="mat-tile-badge mat-tile-linkvp" aria-hidden>
            🔗{spec.linkVP}
          </span>
        )}
      </div>

      <span className="mat-tile-level">{levelRoman(spec.level)}</span>
    </div>
  );
}
