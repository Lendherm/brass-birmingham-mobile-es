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
    spec.beerToSell != null && spec.beerToSell > 0 ? `Al vender: ${spec.beerToSell} cerveza` : null,
    `${remaining} en mat`,
    !spec.eras.includes(era) ? 'No disponible en esta era' : null,
  ].filter(Boolean);
  return parts.join(' · ');
}

interface Props {
  industry: IndustryType;
  spec: IndustryTileSpec;
  era: Era;
  remaining: number;
}

export function MatTile({ industry, spec, era, remaining }: Props) {
  const empty = remaining === 0;
  const eraLocked = !spec.eras.includes(era);
  const beerOut = spec.producesBeer?.[era];
  const beerToSell = spec.beerToSell ?? 0;

  return (
    <div
      className={[
        'mat-tile',
        `ind-${industry}`,
        empty ? 'empty' : 'available',
        eraLocked && !empty ? 'era-locked' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      title={matTileTitle(spec, era, remaining)}
      aria-label={matTileTitle(spec, era, remaining)}
    >
      {eraLocked && !empty && <span className="mat-tile-ban" aria-hidden />}
      {remaining > 1 && <span className="mat-tile-stack">×{remaining}</span>}

      <div className="mat-tile-top">
        <span className="mat-tile-badge mat-tile-cost">£{spec.cost}</span>
        <span className="mat-tile-badge mat-tile-vp" title={`${spec.vp} PV al voltear`}>
          ★{spec.vp}
        </span>
      </div>

      {beerToSell > 0 && (
        <span className="mat-tile-beer-sell" title={`Al vender requiere ${beerToSell} cerveza`}>
          <BeerIcon available size={9} title={`Al vender: ${beerToSell} cerveza`} />
          {beerToSell}
        </span>
      )}

      <div className="mat-tile-icon">
        <IndustryIcon industry={industry} size={22} colorful={!empty} muted={empty} />
      </div>

      <div className="mat-tile-side mat-tile-resources">
        {spec.costCoal > 0 && (
          <span className="mat-res mat-res-coal" title={`${spec.costCoal} carbón`}>
            <span className="mat-res-cube coal" />
            {spec.costCoal}
          </span>
        )}
        {spec.costIron > 0 && (
          <span className="mat-res mat-res-iron" title={`${spec.costIron} hierro`}>
            <span className="mat-res-cube iron" />
            {spec.costIron}
          </span>
        )}
        {spec.producesCoal != null && (
          <span className="mat-res mat-res-out" title={`Produce ${spec.producesCoal} carbón`}>
            +{spec.producesCoal}
            <span className="mat-res-cube coal" />
          </span>
        )}
        {spec.producesIron != null && (
          <span className="mat-res mat-res-out" title={`Produce ${spec.producesIron} hierro`}>
            +{spec.producesIron}
            <span className="mat-res-cube iron" />
          </span>
        )}
        {beerOut != null && (
          <span className="mat-res mat-res-out mat-res-beer" title={`Produce ${beerOut} cerveza`}>
            +{beerOut}
            <IndustryIcon industry="brewery" size={8} colorful />
          </span>
        )}
      </div>

      <div className="mat-tile-side mat-tile-rewards">
        <span className="mat-tile-income" title={`+${spec.incomeBump} ingreso por ronda`}>
          <IncomeArrowIcon size={9} />
          {spec.incomeBump}
        </span>
        {spec.linkVP > 0 && (
          <span className="mat-tile-badge mat-tile-linkvp" title={`${spec.linkVP} PV enlace`}>
            🔗{spec.linkVP}
          </span>
        )}
      </div>

      <span className="mat-tile-level">{levelRoman(spec.level)}</span>
    </div>
  );
}
