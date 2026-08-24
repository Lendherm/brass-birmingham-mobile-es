import type { CityId, IndustryType } from '../engine/types';
import type { GameState } from '../engine/state';
import { tileSpec } from '../engine/data/industries';
import { industria } from '../i18n/es';
import {
  emptySlotDetail,
  flippedTileDetail,
  linkVPDetail,
  placedTileResourceDetail,
  slotOwnerLabel,
} from '../i18n/boardSymbols';
import { IndustryIcon } from './visual/IndustryIcon';
import { BeerIcon } from './visual/BeerIcon';

function ResourceSample({ industry, count = 1 }: { industry: IndustryType; count?: number }) {
  if (industry === 'brewery') return <BeerIcon available size={14} />;
  const kind = industry === 'coal' ? 'coal' : 'iron';
  const cubes = Math.min(Math.max(count, 1), 4);
  return (
    <span className="board-symbol-cubes">
      {Array.from({ length: cubes }, (_, i) => (
        <span key={i} className={`mat-res-cube ${kind}`} />
      ))}
    </span>
  );
}

export function CitySlotGuide({
  state,
  cityId,
  slots,
}: {
  state: GameState;
  cityId: CityId;
  slots: readonly (readonly IndustryType[])[];
}) {
  return (
    <section className="city-overlay-slot-guide" data-testid="city-slot-guide">
      <h4>Casillas en el tablero</h4>
      <ul className="city-slot-guide-list">
        {slots.map((allowed, slotIndex) => {
          const tile = state.board[cityId][slotIndex];
          if (tile) {
            const spec = tileSpec(tile.industry, tile.level);
            const resourceDetail = placedTileResourceDetail(tile.industry, tile.resources);
            return (
              <li key={slotIndex} className="city-slot-guide-item is-built">
                <span className="city-slot-guide-icon">
                  <IndustryIcon industry={tile.industry} size={24} colorful={!tile.flipped} muted={tile.flipped} />
                </span>
                <div className="city-slot-guide-meta">
                  <strong>
                    Casilla {slotIndex + 1}: {industria(tile.industry)} nivel {tile.level}
                  </strong>
                  <span className="city-slot-guide-owner">Dueño: {slotOwnerLabel(state, tile.owner)}</span>
                  {spec.linkVP > 0 && (
                    <span className="city-slot-guide-detail">{linkVPDetail(spec.linkVP)}</span>
                  )}
                  {resourceDetail && !tile.flipped && (
                    <span className="city-slot-guide-detail city-slot-guide-resource">
                      <ResourceSample industry={tile.industry} count={tile.resources} />
                      {resourceDetail}
                    </span>
                  )}
                  {tile.flipped && (
                    <span className="city-slot-guide-detail muted-inline">{flippedTileDetail()}</span>
                  )}
                </div>
              </li>
            );
          }

          return (
            <li key={slotIndex} className="city-slot-guide-item is-empty">
              <span className="city-slot-guide-icon city-slot-guide-empty-icon" aria-hidden>
                ▢
              </span>
              <div className="city-slot-guide-meta">
                <strong>Casilla {slotIndex + 1}: vacía</strong>
                <span className="city-slot-guide-detail">{emptySlotDetail(allowed)}</span>
                <span className="city-slot-guide-detail muted-inline">
                  Toca la industria abajo → «Ver qué necesito» (carta, red, recursos).
                </span>
                <span className="city-slot-guide-icons">
                  {allowed.map((ind) => (
                    <IndustryIcon key={ind} industry={ind} size={16} colorful />
                  ))}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
