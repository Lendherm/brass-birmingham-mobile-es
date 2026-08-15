import type { MerchantId, IndustryType } from '../engine/types';
import { MERCHANTS } from '../engine/data/board';
import type { GameState } from '../engine/state';
import {
  COAL_MARKET_CONNECTION_HINT,
  merchantBonusLabel,
  merchantTileLabel,
  merchantTileDetail,
} from '../i18n/es';
import { MerchantBonusDisplay, MerchantSlotIcon } from './visual/MerchantStackIcon';
import { BeerIconRow } from './visual/BeerIcon';

interface Props {
  state: GameState;
  merchantId: MerchantId;
  onClose: () => void;
}

export function MerchantMapOverlay({ state, merchantId, onClose }: Props) {
  const spec = MERCHANTS[merchantId];
  const merchantState = state.merchants.find((m) => m.id === merchantId);
  const activeBeer = merchantState
    ? merchantState.tiles
        .map((tile, i) => (tile !== 'blank' ? merchantState.beer[i] ?? false : null))
        .filter((b): b is boolean => b !== null)
    : [];
  const beerLeft = activeBeer.filter(Boolean).length;
  const beerTotal = activeBeer.length;

  return (
    <div className="city-map-overlay merchant-map-overlay" data-testid="merchant-overlay">
      <button type="button" className="city-overlay-backdrop" aria-label="Cerrar" onClick={onClose} />
      <div className="merchant-overlay-panel" role="dialog" aria-labelledby="merchant-overlay-title">
        <button type="button" className="city-overlay-cancel" onClick={onClose}>
          Cerrar
        </button>
        <h3 id="merchant-overlay-title" className="merchant-overlay-title">
          {spec.name}
        </h3>

        <section className="merchant-overlay-section">
          <h4>Compra</h4>
          {!merchantState || merchantState.tiles.length === 0 ? (
            <p className="muted-inline">Sin fichas de comerciante activas.</p>
          ) : (
            <ul className="merchant-overlay-slots">
              {merchantState.tiles.map((tile, i) => {
                const detail = merchantTileDetail(tile);
                if (tile === 'blank') return null;
                return (
                <li key={i}>
                  <span className="merchant-slot-icon-wrap merchant-slot-icon-wrap-lg">
                    <MerchantSlotIcon tile={tile as IndustryType | 'any'} size={26} />
                  </span>
                  <div className="merchant-slot-meta">
                    <span className="merchant-slot-name">{merchantTileLabel(tile)}</span>
                    {detail && <span className="merchant-slot-detail">{detail}</span>}
                    <span className={`merchant-slot-beer${merchantState.beer[i] ? ' available' : ' spent'}`}>
                      {merchantState.beer[i] ? 'Cerveza disponible' : 'Cerveza agotada'}
                    </span>
                  </div>
                </li>
              );})}
            </ul>
          )}
          {beerTotal > 0 && (
            <div className="merchant-beer-summary" data-testid="merchant-beer-summary">
              <BeerIconRow beer={activeBeer} size={22} />
              <p>
                Cerveza restante: <strong>{beerLeft}</strong> de {beerTotal}
              </p>
            </div>
          )}
        </section>

        <section className="merchant-overlay-section">
          <h4>Bonificación mercado</h4>
          <div className="merchant-bonus-display">
            <MerchantBonusDisplay bonus={spec.bonus} size={26} title={merchantBonusLabel(spec.bonus)} />
            <p>{merchantBonusLabel(spec.bonus)}</p>
          </div>
        </section>

        <section className="merchant-overlay-section">
          <h4>Enlace</h4>
          <p>2 PV por cada vía conectada al puntuar.</p>
        </section>

        <section className="merchant-overlay-section merchant-overlay-coal">
          <h4>Carbón (mercado)</h4>
          <p>{COAL_MARKET_CONNECTION_HINT}</p>
        </section>
      </div>
    </div>
  );
}
